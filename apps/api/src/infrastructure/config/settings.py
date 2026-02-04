from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings

_BASE_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    whisper_model_size: str = "base"
    cors_origins: str = "http://localhost:3000"
    log_level: str = "INFO"
    upload_dir: str = str(_BASE_DIR / "uploads")
    data_dir: str = str(_BASE_DIR / "data")
    models_dir: str = str(_BASE_DIR / "models")

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
