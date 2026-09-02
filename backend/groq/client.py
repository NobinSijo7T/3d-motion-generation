from __future__ import annotations

from groq import AsyncGroq

from ..config import settings
from ..utils.errors import AppError, MISSING_GROQ_KEY


def groq_client() -> AsyncGroq:
    if not settings.groq_configured:
        raise AppError(MISSING_GROQ_KEY, 503)
    return AsyncGroq(api_key=settings.groq_api_key)
