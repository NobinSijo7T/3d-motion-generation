from __future__ import annotations

import math
import re

import numpy as np


def detect_turn_degrees(prompt: str) -> float:
    text = prompt.lower()
    match = re.search(r"\b(90|180|270|360)\s*(?:°|degree|degrees|deg)\b", text)
    if match:
        return float(match.group(1))
    if any(phrase in text for phrase in ("turn around", "turns around", "about face", "u turn", "u-turn")):
        return 180.0
    if any(phrase in text for phrase in ("full turn", "full spin", "spin around", "complete turn")):
        return 360.0
    return 0.0


def turn_is_clockwise(prompt: str) -> bool:
    """Interpret rightward turns consistently across local motion engines."""

    text = prompt.lower()
    return "turn right" in text or "turns right" in text or "to the right" in text


def apply_yaw_turn(joints: np.ndarray, degrees: float, clockwise: bool = False) -> np.ndarray:
    """Rotate a motion clip around the root over time.

    This is used for prompts that require an exact visual heading change. Older
    text-to-motion checkpoints can produce a plausible turn without ending at
    the requested 180/360 degree orientation, so we enforce the heading here.
    """

    if abs(degrees) < 0.001 or joints.ndim != 3 or joints.shape[0] < 2:
        return joints

    signed_degrees = -degrees if clockwise else degrees
    frames = joints.astype(np.float32, copy=True)
    frame_count = frames.shape[0]

    for index in range(frame_count):
        t = index / max(1, frame_count - 1)
        # Ease in/out so the person shifts weight into the turn and settles
        # into the new heading. Linear rotation makes the whole body look
        # mechanically driven, especially for 180° and 360° turns.
        eased = t * t * (3.0 - 2.0 * t)
        angle = math.radians(signed_degrees * eased)
        cos_a = math.cos(angle)
        sin_a = math.sin(angle)
        root = frames[index, 0, [0, 2]].copy()
        x = frames[index, :, 0] - root[0]
        z = frames[index, :, 2] - root[1]
        frames[index, :, 0] = root[0] + x * cos_a - z * sin_a
        frames[index, :, 2] = root[1] + x * sin_a + z * cos_a

    return frames
