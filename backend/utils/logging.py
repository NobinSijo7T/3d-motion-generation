from __future__ import annotations

import logging
from logging.handlers import RotatingFileHandler

from ..config import settings


def setup_logging() -> logging.Logger:
    settings.ensure_dirs()
    logger = logging.getLogger("motion-ai-studio")
    if logger.handlers:
        return logger
    logger.setLevel(logging.INFO)
    formatter = logging.Formatter("%(asctime)s %(levelname)s %(message)s")
    file_handler = RotatingFileHandler(
        settings.logs_dir / "app.log", maxBytes=1_000_000, backupCount=3, encoding="utf-8"
    )
    file_handler.setFormatter(formatter)
    stream = logging.StreamHandler()
    stream.setFormatter(formatter)
    logger.addHandler(file_handler)
    logger.addHandler(stream)
    return logger


log = setup_logging()
