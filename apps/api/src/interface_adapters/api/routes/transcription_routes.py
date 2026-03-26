import os
from typing import Optional
from uuid import UUID, uuid4

import aiofiles
from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from src.application.use_cases.transcribe_video import TranscribeVideoInput, TranscribeVideoUseCase
from src.application.use_cases.transcribe_youtube import TranscribeYoutubeInput, TranscribeYoutubeUseCase
from src.application.use_cases.transcribe_instagram_profile import (
    TranscribeInstagramProfileInput,
    TranscribeInstagramProfileUseCase,
)
from src.domain.entities import BatchTranscription, Transcription
from src.domain.entities.transcription import SourceType, VideoSource
from src.infrastructure.config.settings import get_settings
from src.infrastructure.instagram import ApifyAdapter
from src.infrastructure.persistence import InMemoryBatchTranscriptionRepository, InMemoryTranscriptionRepository
from src.infrastructure.whisper import WhisperAdapter
from src.infrastructure.youtube import YtdlpAdapter

router = APIRouter()

settings = get_settings()
repository = InMemoryTranscriptionRepository()
batch_repository = InMemoryBatchTranscriptionRepository()
whisper_service = WhisperAdapter(model_size=settings.whisper_model_size)
youtube_downloader = YtdlpAdapter()
instagram_lister = ApifyAdapter(api_token=settings.apify_api_token or "") if settings.apify_api_token else None


class TranscriptionResponse(BaseModel):
    id: str
    status: str
    source_type: str
    source_name: Optional[str] = None
    progress: float = 0.0
    text: Optional[str] = None
    language: Optional[str] = None
    error: Optional[str] = None

    class Config:
        from_attributes = True


class BatchTranscriptionResponse(BaseModel):
    id: str
    status: str
    profile_username: str
    total_videos: int = 0
    completed_videos: int = 0
    failed_videos: int = 0
    progress: float = 0.0
    transcription_ids: list[str] = []
    error: Optional[str] = None


def transcription_to_response(t: Transcription) -> TranscriptionResponse:
    return TranscriptionResponse(
        id=str(t.id),
        status=t.status.value,
        source_type=t.source.type.value,
        source_name=t.source.filename or t.source.title,
        progress=t.progress,
        text=t.result.text if t.result else None,
        language=t.result.language if t.result else None,
        error=t.error_message,
    )


@router.post("/transcriptions", response_model=TranscriptionResponse)
async def create_transcription(
    background_tasks: BackgroundTasks,
    file: Optional[UploadFile] = File(None),
    youtube_url: Optional[str] = Form(None),
    language: str = Form("auto"),
    model_size: str = Form("base"),
):
    if not file and not youtube_url:
        raise HTTPException(status_code=400, detail="Provide either a file or youtube_url")

    lang = language if language != "auto" else None

    if file:
        upload_dir = settings.upload_dir
        os.makedirs(upload_dir, exist_ok=True)

        file_ext = os.path.splitext(file.filename)[1] if file.filename else ".mp4"
        file_path = os.path.join(upload_dir, f"{uuid4()}{file_ext}")

        async with aiofiles.open(file_path, "wb") as f:
            content = await file.read()
            await f.write(content)

        transcription = Transcription(
            source=VideoSource(
                type=SourceType.UPLOAD,
                filename=file.filename,
                size_bytes=len(content),
            ),
            model_used=model_size,
        )
        await repository.save(transcription)

        use_case = TranscribeVideoUseCase(whisper_service, repository)
        input_data = TranscribeVideoInput(
            file_path=file_path,
            filename=file.filename or "unknown",
            file_size=len(content),
            language=lang,
            model_size=model_size,
        )
        background_tasks.add_task(use_case.execute, transcription.id, input_data)

        return transcription_to_response(transcription)

    transcription = Transcription(
        source=VideoSource(
            type=SourceType.YOUTUBE,
            url=youtube_url,
        ),
        model_used=model_size,
    )
    await repository.save(transcription)

    use_case = TranscribeYoutubeUseCase(
        whisper_service, youtube_downloader, repository, settings.upload_dir
    )
    input_data = TranscribeYoutubeInput(url=youtube_url, language=lang, model_size=model_size)
    background_tasks.add_task(use_case.execute, transcription.id, input_data)

    return transcription_to_response(transcription)


