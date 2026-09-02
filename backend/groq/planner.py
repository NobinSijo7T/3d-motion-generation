from __future__ import annotations

import json
import re

from groq import APIError
from pydantic import ValidationError

from ..config import settings
from ..schemas import MotionPlan
from ..utils.errors import AppError, GROQ_FAILED, INVALID_PLAN, MISSING_GROQ_KEY
from .client import groq_client
from .schemas import MOTION_PLAN_JSON_SCHEMA, SYSTEM_PROMPT


def _extract_json(text: str) -> dict:
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            raise AppError(INVALID_PLAN, 502)
        return json.loads(match.group(0))


async def plan_motion(prompt: str) -> MotionPlan:
    if not settings.groq_configured:
        raise AppError(MISSING_GROQ_KEY, 503)

    client = groq_client()
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": prompt},
    ]
    last_error: str | None = None

    for attempt in range(2):
        user_messages = list(messages)
        if attempt == 1 and last_error:
            user_messages.append(
                {
                    "role": "user",
                    "content": (
                        "The previous JSON was invalid. Return only valid JSON matching the schema. "
                        f"Validation error: {last_error}"
                    ),
                }
            )
        try:
            response = await client.chat.completions.create(
                model=settings.groq_model,
                messages=user_messages,
                temperature=0.2,
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "motion_plan",
                        "strict": True,
                        "schema": MOTION_PLAN_JSON_SCHEMA,
                    },
                },
            )
        except APIError as exc:
            if attempt == 0:
                try:
                    response = await client.chat.completions.create(
                        model=settings.groq_model,
                        messages=user_messages
                        + [
                            {
                                "role": "system",
                                "content": "Return a JSON object only. No markdown.",
                            }
                        ],
                        temperature=0.2,
                        response_format={"type": "json_object"},
                    )
                except APIError as inner:
                    raise AppError(GROQ_FAILED, 502) from inner
            else:
                raise AppError(GROQ_FAILED, 502) from exc

        content = response.choices[0].message.content or ""
        try:
            payload = _extract_json(content)
            payload.setdefault("original_prompt", prompt)
            plan = MotionPlan.model_validate(payload)
            plan.total_duration = min(plan.total_duration, settings.max_duration)
            return plan
        except (json.JSONDecodeError, ValidationError) as exc:
            last_error = str(exc)
            continue

    raise AppError(INVALID_PLAN, 502)
