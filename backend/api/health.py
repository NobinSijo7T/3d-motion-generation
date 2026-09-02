from fastapi import APIRouter

from ..config import settings
from ..motion.adapter import checkpoint_ready
from ..motion.kimodo_adapter import kimodo_ready

router = APIRouter()


def _cuda_info() -> tuple[bool, str | None]:
    try:
        import torch

        available = bool(torch.cuda.is_available())
        name = torch.cuda.get_device_name(0) if available else None
        return available, name
    except Exception:
        return False, None


@router.get("/health")
async def health():
    cuda, gpu = _cuda_info()
    humanml3d_available = checkpoint_ready()
    kimodo_available = kimodo_ready()
    active_available = (
        kimodo_available
        if settings.motion_engine == "kimodo"
        else humanml3d_available
        if settings.motion_engine == "humanml3d"
        else True
    )
    return {
        "status": "ok",
        "groq_configured": settings.groq_configured,
        "cuda_available": cuda,
        "motion_engine": settings.motion_engine,
        "motion_model": (
            settings.kimodo_model
            if settings.motion_engine == "kimodo"
            else settings.motion_checkpoint
            if settings.motion_engine == "humanml3d"
            else "Procedural Preview"
        ),
        "motion_model_available": active_available,
        "available_engines": [
            {
                "id": "preview",
                "label": "Quick Preview",
                "model": "Procedural Preview",
                "available": True,
                "requires_setup": False,
            },
            {
                "id": "humanml3d",
                "label": "HumanML3D",
                "model": settings.motion_checkpoint,
                "available": humanml3d_available,
                "requires_setup": True,
            },
            {
                "id": "kimodo",
                "label": "Kimodo",
                "model": settings.kimodo_model,
                "available": kimodo_available,
                "requires_setup": True,
            },
        ],
        "kimodo_available": kimodo_available,
        "humanml3d_available": humanml3d_available,
        "gpu": gpu,
    }
