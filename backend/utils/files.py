from __future__ import annotations

import re
import uuid
from pathlib import Path

SAFE_ID = re.compile(r"^[a-zA-Z0-9_-]{8,64}$")


def new_motion_id() -> str:
    return str(uuid.uuid4())


def assert_safe_id(motion_id: str) -> str:
    if not SAFE_ID.match(motion_id):
        raise ValueError("Invalid motion id")
    return motion_id


def safe_join(base: Path, name: str) -> Path:
    candidate = (base / name).resolve()
    if not str(candidate).startswith(str(base.resolve())):
        raise ValueError("Path traversal is not allowed")
    return candidate


def sanitize_filename(name: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9._-]+", "_", name).strip("._")
    return cleaned[:80] or "motion"
