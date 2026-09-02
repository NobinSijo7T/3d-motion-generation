from __future__ import annotations

import re


def split_compound_motion_prompt(prompt: str) -> list[str]:
    """Split simple compound prompts into model-friendly action clauses."""

    text = re.sub(r"\s+", " ", prompt.strip())
    if not text:
        return []

    parts = [
        part.strip(" ,.;")
        for part in re.split(r"\b(?:then|after that|and then)\b", text, flags=re.IGNORECASE)
        if part.strip(" ,.;")
    ]

    if len(parts) <= 1:
        return [text]

    return [normalize_motion_prompt(part) for part in parts]


def normalize_motion_prompt(prompt: str) -> str:
    """Make planner text friendlier for HumanML3D-style text-to-motion models."""

    text = re.sub(r"\s+", " ", prompt.strip())
    lower = text.lower()
    turn_degrees = re.search(r"\b(90|180|270|360)\s*(?:°|degree|degrees|deg)\b", lower)

    if turn_degrees:
        degrees = turn_degrees.group(1)
        if any(word in lower for word in ("spin", "rotate", "turn")):
            return f"a person turns {degrees} degrees in place with the whole body"

    if any(phrase in lower for phrase in ("turn around", "turns around", "about face", "u turn", "u-turn")):
        return "a person turns 180 degrees in place with the whole body"

    if any(phrase in lower for phrase in ("full turn", "full spin", "spin around", "complete turn")):
        return "a person turns 360 degrees in place with the whole body"

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
