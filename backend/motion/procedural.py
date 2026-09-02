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
    is_chair_stand = "chair" in prompt and any(phrase in prompt for phrase in ("stand up", "stands up", "standing up"))
    is_throw_retrieve = "ball" in prompt and any(word in prompt for word in ("throw", "throws", "threw")) and any(word in prompt for word in ("pick", "picks", "picked", "retrieve"))
    for frame in range(frame_count):
        t = frame / max(1, frame_count - 1)
        pose = BASE_POSE.copy()
        is_walking = any(word in prompt for word in ("walk", "run", "forward"))
        stride = math.sin(t * math.tau * max(1.0, duration * 0.85))
        opposite = -stride
        forward = 1.2 * t if is_walking else 0.0
        crouch = 0.32 * max(0.0, math.sin(t * math.pi)) if any(word in prompt for word in ("sit", "crouch", "squat")) else 0.0
        jump = 0.35 * max(0.0, math.sin(t * math.tau)) if "jump" in prompt else 0.0
        wave = math.sin(t * math.tau * 2.0) if any(word in prompt for word in ("wave", "hello", "hand")) else 0.0

        if is_chair_stand:
            # Build a real sit-to-stand transition rather than treating the
            # request as a generic crouch. Feet stay on the floor, the knees
            # begin forward, and the pelvis/torso rise together.
            seated = BASE_POSE.copy()
            seated[[0, 1, 2, 3, 6, 9, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21], 1] -= 0.46
            seated[[4, 5], 2] += 0.32
            rise = t * t * (3.0 - 2.0 * t)
            pose = seated * (1.0 - rise) + BASE_POSE * rise

        if is_throw_retrieve:
            # Key poses share the same timing as the viewport ball: release
            # at 28%, landing near 52%, then a grounded reach and recovery.
            wind_up = BASE_POSE.copy()
            wind_up[[17, 19, 21], 2] -= [0.10, 0.22, 0.28]
            wind_up[[17, 19, 21], 1] += [0.04, 0.10, 0.14]

            release = BASE_POSE.copy()
            release[[17, 19, 21], 2] += [0.16, 0.42, 0.64]
            release[[17, 19, 21], 1] += [0.08, 0.16, 0.24]
            release[[16, 18, 20], 2] -= [0.08, 0.15, 0.2]

            reach = BASE_POSE.copy()
            reach[[0, 1, 2, 3, 6, 9, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21], 1] -= 0.34
            reach[[4, 5], 1] -= 0.1
            reach[[4, 5], 2] += 0.24
            reach[[17, 19, 21], 2] += [0.2, 0.62, 1.02]
            reach[[17, 19, 21], 1] = [0.72, 0.38, 0.13]

            carry = BASE_POSE.copy()
            carry[[17, 19, 21], 2] += [0.08, 0.17, 0.22]
            carry[[17, 19, 21], 1] += [0.0, 0.04, 0.08]

            key_poses = ((0.0, BASE_POSE), (0.16, wind_up), (0.28, release), (0.52, release), (0.66, reach), (0.84, carry), (1.0, carry))
            for (start_time, start_pose), (end_time, end_pose) in zip(key_poses, key_poses[1:]):
                if start_time <= t <= end_time:
                    progress = (t - start_time) / max(0.001, end_time - start_time)
                    progress = progress * progress * (3.0 - 2.0 * progress)
                    pose = start_pose * (1.0 - progress) + end_pose * progress
                    break

        pose[:, 2] += forward
        pose[:, 1] += jump
        if crouch:
            # Keep the feet planted. Lowering every joint sinks the character
            # through the floor; instead lower the pelvis/torso and bring the
            # knees forward to form a readable, weight-bearing squat.
            upper_body = [0, 1, 2, 3, 6, 9, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]
            pose[upper_body, 1] -= crouch
            pose[[4, 5], 1] -= crouch * 0.28
            pose[[4, 5], 2] += crouch * 0.62
        if is_walking:
            # A walk is an alternating, full-leg cycle. Moving just the feet
            # makes the body look as though it is being translated over the
            # ground, so knees, ankles, toes, elbows, and wrists all follow
            # their respective swing phases.
            body_bob = 0.018 * math.sin(t * math.tau * max(1.0, duration * 1.7))
            pose[:, 1] += body_bob
            for swing, knee, ankle, toe in ((stride, 4, 7, 10), (opposite, 5, 8, 11)):
                lift = max(0.0, swing)
                pose[knee, 2] += 0.13 * swing
                pose[knee, 1] += 0.075 * lift
                pose[ankle, 2] += 0.24 * swing
                pose[ankle, 1] += 0.11 * lift
                pose[toe, 2] += 0.27 * swing
                pose[toe, 1] += 0.09 * lift
            for swing, elbow, wrist in ((opposite, 18, 20), (stride, 19, 21)):
                pose[elbow, 2] += 0.12 * swing
                pose[wrist, 2] += 0.2 * swing
                pose[elbow, 1] += 0.025 * max(0.0, swing)
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
