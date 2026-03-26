import asyncio
import logging
import os
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional
from uuid import UUID, uuid4

import httpx

from src.application.ports import (
    BatchTranscriptionRepository,
    ProfileVideoLister,
    TranscriptionRepository,
    VideoDownloader,
    WhisperService,
)
from src.domain.entities import Transcription, TranscriptionResult
from src.domain.entities.transcription import SourceType, VideoSource

logger = logging.getLogger(__name__)

# Global lock: MPS (Apple GPU) crashes on concurrent Whisper inference
_whisper_lock = asyncio.Lock()


@dataclass
class TranscribeInstagramProfileInput:
    profile_url: str
    language: Optional[str] = None
    model_size: str = "base"
    max_videos: Optional[int] = None


class TranscribeInstagramProfileUseCase:
    def __init__(
        self,
        profile_video_lister: ProfileVideoLister,
        video_downloader: VideoDownloader,
        whisper_service: WhisperService,
        transcription_repository: TranscriptionRepository,
        batch_repository: BatchTranscriptionRepository,
        upload_dir: str,
    ):
        self._lister = profile_video_lister
        self._downloader = video_downloader
        self._whisper = whisper_service
        self._transcription_repo = transcription_repository
        self._batch_repo = batch_repository
        self._upload_dir = upload_dir

    async def execute(self, batch_id: UUID, input_data: TranscribeInstagramProfileInput) -> None:
        batch = await self._batch_repo.get(batch_id)
        if not batch:
            raise ValueError(f"Batch {batch_id} not found")

        try:
            batch.start_enumeration()
            await self._batch_repo.save(batch)

            videos = await self._lister.list_videos(
                input_data.profile_url, input_data.max_videos
            )

            if not videos:
                batch.fail("No videos found on this profile")
                await self._batch_repo.save(batch)
                return

            transcription_ids: list[UUID] = []
            for video in videos:
                transcription = Transcription(
                    source=VideoSource(
                        type=SourceType.INSTAGRAM,
                        url=video.url,
                        title=video.title,
                        owner_username=video.owner_username,
                        duration_seconds=video.duration_seconds,
                        views_count=video.views_count,
                        likes_count=video.likes_count,
                        comments_count=video.comments_count,
                    ),
                    model_used=input_data.model_size,
                )
                await self._transcription_repo.save(transcription)
                transcription_ids.append(transcription.id)

            batch.start_processing(total=len(videos), ids=transcription_ids)
            await self._batch_repo.save(batch)

            semaphore = asyncio.Semaphore(3)

            async def _process_one(video, t_id: UUID) -> None:
                async with semaphore:
                    transcription = await self._transcription_repo.get(t_id)
                    if not transcription:
                        return

                    try:
                        download_url = video.direct_video_url or video.url
                        await self._process_single_video(transcription, download_url, input_data.language)
                        batch.video_completed()
                    except Exception as e:
                        logger.error(f"Failed to process video {video.url}: {e}")
                        transcription.fail(str(e))
                        await self._transcription_repo.save(transcription)
                        batch.video_failed()

                    await self._batch_repo.save(batch)

            await asyncio.gather(
                *(_process_one(video, t_id) for video, t_id in zip(videos, transcription_ids))
            )

            batch.complete()
            await self._batch_repo.save(batch)

        except Exception as e:
            logger.error(f"Batch {batch_id} failed: {e}")
            batch.fail(str(e))
            await self._batch_repo.save(batch)

    async def _download_cdn_video(self, url: str, output_path: str) -> str:
        """Download video directly from CDN URL."""
        async with httpx.AsyncClient(timeout=120, follow_redirects=True) as client:
            async with client.stream("GET", url) as response:
                response.raise_for_status()
                with open(output_path, "wb") as f:
                    async for chunk in response.aiter_bytes(8192):
                        f.write(chunk)
        return output_path

    async def _process_single_video(
        self,
        transcription: Transcription,
        url: str,
        language: Optional[str],
    ) -> None:
        # Phase 1: Download (parallel-safe)
        transcription.start_download()
        await self._transcription_repo.save(transcription)

        is_cdn_url = "cdninstagram.com" in url or "fbcdn.net" in url
        video_info = None
        output_path = os.path.join(self._upload_dir, f"{uuid4()}.mp4")

        if is_cdn_url:
            audio_path = await self._download_cdn_video(url, output_path)
            transcription.update_progress(30)
        else:
            try:
                video_info = await self._downloader.get_info(url)
                transcription.source.title = video_info.title
                transcription.source.duration_seconds = video_info.duration_seconds
            except Exception:
                pass

            def download_progress(progress: float) -> None:
                transcription.update_progress(progress * 0.3)

            audio_path = await self._downloader.download_audio(
                url=url,
                output_path=output_path,
                on_progress=download_progress,
            )

        # Phase 2: Whisper transcription (serialized — GPU can't handle concurrent inference)
        async with _whisper_lock:
            transcription.start_transcription()
            await self._transcription_repo.save(transcription)

            start_time = time.time()

            def transcribe_progress(progress: float) -> None:
                transcription.update_progress(30 + (progress * 0.7))

            result = await self._whisper.transcribe(
                audio_path=audio_path,
                language=language,
                on_progress=transcribe_progress,
            )

            processing_time = time.time() - start_time
            device = self._whisper.get_device()

        transcription.complete(
            result=TranscriptionResult(
                text=result.text,
                segments=result.segments,
                language=result.language,
                duration_seconds=video_info.duration_seconds if video_info and video_info.duration_seconds else 0,
            ),
            device=device,
            processing_time=processing_time,
        )
        await self._transcription_repo.save(transcription)

        if os.path.exists(audio_path):
            os.remove(audio_path)
