from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

from ..config import settings
from ..utils.errors import AppError, CUDA_OOM, CUDA_UNAVAILABLE, MISSING_CHECKPOINT
from ..utils.logging import log


def checkpoint_ready() -> bool:
    return settings.motion_model_files_present()


def _python_bin() -> str:
    if settings.motion_python:
        return settings.motion_python
    venv = settings.root / ".venv-motion"
    for candidate in (
        venv / "Scripts" / "python.exe",
        venv / "bin" / "python",
    ):
        if candidate.exists():
            return str(candidate)
    return sys.executable


def generate_with_engine(text: str, output_id: str, repeat_time: int = 1) -> dict:
    if not checkpoint_ready():
        raise AppError(MISSING_CHECKPOINT, 503)

    worker = settings.root / "scripts" / "motion_worker.py"
    cmd = [
        _python_bin(),
        str(worker),
        "--text",
        text,
        "--output-id",
        output_id,
        "--repeat-time",
        str(max(1, min(repeat_time, settings.max_variations))),
        "--engine-path",
        str(settings.motion_engine_path),
        "--checkpoint",
        settings.motion_checkpoint,
        "--gpu-id",
        str(settings.gpu_id),
        "--output-dir",
        str(settings.cache_dir / "engine"),
    ]
    env = os.environ.copy()
    env["PYTHONPATH"] = str(settings.motion_engine_path)
    try:
        completed = subprocess.run(
            cmd,
            cwd=str(settings.motion_engine_path),
            capture_output=True,
            text=True,
            env=env,
            timeout=420,
            check=False,
        )
    except FileNotFoundError as exc:
        raise AppError(MISSING_CHECKPOINT, 503) from exc

    log.info("motion worker exit=%s", completed.returncode)
    if completed.returncode != 0:
        combined = (completed.stdout or "") + "\n" + (completed.stderr or "")
        if "CUDA" in combined and ("out of memory" in combined.lower() or "OOM" in combined):
            raise AppError(CUDA_OOM, 507)
        if "CUDA" in combined and "not available" in combined.lower():
            raise AppError(CUDA_UNAVAILABLE, 503)
        if "checkpoint" in combined.lower() or "FileNotFoundError" in combined:
            raise AppError(MISSING_CHECKPOINT, 503)
        raise AppError(MISSING_CHECKPOINT if "No such file" in combined else CUDA_OOM if "memory" in combined.lower() else "Local motion generation failed.", 500)

    payload_path = Path(settings.cache_dir / "engine" / f"{output_id}.meta.json")
    if not payload_path.exists():
        # worker prints JSON on last line
        lines = [line for line in completed.stdout.splitlines() if line.strip().startswith("{")]
        if not lines:
            raise AppError("Local motion generation failed.", 500)
        return json.loads(lines[-1])
    return json.loads(payload_path.read_text(encoding="utf-8"))
