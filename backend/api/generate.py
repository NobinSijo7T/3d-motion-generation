import asyncio

from fastapi import APIRouter

from ..config import settings
from ..groq.planner import plan_motion
from ..motion.engine import generate_motion
from ..schemas import GenerateRequest, GenerateResponse

router = APIRouter()


@router.post("/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest):
    plan = await plan_motion(request.prompt)
    if request.duration:
        plan.total_duration = min(request.duration, settings.max_duration)
    variations = min(request.variations, settings.max_variations)
    metadata = await asyncio.to_thread(generate_motion, plan, variations, request.motion_engine)
    return GenerateResponse(
        success=True,
        motion_id=metadata["id"],
        status="completed",
        plan=plan,
    )
