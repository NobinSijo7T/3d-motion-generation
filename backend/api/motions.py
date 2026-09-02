from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from ..config import settings
from ..database import delete_motion, get_motion, list_motions
from ..rendering.skeleton import bones
from ..utils.files import assert_safe_id, safe_join

router = APIRouter()


@router.get("/motions")
async def history():
    return list_motions()


@router.get("/motions/{motion_id}")
async def motion_metadata(motion_id: str):
    assert_safe_id(motion_id)
    record = get_motion(motion_id)
    if record is None:
        raise HTTPException(404, "Motion not found")
    return record


@router.get("/motions/{motion_id}/data")
async def motion_data(motion_id: str):
    import numpy as np

    assert_safe_id(motion_id)
    record = get_motion(motion_id)
    if record is None:
        raise HTTPException(404, "Motion not found")
    path = safe_join(settings.motion_dir, f"{motion_id}.npy")
    if not path.exists():
        raise HTTPException(404, "Motion file not found")
    array = np.load(path)
    joint_count = int(record.get("joints") or 22)
    return {
        "frames": array.tolist(),
        "fps": record.get("fps") or settings.fps,
        "joints": joint_count,
        "bones": bones(joint_count),
        "duration": record.get("duration"),
        "plan": record.get("plan"),
    }


@router.get("/motions/{motion_id}/download")
async def motion_download(motion_id: str, format: str = "npy"):
    from .export import export_motion

    return export_motion(motion_id, format)


@router.delete("/motions/{motion_id}")
async def motion_delete(motion_id: str):
    assert_safe_id(motion_id)
    path = safe_join(settings.motion_dir, f"{motion_id}.npy")
    if path.exists():
        path.unlink()
    if not delete_motion(motion_id):
        raise HTTPException(404, "Motion not found")
    return {"success": True}
