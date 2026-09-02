from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")


def _path(value: str, default: str) -> Path:
    raw = os.getenv(value, default)
    path = Path(raw)
    return path if path.is_absolute() else ROOT / path


class Settings:
    def __init__(self) -> None:
        self.root = ROOT
        self.groq_api_key = os.getenv("GROQ_API_KEY", "").strip()
        self.groq_model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
        self.app_host = os.getenv("APP_HOST", "0.0.0.0")
        self.app_port = int(os.getenv("APP_PORT", "8000"))
        self.frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        self.gpu_id = int(os.getenv("GPU_ID", "0"))
        self.fps = int(os.getenv("FPS", "20"))
        self.max_duration = float(os.getenv("MAX_DURATION", "9"))
        self.max_variations = int(os.getenv("MAX_VARIATIONS", "3"))
        self.motion_engine = os.getenv("MOTION_ENGINE", "humanml3d").strip().lower()
        self.output_dir = _path("OUTPUT_DIR", "./outputs")
        self.cache_dir = _path("CACHE_DIR", "./cache")
        self.motion_engine_path = _path("MOTION_ENGINE_PATH", "./vendor/text-to-motion")
        self.motion_checkpoint = os.getenv("MOTION_CHECKPOINT", "Comp_v6_KLD01")
        self.motion_python = os.getenv("MOTION_PYTHON", "").strip()
        self.kimodo_path = _path("KIMODO_PATH", "./vendor/kimodo")
        self.kimodo_python = os.getenv("KIMODO_PYTHON", ".venv-kimodo/Scripts/python.exe").strip()
        self.kimodo_model = os.getenv("KIMODO_MODEL", "Kimodo-SOMA-RP-v1.1").strip()
        self.kimodo_text_encoder_device = os.getenv("KIMODO_TEXT_ENCODER_DEVICE", "cpu").strip()
        self.kimodo_diffusion_steps = int(os.getenv("KIMODO_DIFFUSION_STEPS", "25"))
        self.database_path = _path("DATABASE_PATH", "./cache/motions.db")
        self.motion_dir = self.output_dir / "motions"
        self.export_dir = self.output_dir / "exports"
        self.preview_dir = self.output_dir / "previews"
        self.logs_dir = ROOT / "logs"
        self.checkpoint_dir = (
            self.motion_engine_path / "checkpoints" / "t2m" / self.motion_checkpoint
        )
        self.length_est_dir = self.motion_engine_path / "checkpoints" / "t2m" / "length_est_bigru"
        self.glove_dir = self.motion_engine_path / "glove"
        self.kimodo_cache_dir = self.cache_dir / "kimodo"

    def ensure_dirs(self) -> None:
        for path in (
            self.motion_dir,
            self.export_dir,
            self.preview_dir,
            self.cache_dir,
            self.kimodo_cache_dir,
            self.logs_dir,
        ):
            path.mkdir(parents=True, exist_ok=True)

    @property
    def groq_configured(self) -> bool:
        return bool(self.groq_api_key)

    def motion_model_files_present(self) -> bool:
        model_tar = self.checkpoint_dir / "model" / "latest.tar"
        length_tar = self.length_est_dir / "model" / "latest.tar"
        glove = (
            (self.glove_dir / "our_vab_data.npy").exists()
            and (self.glove_dir / "our_vab_words.pkl").exists()
            and (self.glove_dir / "our_vab_idx.pkl").exists()
        )
        return model_tar.exists() and length_tar.exists() and glove

    def kimodo_python_path(self) -> Path:
        path = Path(self.kimodo_python)
        return path if path.is_absolute() else self.root / path

    def kimodo_available(self) -> bool:
        return self.kimodo_path.exists() and self.kimodo_python_path().exists()


settings = Settings()
