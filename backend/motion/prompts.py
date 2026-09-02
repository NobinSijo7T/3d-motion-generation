from __future__ import annotations

import re


def normalize_motion_prompt(prompt: str) -> str:
    """Make planner text friendlier for HumanML3D-style text-to-motion models."""

    text = re.sub(r"\s+", " ", prompt.strip())
    lower = text.lower()

    replacements = [
        (
            ("pick", "object"),
            "a person bends down, reaches forward, picks up an object from the ground, and stands upright",
        ),
        (
            ("pick up",),
            "a person bends down, reaches forward, picks something up from the ground, and stands upright",
        ),
        (
            ("sit", "stand"),
            "a person sits down, pauses briefly, and stands back up",
        ),
        (
            ("turn", "walk"),
            "a person walks forward, turns smoothly, and continues walking",
        ),
        (
            ("wave", "right"),
            "a person stands in place and waves with the right hand",
        ),
        (
            ("wave",),
            "a person stands in place and waves one hand",
        ),
    ]

    for needles, replacement in replacements:
        if all(needle in lower for needle in needles):
            return replacement

    if not lower.startswith(("a person", "person", "someone", "the person")):
        text = f"a person {text}"

    return text

