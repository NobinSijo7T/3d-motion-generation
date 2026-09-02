from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import Column, Float, Integer, String, Text, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import settings


class Base(DeclarativeBase):
    pass


class MotionRow(Base):
    __tablename__ = "motions"

    id = Column(String, primary_key=True)
    prompt = Column(Text, nullable=False)
    model = Column(String, nullable=False)
    fps = Column(Integer)
    duration = Column(Float)
    frames = Column(Integer)
    joints = Column(Integer)
    motion_path = Column(Text)
    metadata_json = Column(Text)
    created_at = Column(Text)


engine = create_engine(f"sqlite:///{settings.database_path}", future=True)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


def init_db() -> None:
    settings.ensure_dirs()
    Base.metadata.create_all(engine)


def save_motion(
    motion_id: str,
    prompt: str,
    model: str,
    fps: int,
    duration: float,
    frames: int,
    joints: int,
    motion_path: str,
    metadata: dict[str, Any],
) -> dict[str, Any]:
    created_at = datetime.now(timezone.utc).isoformat()
    row = MotionRow(
        id=motion_id,
        prompt=prompt,
        model=model,
        fps=fps,
        duration=duration,
        frames=frames,
        joints=joints,
        motion_path=motion_path,
        metadata_json=json.dumps(metadata),
        created_at=created_at,
    )
    with Session(engine) as session:
        session.merge(row)
        session.commit()
    return {**metadata, "id": motion_id, "created_at": created_at}


def get_motion(motion_id: str) -> dict[str, Any] | None:
    with Session(engine) as session:
        row = session.get(MotionRow, motion_id)
        if row is None:
            return None
        return _to_dict(row)


def list_motions() -> list[dict[str, Any]]:
    with Session(engine) as session:
        rows = session.scalars(select(MotionRow).order_by(MotionRow.created_at.desc())).all()
        return [_to_dict(row) for row in rows]


def delete_motion(motion_id: str) -> bool:
    with Session(engine) as session:
        row = session.get(MotionRow, motion_id)
        if row is None:
            return False
        session.delete(row)
        session.commit()
        return True


def _to_dict(row: MotionRow) -> dict[str, Any]:
    metadata = json.loads(row.metadata_json or "{}")
    return {
        "id": row.id,
        "prompt": row.prompt,
        "model": row.model,
        "fps": row.fps,
        "duration": row.duration,
        "frames": row.frames,
        "joints": row.joints,
        "motion_path": row.motion_path,
        "created_at": row.created_at,
        "plan": metadata.get("plan"),
        "status": metadata.get("status", "completed"),
        "metadata": metadata,
    }
