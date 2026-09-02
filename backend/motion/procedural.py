from __future__ import annotations

import math

import numpy as np

from ..config import settings
from ..schemas import MotionPlan
from ..utils.files import safe_join


BASE_POSE = np.array(
    [
        [0.0, 0.95, 0.0],
        [-0.12, 0.85, 0.0],
        [0.12, 0.85, 0.0],
        [0.0, 1.1, 0.0],
        [-0.14, 0.45, 0.0],
        [0.14, 0.45, 0.0],
        [0.0, 1.3, 0.0],
        [-0.14, 0.08, 0.02],
        [0.14, 0.08, -0.02],
        [0.0, 1.48, 0.0],
        [-0.14, 0.02, 0.16],
        [0.14, 0.02, 0.16],
        [0.0, 1.62, 0.0],
        [-0.16, 1.45, 0.0],
        [0.16, 1.45, 0.0],
        [0.0, 1.78, 0.0],
        [-0.36, 1.38, 0.0],
        [0.36, 1.38, 0.0],
        [-0.55, 1.1, 0.02],
        [0.55, 1.1, 0.02],
        [-0.62, 0.84, 0.02],
        [0.62, 0.84, 0.02],
    ],
    dtype=np.float32,
)


def generate_preview_motion(plan: MotionPlan, output_id: str) -> dict:
    duration = min(plan.total_duration, settings.max_duration)
    frame_count = max(2, int(duration * settings.fps))
    frames = np.zeros((frame_count, 22, 3), dtype=np.float32)
    prompt = plan.original_prompt.lower()
    for frame in range(frame_count):
        t = frame / max(1, frame_count - 1)
        pose = BASE_POSE.copy()
        stride = math.sin(t * math.tau * max(1.0, duration * 0.85))
        opposite = math.sin(t * math.tau * max(1.0, duration * 0.85) + math.pi)
        forward = 1.2 * t if any(word in prompt for word in ("walk", "run", "forward")) else 0.0
        crouch = 0.32 * max(0.0, math.sin(t * math.pi)) if any(word in prompt for word in ("sit", "crouch", "squat")) else 0.0
        jump = 0.35 * max(0.0, math.sin(t * math.tau)) if "jump" in prompt else 0.0
        wave = math.sin(t * math.tau * 2.0) if any(word in prompt for word in ("wave", "hello", "hand")) else 0.0

        pose[:, 2] += forward
        pose[:, 1] -= crouch
        pose[:, 1] += jump
        pose[[7, 10], 2] += 0.15 * stride
        pose[[8, 11], 2] += 0.15 * opposite
        pose[[18, 20], 2] += 0.12 * opposite
        pose[[19, 21], 2] += 0.12 * stride
        if wave:
            pose[17, 1] += 0.22
            pose[19, 1] += 0.35
            pose[21, 1] += 0.52
            pose[21, 0] += 0.14 * wave
        frames[frame] = pose

    dest = safe_join(settings.kimodo_cache_dir, f"{output_id}-preview.npy")
    np.save(dest, frames)
    return {
        "motion_file": str(dest),
        "metadata": {
            "engine": "preview",
            "model": "Procedural Preview",
            "note": "No-checkpoint local preview animation.",
        },
    }
