from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="HumanML3D text-to-motion worker")
    parser.add_argument("--text", required=True)
    parser.add_argument("--output-id", required=True)
    parser.add_argument("--repeat-time", type=int, default=1)
    parser.add_argument("--engine-path", required=True)
    parser.add_argument("--checkpoint", default="Comp_v6_KLD01")
    parser.add_argument("--gpu-id", type=int, default=0)
    parser.add_argument("--output-dir", required=True)
    args = parser.parse_args()

    engine = Path(args.engine_path).resolve()
    sys.path.insert(0, str(engine))

    try:
        import numpy as np
        import torch
        from scripts.motion_process import recover_from_ric
        from utils.paramUtil import t2m_kinematic_chain  # noqa: F401
    except Exception as exc:
        print(f"Failed to import motion engine: {exc}", file=sys.stderr)
        return 2

    checkpoint = engine / "checkpoints" / "t2m" / args.checkpoint / "model" / "latest.tar"
    length_est = engine / "checkpoints" / "t2m" / "length_est_bigru" / "model" / "latest.tar"
    glove = engine / "glove" / "our_vab_data.npy"
    if not checkpoint.exists() or not length_est.exists() or not glove.exists():
        print("Local motion-model checkpoint is missing.", file=sys.stderr)
        return 3

    if args.gpu_id >= 0 and not torch.cuda.is_available():
        print("CUDA is not available. Local motion generation cannot use the RTX GPU.", file=sys.stderr)
        return 4

    input_file = Path(args.output_dir) / f"{args.output_id}.txt"
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    input_file.write_text(args.text.strip() + "\n", encoding="utf-8")

    # Invoke upstream generator with batch size 1. Uses official CLI flags.
    from os.path import join as pjoin

    from torch.utils.data import DataLoader
    from options.evaluate_options import TestOptions
    from networks.modules import (
        AttLayer,
        MotionLenEstimatorBiGRU,
        MovementConvDecoder,
        MovementConvEncoder,
        TextDecoder,
        TextEncoderBiGRU,
        TextVAEDecoder,
    )
    from networks.trainers import CompTrainerV6
    from data.dataset import RawTextDataset
    from utils.word_vectorizer import POS_enumerator, WordVectorizer
    import torch.nn as nn

    sys.argv = [
        "motion_worker",
        "--name",
        args.checkpoint,
        "--text_file",
        str(input_file),
        "--repeat_times",
        str(args.repeat_time),
        "--gpu_id",
        str(args.gpu_id if torch.cuda.is_available() else -1),
        "--ext",
        "studio",
        "--checkpoints_dir",
        str(engine / "checkpoints"),
    ]
    opt = TestOptions().parse()
    opt.do_denoise = True
    opt.device = torch.device("cpu" if opt.gpu_id == -1 else f"cuda:{opt.gpu_id}")
    opt.save_root = pjoin(opt.checkpoints_dir, opt.dataset_name, opt.name)
    opt.model_dir = pjoin(opt.save_root, "model")
    opt.meta_dir = pjoin(opt.save_root, "meta")
    opt.joints_num = 22
    dim_pose = 263
    dim_word = 300
    dim_pos_ohot = len(POS_enumerator)
    num_classes = 200 // opt.unit_length
    mean = np.load(pjoin(opt.meta_dir, "mean.npy"))
    std = np.load(pjoin(opt.meta_dir, "std.npy"))
    w_vectorizer = WordVectorizer(str(engine / "glove"), "our_vab")
    opt.max_motion_length = 196

    text_encoder = TextEncoderBiGRU(
        word_size=dim_word,
        pos_size=dim_pos_ohot,
        hidden_size=opt.dim_text_hidden,
        device=opt.device,
    )
    text_size = opt.dim_text_hidden * 2
    seq_prior = TextDecoder(
        text_size=text_size,
        input_size=opt.dim_att_vec + opt.dim_movement_latent,
        output_size=opt.dim_z,
        hidden_size=opt.dim_pri_hidden,
        n_layers=opt.n_layers_pri,
    )
    seq_decoder = TextVAEDecoder(
        text_size=text_size,
        input_size=opt.dim_att_vec + opt.dim_z + opt.dim_movement_latent,
        output_size=opt.dim_movement_latent,
        hidden_size=opt.dim_dec_hidden,
        n_layers=opt.n_layers_dec,
    )
    att_layer = AttLayer(query_dim=opt.dim_pos_hidden, key_dim=text_size, value_dim=opt.dim_att_vec)
    movement_enc = MovementConvEncoder(dim_pose - 4, opt.dim_movement_enc_hidden, opt.dim_movement_latent)
    movement_dec = MovementConvDecoder(opt.dim_movement_latent, opt.dim_movement_dec_hidden, dim_pose)
    trainer = CompTrainerV6(opt, text_encoder, seq_prior, seq_decoder, att_layer, movement_dec, mov_enc=movement_enc)
    trainer.load(pjoin(opt.model_dir, "latest.tar"))
    trainer.eval_mode()
    trainer.to(opt.device)

    estimator = MotionLenEstimatorBiGRU(dim_word, dim_pos_ohot, 512, num_classes)
    map_location = opt.device
    checkpoints = torch.load(str(length_est), map_location=map_location)
    estimator.load_state_dict(checkpoints["estimator"])
    estimator.to(opt.device)
    estimator.eval()

    dataset = RawTextDataset(opt, mean, std, str(input_file), w_vectorizer)
    loader = DataLoader(dataset, batch_size=1, drop_last=False, num_workers=0)

    joints_out = None
    ric_out = None
    with torch.no_grad():
        for data in loader:
            word_emb, pos_ohot, caption, cap_lens = data
            word_emb = word_emb.detach().to(opt.device).float()
            pos_ohot = pos_ohot.detach().to(opt.device).float()
            pred_dis = nn.Softmax(-1)(estimator(word_emb, pos_ohot, cap_lens)).squeeze()
            length = torch.multinomial(pred_dis, 1)
            m_lens = length * opt.unit_length
            pred_motions, _, _ = trainer.generate(
                word_emb, pos_ohot, cap_lens, m_lens, m_lens[0] // opt.unit_length, dim_pose
            )
            ric_out = pred_motions.cpu().numpy()
            recovered = recover_from_ric(torch.from_numpy(dataset.inv_transform(ric_out)).float(), opt.joints_num)
            joints_out = recovered.numpy()
            break

    if joints_out is None:
        print("Local motion generation failed.", file=sys.stderr)
        return 5

    if joints_out.ndim == 4:
        joints_out = joints_out[0]
    if ric_out.ndim == 3:
        ric_out = ric_out[0]

    joints_path = output_dir / f"{args.output_id}.npy"
    ric_path = output_dir / f"{args.output_id}_ric.npy"
    np.save(joints_path, joints_out)
    np.save(ric_path, ric_out)
    payload = {
        "motion_id": args.output_id,
        "motion_file": str(joints_path),
        "metadata": {
            "caption": args.text,
            "frames": int(joints_out.shape[0]),
            "joints": 22,
            "checkpoint": args.checkpoint,
        },
    }
    (output_dir / f"{args.output_id}.meta.json").write_text(json.dumps(payload), encoding="utf-8")
    print(json.dumps(payload))
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
