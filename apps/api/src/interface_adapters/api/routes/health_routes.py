import torch
from fastapi import APIRouter

from src.infrastructure.config.settings import get_settings

router = APIRouter()


@router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "vidscribe-api"}


@router.get("/status")
async def get_status():
    settings = get_settings()

    device = "cpu"
    if torch.cuda.is_available():
        device = "cuda"
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        device = "mps"

    return {
        "status": "ready",
        "whisper_model": settings.whisper_model_size,
        "device": device,
        "gpu_available": device != "cpu",
    }


@router.get("/models")
async def list_models():
    return {
        "models": [
            {"name": "tiny", "size_mb": 39, "description": "Fastest, lower accuracy"},
            {"name": "base", "size_mb": 74, "description": "Good balance (default)"},
            {"name": "small", "size_mb": 244, "description": "Better accuracy"},
            {"name": "medium", "size_mb": 769, "description": "High accuracy"},
            {"name": "large", "size_mb": 1550, "description": "Best accuracy"},
        ]
    }
