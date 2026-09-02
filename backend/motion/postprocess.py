from __future__ import annotations

import numpy as np
from scipy.ndimage import gaussian_filter1d

from ..config import settings
from ..utils.errors import AppError, CONVERSION_FAILED
from .converter import JOINTS, to_joint_positions


def postprocess(
    raw: np.ndarray,
    target_frames: int | None = None,
    joints_num: int | None = JOINTS,
) -> np.ndarray:
    try:
        joints = to_joint_positions(raw, joints_num=joints_num)
    except (ValueError, IndexError) as exc:
        raise AppError(CONVERSION_FAILED, 500) from exc

    joints = np.nan_to_num(joints, nan=0.0, posinf=0.0, neginf=0.0)
    if joints.ndim != 3 or joints.shape[2] != 3:
        raise AppError(CONVERSION_FAILED, 500)
    joint_count = joints.shape[1]

    floor = float(np.min(joints[:, :, 1]))
    joints[:, :, 1] -= floor
    root_xz = joints[0, 0, [0, 2]].copy()
    joints[:, :, 0] -= root_xz[0]
    joints[:, :, 2] -= root_xz[1]
    joints = gaussian_filter1d(joints, sigma=0.8, axis=0)

    if target_frames and target_frames > 1 and joints.shape[0] != target_frames:
        src = np.linspace(0, 1, joints.shape[0])
        dst = np.linspace(0, 1, target_frames)
        resampled = np.zeros((target_frames, joint_count, 3), dtype=np.float32)
        for j in range(joint_count):
            for c in range(3):
                resampled[:, j, c] = np.interp(dst, src, joints[:, j, c])
        joints = resampled

    max_frames = int(settings.max_duration * settings.fps)
    if joints.shape[0] > max_frames:
        joints = joints[:max_frames]
    return joints.astype(np.float32)
