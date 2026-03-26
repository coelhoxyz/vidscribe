import asyncio
import logging
import os
import time
from dataclasses import dataclass
from typing import Optional
from uuid import UUID, uuid4

from src.application.ports import (
    BatchTranscriptionRepository,
    TranscriptionRepository,
    VideoDownloader,
    WhisperService,
)
from src.domain.entities import Transcription, TranscriptionResult
from src.domain.entities.transcription import SourceType, VideoSource

logger = logging.getLogger(__name__)

# Shared with instagram use case — MPS can't handle concurrent Whisper
from src.application.use_cases.transcribe_instagram_profile import _whisper_lock


@dataclass
class TranscribeYoutubeBatchInput:
    urls: list[str]
    language: Optional[str] = None
    model_size: str = "base"


class TranscribeYoutubeBatchUseCase:
    def __init__(
        self,
        video_downloader: VideoDownloader,
        whisper_service: WhisperService,
        transcription_repository: TranscriptionRepository,
        batch_repository: BatchTranscriptionRepository,
        upload_dir: str,
    ):
        self._downloader = video_downloader
        self._whisper = whisper_service
        self._transcription_repo = transcription_repository
        self._batch_repo = batch_repository
        self._upload_dir = upload_dir

    async def execute(self, batch_id: UUID, input_data: TranscribeYoutubeBatchInput) -> None:
        batch = await self._batch_repo.get(batch_id)
        if not batch:
            raise ValueError(f"Batch {batch_id} not found")

        try:
            batch.start_enumeration()
            await self._batch_repo.save(batch)

            transcription_ids: list[UUID] = []
            for url in input_data.urls:
                transcription = Transcription(
                    source=VideoSource(
                        type=SourceType.YOUTUBE,
                        url=url,
                    ),
                    model_used=input_data.model_size,
                )
                await self._transcription_repo.save(transcription)
                transcription_ids.append(transcription.id)

            batch.start_processing(total=len(input_data.urls), ids=transcription_ids)
            await self._batch_repo.save(batch)

            semaphore = asyncio.Semaphore(3)

            async def _process_one(url: str, t_id: UUID) -> None:
                async with semaphore:
                    transcription = await self._transcription_repo.get(t_id)
                    if not transcription:
                        return

                    try:
                        await self._process_single_video(transcription, url, input_data.language)
                        batch.video_completed()
                    except Exception as e:
                        logger.error(f"Failed to process video {url}: {e}")
                        transcription.fail(str(e))
                        await self._transcription_repo.save(transcription)
                        batch.video_failed()

                    await self._batch_repo.save(batch)

            await asyncio.gather(
                *(_process_one(url, t_id) for url, t_id in zip(input_data.urls, transcription_ids))
            )

            batch.complete()
            await self._batch_repo.save(batch)

        except Exception as e:
            logger.error(f"Batch {batch_id} failed: {e}")
            batch.fail(str(e))
            await self._batch_repo.save(batch)

    async def _process_single_video(
        self,
        transcription: Transcription,
        url: str,
        language: Optional[str],
    ) -> None:
        transcription.start_download()
        await self._transcription_repo.save(transcription)

        video_info = None
        try:
            video_info = await self._downloader.get_info(url)
            transcription.source.title = video_info.title
            transcription.source.duration_seconds = video_info.duration_seconds
        except Exception:
            pass

        output_path = os.path.join(self._upload_dir, f"{uuid4()}.mp3")

        def download_progress(progress: float) -> None:
            transcription.update_progress(progress * 0.3)

        audio_path = await self._downloader.download_audio(
            url=url,
            output_path=output_path,
            on_progress=download_progress,
        )

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
