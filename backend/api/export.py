from __future__ import annotations

import io
import json

import numpy as np
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, StreamingResponse

from ..config import settings
from ..database import get_motion
from ..utils.files import assert_safe_id, safe_join, sanitize_filename

router = APIRouter()


def export_motion(motion_id: str, format: str):
    assert_safe_id(motion_id)
    record = get_motion(motion_id)
    if record is None:
        raise HTTPException(404, "Motion not found")
    path = safe_join(settings.motion_dir, f"{motion_id}.npy")
    if not path.exists():
        raise HTTPException(404, "Motion file not found")
    array = np.load(path)
    filename = sanitize_filename(motion_id)
    if format == "npy":
        return FileResponse(path, filename=f"{filename}.npy")
    if format == "npz":
        buffer = io.BytesIO()
        np.savez_compressed(buffer, frames=array, fps=record.get("fps") or settings.fps)
        buffer.seek(0)
        return StreamingResponse(
            buffer,
            media_type="application/octet-stream",
            headers={"Content-Disposition": f'attachment; filename="{filename}.npz"'},
        )
    if format == "json":
        payload = json.dumps(
            {
                "frames": array.tolist(),
                "fps": record.get("fps") or settings.fps,
                "joints": record.get("joints") or int(array.shape[1]),
            }
        ).encode()
        return StreamingResponse(
            io.BytesIO(payload),
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="{filename}.json"'},
        )
    raise HTTPException(400, "Unsupported export format. Use npy, npz, or json.")


@router.get("/export/{motion_id}")
async def export_endpoint(motion_id: str, format: str = "npy"):
    return export_motion(motion_id, format)
