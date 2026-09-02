from __future__ import annotations


class AppError(Exception):
    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


MISSING_GROQ_KEY = "Groq API key is not configured. Add GROQ_API_KEY to .env."
GROQ_FAILED = "Groq planning failed. Check API key, model availability and network connection."
MISSING_CHECKPOINT = "Local motion-model checkpoint is missing."
CUDA_UNAVAILABLE = "CUDA is not available. Local motion generation cannot use the RTX GPU."
CUDA_OOM = "The motion model exceeded the 4 GB VRAM budget. Reduce generation size or use CPU/offload mode if supported."
INVALID_PLAN = "The motion planner returned invalid structured data."
CONVERSION_FAILED = "The generated motion could not be converted to joint positions."
