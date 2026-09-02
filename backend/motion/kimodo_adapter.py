from __future__ import annotations

import os
import subprocess
from pathlib import Path

from ..config import settings
from ..utils.errors import AppError, CUDA_OOM, MISSING_CHECKPOINT
from ..utils.logging import log

HF_GATE_ERROR = (
    "Kimodo is installed, but its gated Hugging Face text encoder is not available. "
    "Wait for Meta Llama 3 access approval, then run hf auth login inside .venv-kimodo."
)


def kimodo_ready() -> bool:
    return settings.kimodo_available()


def generate_with_kimodo(
    text: str,
    output_id: str,
    duration: float,
    num_samples: int = 1,
) -> dict:
    if not kimodo_ready():
        raise AppError("Kimodo is not installed. Set KIMODO_PATH and KIMODO_PYTHON in .env.", 503)

    output_stem = settings.kimodo_cache_dir / output_id
    cmd = [
        str(settings.kimodo_python_path()),
        "-m",
        "kimodo.scripts.generate",
        text,
        "--model",
        settings.kimodo_model,
        "--duration",
        str(duration),
        "--num_samples",
        str(max(1, min(num_samples, settings.max_variations))),
        "--diffusion_steps",
        str(settings.kimodo_diffusion_steps),
        "--output",
        str(output_stem),
        "--save_example_dir",
    ]
    env = os.environ.copy()
    env["TEXT_ENCODER_DEVICE"] = settings.kimodo_text_encoder_device
    env.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")
    env["PYTHONPATH"] = str(settings.kimodo_path)

    completed = subprocess.run(
        cmd,
        cwd=str(settings.kimodo_path),
        capture_output=True,
        text=True,
        env=env,
        timeout=900,
        check=False,
    )
    combined = f"{completed.stdout or ''}\n{completed.stderr or ''}"
    log.info("kimodo worker exit=%s", completed.returncode)
    if completed.returncode != 0:
        lower = combined.lower()
        if "gated repo" in lower or "meta-llama" in lower or "403 forbidden" in lower:
            raise AppError(HF_GATE_ERROR, 503)
        if "out of memory" in lower or "cuda" in combined and "memory" in lower:
            raise AppError(CUDA_OOM, 507)
        raise AppError("Kimodo motion generation failed. Check logs and Kimodo environment.", 500)

    motion_file = _first_output_npz(output_stem, num_samples)
    if motion_file is None:
        raise AppError(MISSING_CHECKPOINT, 500)

    return {
        "motion_file": str(motion_file),
        "metadata": {
            "engine": "kimodo",
            "model": settings.kimodo_model,
            "text_encoder_device": settings.kimodo_text_encoder_device,
            "diffusion_steps": settings.kimodo_diffusion_steps,
            "stdout": completed.stdout[-2000:],
        },
    }


def _first_output_npz(output_stem: Path, num_samples: int) -> Path | None:
    single = output_stem.with_suffix(".npz")
    if single.exists():
        return single
    if num_samples <= 1:
        return None
    folder = output_stem
    if not folder.exists():
        return None
    matches = sorted(folder.glob("*.npz"))
    return matches[0] if matches else None
