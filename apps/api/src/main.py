from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.infrastructure.config.settings import get_settings
from src.interface_adapters.api.routes import health_routes, transcription_routes


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    settings = get_settings()
    print(f"Starting VidScribe API with Whisper model: {settings.whisper_model_size}")
    yield
    print("Shutting down VidScribe API")


app = FastAPI(
    title="VidScribe API",
    description="Open-source video transcription API powered by Whisper",
    version="0.1.0",
    lifespan=lifespan,
)

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_routes.router, prefix="/api/v1", tags=["Health"])
app.include_router(transcription_routes.router, prefix="/api/v1", tags=["Transcription"])
