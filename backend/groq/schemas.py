from __future__ import annotations

MOTION_PLAN_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "original_prompt": {"type": "string"},
        "style": {"type": "string"},
        "speed": {"type": "number"},
        "total_duration": {"type": "number"},
        "actions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "action": {"type": "string"},
                    "motion_prompt": {"type": "string"},
                    "duration": {"type": "number"},
                    "speed": {"type": "number"},
                    "direction": {"type": "string"},
                    "transition": {"type": "string"},
                },
                "required": [
                    "action",
                    "motion_prompt",
                    "duration",
                    "speed",
                    "direction",
                    "transition",
                ],
                "additionalProperties": False,
            },
        },
    },
    "required": ["original_prompt", "style", "speed", "total_duration", "actions"],
    "additionalProperties": False,
}

SYSTEM_PROMPT = """You are a professional human-motion planning engine.
Convert natural language into a physically plausible sequence of human body motions.
Break compound instructions into atomic actions.
Preserve chronological ordering.
Generate concise natural-language motion prompts suitable for a HumanML3D-style text-to-motion model.
Avoid abstract or nonphysical descriptions.
Convert emotional or contextual language into observable body movement.
Estimate realistic durations.
Estimate speed.
Define transitions between actions.
Do not generate code.
Do not generate explanations.
Return only the requested structured JSON object.
"""