@router.get("/transcriptions", response_model=list[TranscriptionResponse])
async def list_transcriptions():
    transcriptions = await repository.list_all()
    return [transcription_to_response(t) for t in transcriptions]


@router.get("/transcriptions/{transcription_id}", response_model=TranscriptionResponse)
async def get_transcription(transcription_id: UUID):
    transcription = await repository.get(transcription_id)
    if not transcription:
        raise HTTPException(status_code=404, detail="Transcription not found")
    return transcription_to_response(transcription)


@router.delete("/transcriptions/{transcription_id}")
async def delete_transcription(transcription_id: UUID):
    deleted = await repository.delete(transcription_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Transcription not found")
    return {"status": "deleted"}


@router.get("/transcriptions/{transcription_id}/export")
async def export_transcription(transcription_id: UUID, format: str = "txt"):
    transcription = await repository.get(transcription_id)
    if not transcription:
        raise HTTPException(status_code=404, detail="Transcription not found")

    if not transcription.result:
        raise HTTPException(status_code=400, detail="Transcription not completed")

    if format == "txt":
        return {"content": transcription.result.text, "format": "txt"}

    elif format == "srt":
        srt_content = ""
        for i, seg in enumerate(transcription.result.segments, 1):
            start = format_timestamp_srt(seg.start)
            end = format_timestamp_srt(seg.end)
            srt_content += f"{i}\n{start} --> {end}\n{seg.text}\n\n"
        return {"content": srt_content, "format": "srt"}

    elif format == "vtt":
        vtt_content = "WEBVTT\n\n"
        for seg in transcription.result.segments:
            start = format_timestamp_vtt(seg.start)
            end = format_timestamp_vtt(seg.end)
            vtt_content += f"{start} --> {end}\n{seg.text}\n\n"
        return {"content": vtt_content, "format": "vtt"}

    elif format == "json":
        return {
            "content": {
                "text": transcription.result.text,
                "language": transcription.result.language,
                "segments": [
                    {
                        "start": seg.start,
                        "end": seg.end,
                        "text": seg.text,
                    }
                    for seg in transcription.result.segments
                ],
            },
            "format": "json",
        }

    raise HTTPException(status_code=400, detail=f"Unsupported format: {format}")


def format_timestamp_srt(seconds: float) -> str:
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds - int(seconds)) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def format_timestamp_vtt(seconds: float) -> str:
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds - int(seconds)) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"


def batch_to_response(b: BatchTranscription) -> BatchTranscriptionResponse:
    return BatchTranscriptionResponse(
        id=str(b.id),
        status=b.status.value,
        profile_username=b.profile_username,
        total_videos=b.total_videos,
        completed_videos=b.completed_videos,
        failed_videos=b.failed_videos,
        progress=b.progress,
        transcription_ids=[str(tid) for tid in b.transcription_ids],
        error=b.error_message,
    )


@router.post("/transcriptions/batch/instagram", response_model=BatchTranscriptionResponse)
async def create_instagram_batch(
    background_tasks: BackgroundTasks,
    profile_url: str = Form(...),
    language: str = Form("auto"),
    model_size: str = Form("base"),
    max_videos: Optional[int] = Form(None),
):
    if not instagram_lister:
        raise HTTPException(
            status_code=503,
            detail="Instagram batch transcription requires APIFY_API_TOKEN to be configured.",
        )

    try:
        username = await instagram_lister.validate_profile_url(profile_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    lang = language if language != "auto" else None

    batch = BatchTranscription(
        profile_url=profile_url,
        profile_username=username,
    )
    await batch_repository.save(batch)

    os.makedirs(settings.upload_dir, exist_ok=True)

    use_case = TranscribeInstagramProfileUseCase(
        profile_video_lister=instagram_lister,
        video_downloader=youtube_downloader,
        whisper_service=whisper_service,
        transcription_repository=repository,
        batch_repository=batch_repository,
        upload_dir=settings.upload_dir,
    )
    input_data = TranscribeInstagramProfileInput(
        profile_url=profile_url,
        language=lang,
        model_size=model_size,
        max_videos=max_videos,
    )
    background_tasks.add_task(use_case.execute, batch.id, input_data)

    return batch_to_response(batch)


@router.get("/transcriptions/batch/{batch_id}", response_model=BatchTranscriptionResponse)
async def get_batch_transcription(batch_id: UUID):
    batch = await batch_repository.get(batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch_to_response(batch)
