from __future__ import annotations

from pathlib import Path

import numpy as np

from ..config import settings
from ..database import save_motion
from ..schemas import MotionPlan
from ..utils.errors import AppError, CONVERSION_FAILED
from ..utils.files import new_motion_id, safe_join
from .adapter import generate_with_engine
from .kimodo_adapter import generate_with_kimodo
from .postprocess import postprocess
from .prompts import normalize_motion_prompt
from .procedural import generate_preview_motion


def _load_motion_array(path: Path) -> np.ndarray:
    loaded = np.load(path)
    if isinstance(loaded, np.lib.npyio.NpzFile):
        if "posed_joints" not in loaded.files:
            raise AppError(CONVERSION_FAILED, 500)
        return loaded["posed_joints"]
    return loaded


def _target_frames_for(duration: float) -> int:
    return max(2, int(min(duration, settings.max_duration) * settings.fps))


def _append_segment(segments: list[np.ndarray], segment: np.ndarray) -> None:
    if not segments:
        segments.append(segment)
        return

    previous = segments[-1]
    offset = previous[-1, 0, [0, 2]] - segment[0, 0, [0, 2]]
    aligned = segment.copy()
    aligned[:, :, 0] += offset[0]
    aligned[:, :, 2] += offset[1]
    segments.append(aligned[1:])


def _generate_humanml3d_segments(plan: MotionPlan, motion_id: str, variations: int) -> tuple[np.ndarray, dict]:
    segments: list[np.ndarray] = []
    prompts: list[str] = []

    for index, action in enumerate(plan.actions):
        prompt = normalize_motion_prompt(action.motion_prompt or action.action)
        prompts.append(prompt)
        segment_id = f"{motion_id}-seg{index + 1}"
        result = generate_with_engine(prompt, segment_id, repeat_time=variations)
        motion_file = Path(result["motion_file"])
        if not motion_file.exists():
            raise AppError(CONVERSION_FAILED, 500)
        raw = _load_motion_array(motion_file)
        target_frames = _target_frames_for(action.duration)
        segment = postprocess(raw, target_frames=target_frames, joints_num=22)
        _append_segment(segments, segment)

    if not segments:
        raise AppError(CONVERSION_FAILED, 500)

    return np.concatenate(segments, axis=0), {"segment_prompts": prompts}


def generate_motion(plan: MotionPlan, variations: int = 1, motion_engine: str | None = None) -> dict:
    motion_id = new_motion_id()
    prompt = " ".join(normalize_motion_prompt(action.motion_prompt) for action in plan.actions)
    target_frames = _target_frames_for(plan.total_duration)
    selected_engine = (motion_engine or settings.motion_engine).lower()
    if selected_engine == "kimodo":
        result = generate_with_kimodo(
            prompt,
            motion_id,
            duration=min(plan.total_duration, settings.max_duration),
            num_samples=variations,
        )
        model_name = f"Kimodo/{settings.kimodo_model}"
        joints_num = None
    elif selected_engine == "humanml3d":
        joints, segment_metadata = _generate_humanml3d_segments(plan, motion_id, variations)
        result = {"metadata": segment_metadata}
        model_name = f"HumanML3D/{settings.motion_checkpoint}"
        motion_file = None
        joints_num = None
    else:
        result = generate_preview_motion(plan, motion_id)
        model_name = "Procedural Preview"
        joints_num = 22
    if selected_engine != "humanml3d":
        motion_file = Path(result["motion_file"])
        if not motion_file.exists():
            raise AppError(CONVERSION_FAILED, 500)
        raw = _load_motion_array(motion_file)
        joints = postprocess(raw, target_frames=target_frames, joints_num=joints_num)
    elif joints.shape[0] != target_frames:
        joints = postprocess(joints, target_frames=target_frames, joints_num=None)
    dest = safe_join(settings.motion_dir, f"{motion_id}.npy")
    np.save(dest, joints)
    joint_count = int(joints.shape[1])
    metadata = {
        "id": motion_id,
        "prompt": plan.original_prompt,
        "model": model_name,
        "fps": settings.fps,
        "duration": float(joints.shape[0] / settings.fps),
        "frames": int(joints.shape[0]),
        "joints": joint_count,
        "motion_path": str(dest),
        "plan": plan.model_dump(),
        "status": "completed",
        "engine": result.get("metadata", {}),
    }
    save_motion(
        motion_id=motion_id,
        prompt=plan.original_prompt,
        model=metadata["model"],
        fps=settings.fps,
        duration=metadata["duration"],
        frames=metadata["frames"],
        joints=joint_count,
        motion_path=str(dest),
        metadata=metadata,
    )
    return metadata
