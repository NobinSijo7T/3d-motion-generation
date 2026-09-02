from fastapi import APIRouter

from ..groq.planner import plan_motion
from ..schemas import PlanRequest

router = APIRouter()


@router.post("/plan")
async def plan(request: PlanRequest):
    return await plan_motion(request.prompt)
