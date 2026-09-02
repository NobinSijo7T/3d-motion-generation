from __future__ import annotations

import numpy as np
from fastapi.testclient import TestClient

from backend.api import generate as generate_api
from backend.config import settings
from backend.database import save_motion
from backend.rendering.skeleton import bones
from backend.main import app
from backend.motion.prompts import normalize_motion_prompt
from backend.schemas import MotionAction, MotionPlan


client = TestClient(app)


def sample_plan(prompt: str = "walk forward") -> MotionPlan:
    return MotionPlan(
        original_prompt=prompt,
        style="natural",
        speed=1.0,
        total_duration=1.0,
        actions=[
            MotionAction(
                action="walk",
                motion_prompt="a person walks forward",
                duration=1.0,
                speed=1.0,
                direction="forward",
                transition="smooth",
            )
        ],
    )


def test_health_reports_expected_flags() -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert "groq_configured" in payload
    assert "motion_model_available" in payload


def test_soma77_bones_use_kimodo_parent_hierarchy() -> None:
    soma_bones = bones(77)

    assert len(soma_bones) == 76
    assert [0, 1] in soma_bones
    assert [3, 11] in soma_bones
    assert [3, 39] in soma_bones
    assert [0, 67] in soma_bones
    assert [0, 72] in soma_bones
    assert [0, 76] not in soma_bones


def test_motion_prompt_normalization_for_object_interaction() -> None:
    prompt = normalize_motion_prompt("Pick an object")

    assert "bends down" in prompt
    assert "picks up an object" in prompt


def test_generate_uses_planner_and_motion_engine(monkeypatch) -> None:
    async def fake_plan_motion(prompt: str) -> MotionPlan:
        return sample_plan(prompt)

    def fake_generate_motion(
        plan: MotionPlan,
        variations: int = 1,
        motion_engine: str | None = None,
    ) -> dict:
        return {
            "id": "test-motion-id",
            "variations": variations,
            "motion_engine": motion_engine,
            "plan": plan.model_dump(),
        }

    monkeypatch.setattr(generate_api, "plan_motion", fake_plan_motion)
    monkeypatch.setattr(generate_api, "generate_motion", fake_generate_motion)

    response = client.post(
        "/api/generate",
        json={"prompt": "walk forward", "duration": 1.5, "variations": 2},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["motion_id"] == "test-motion-id"
    assert payload["plan"]["total_duration"] == 1.5


def test_preview_engine_generates_motion_without_checkpoint(monkeypatch) -> None:
    async def fake_plan_motion(prompt: str) -> MotionPlan:
        return sample_plan(prompt)

    monkeypatch.setattr(generate_api, "plan_motion", fake_plan_motion)

    response = client.post(
        "/api/generate",
        json={
            "prompt": "wave hello",
            "duration": 1,
            "variations": 1,
            "motion_engine": "preview",
        },
    )

    assert response.status_code == 200
    motion_id = response.json()["motion_id"]
    data_response = client.get(f"/api/motions/{motion_id}/data")
    payload = data_response.json()
    assert data_response.status_code == 200
    assert payload["joints"] == 22
    assert len(payload["frames"]) == 20


def test_motion_data_and_json_export_round_trip() -> None:
    motion_id = "test-motion-export"
    motion_path = settings.motion_dir / f"{motion_id}.npy"
    frames = np.zeros((2, 22, 3), dtype=np.float32)
    np.save(motion_path, frames)
    plan = sample_plan()
    metadata = {
        "plan": plan.model_dump(),
        "status": "completed",
    }
    save_motion(
        motion_id=motion_id,
        prompt=plan.original_prompt,
        model="test-model",
        fps=20,
        duration=0.1,
        frames=2,
        joints=22,
        motion_path=str(motion_path),
        metadata=metadata,
    )

    data_response = client.get(f"/api/motions/{motion_id}/data")
    export_response = client.get(f"/api/motions/{motion_id}/download?format=json")

    assert data_response.status_code == 200
    assert data_response.json()["joints"] == 22
    assert export_response.status_code == 200
    assert export_response.json()["fps"] == 20
