from __future__ import annotations

import re


def split_compound_motion_prompt(prompt: str) -> list[str]:
    """Split simple compound prompts into model-friendly action clauses."""

    text = re.sub(r"\s+", " ", prompt.strip())
    text = re.sub(r"\bsites\b", "sits", text, flags=re.IGNORECASE)
    if not text:
        return []

    lower = text.lower()
    has_throw = any(word in lower for word in ("throw", "throws", "threw", "toss", "tosses", "tossed"))
    has_pickup = any(word in lower for word in ("pick", "picks", "picked", "pickup", "grab", "grabs"))
    if has_throw and "ball" in lower and not has_pickup:
        return [
            normalize_motion_prompt("a person bends down, picks up a ball from the ground, and stands upright"),
            normalize_motion_prompt(text),
        ]

    parts = [
        part.strip(" ,.;")
        for part in re.split(r"\b(?:then|after that|and then)\b", text, flags=re.IGNORECASE)
        if part.strip(" ,.;")
    ]

    # People commonly omit “then” in prompts such as “pick up a box and sit
    # down”. Keep those as separate clips so the renderer can preserve the
    # object in the hand during the second action.
    if len(parts) == 1:
        parts = [
            part.strip(" ,.;")
            for part in re.split(
                r"\s*(?:,|\band\b)\s*(?=(?:then\s+)?(?:sit|sits|stand|stands|stop|stops|pick|picks|throw|throws|turn|turns|wave|waves|jump|jumps|land|lands|walk|walks|run|runs|raise|raises|crouch|crouches|kneel|kneels|lie|lies)\b)",
                text,
                flags=re.IGNORECASE,
            )
            if part.strip(" ,.;")
        ]

    if len(parts) <= 1:
        return [text]

    # Resolve “it” in a throw-and-retrieve command so the second model pass
    # still receives a concrete, model-friendly ball interaction.
    if "ball" in text.lower():
        parts = [
            "pick up the ball from the ground" if "pick" in part.lower() and "ball" not in part.lower() else part
            for part in parts
        ]

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

    if "turn left" in lower or "turns left" in lower:
        return "a person turns 90 degrees to the left with the whole body"

    if "turn right" in lower or "turns right" in lower:
        return "a person turns 90 degrees to the right with the whole body"

    replacements = [
        (
            ("throw", "ball"),
            "a person throws a ball forward with one hand",
        ),
        (
            ("pick", "ball"),
            "a person bends down, picks up a ball from the ground, and stands upright",
        ),
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
            ("raise", "arm"),
            "a person stands in place and raises both arms overhead",
        ),
        (
            ("lie",),
            "a person lowers their body and lies down on the ground",
        ),
        (
            ("kneel",),
            "a person kneels down on the ground",
        ),
        (
            ("crouch",),
            "a person crouches down and holds a low position",
        ),
        (
            ("stop",),
            "a person stops and stands still",
        ),
        (
            ("land",),
            "a person lands softly on both feet",
        ),
        (
            ("walk", "circle"),
            "a person walks forward in a wide circle",
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
