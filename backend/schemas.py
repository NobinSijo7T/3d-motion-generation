from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, field_validator


class MotionAction(BaseModel):
    action: str
    motion_prompt: str
    duration: float = Field(ge=0.25, le=30)
    speed: float = Field(default=1.0, ge=0.1, le=3.0)
    direction: str = "forward"
    transition: str = "smooth"


class MotionPlan(BaseModel):
    original_prompt: str
    style: str = "natural"
    speed: float = Field(default=1.0, ge=0.1, le=3.0)
    total_duration: float = Field(gt=0, le=60)
    actions: list[MotionAction] = Field(min_length=1)

    @field_validator("original_prompt")
    @classmethod
    def prompt_not_empty(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Prompt cannot be empty")
        return value.strip()


class PlanRequest(BaseModel):
    prompt: str = Field(min_length=3, max_length=2000)


class GenerateRequest(BaseModel):
    prompt: str = Field(min_length=3, max_length=2000)
    duration: float | None = Field(default=None, gt=0, le=9)
    variations: int = Field(default=1, ge=1, le=3)
    motion_engine: str | None = Field(default=None, pattern="^(preview|humanml3d|kimodo)$")


class HealthResponse(BaseModel):
    status: str
    groq_configured: bool
    cuda_available: bool
    motion_model_available: bool
    gpu: str | None = None


class GenerateResponse(BaseModel):
    success: bool
    motion_id: str
    status: str
    plan: MotionPlan


class MotionRecord(BaseModel):
    id: str
    prompt: str
    model: str
    fps: int
    duration: float
    frames: int
    joints: int
    motion_path: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime | str
    plan: MotionPlan | None = None
