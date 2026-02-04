import os
import time
from dataclasses import dataclass
from typing import Optional
from uuid import UUID, uuid4

from src.application.ports import TranscriptionRepository, VideoDownloader, WhisperService
from src.domain.entities import TranscriptionResult


@dataclass
class TranscribeYoutubeInput:
    url: str
    language: Optional[str] = None
    model_size: str = "base"


class TranscribeYoutubeUseCase:
    def __init__(
        self,
        whisper_service: WhisperService,
        video_downloader: VideoDownloader,
        repository: TranscriptionRepository,
        upload_dir: str,
    ):
        self._whisper = whisper_service
        self._downloader = video_downloader
        self._repository = repository
        self._upload_dir = upload_dir

    async def execute(self, transcription_id: UUID, input_data: TranscribeYoutubeInput) -> None:
        transcription = await self._repository.get(transcription_id)
        if not transcription:
            raise ValueError(f"Transcription {transcription_id} not found")

        try:
            transcription.start_download()
            await self._repository.save(transcription)

            video_info = await self._downloader.get_info(input_data.url)
            transcription.source.title = video_info.title
            transcription.source.duration_seconds = video_info.duration_seconds

            output_path = os.path.join(self._upload_dir, f"{uuid4()}.mp3")

            def download_progress(progress: float) -> None:
                transcription.update_progress(progress * 0.3)

            audio_path = await self._downloader.download_audio(
                url=input_data.url,
                output_path=output_path,
                on_progress=download_progress,
            )

            transcription.start_transcription()
            await self._repository.save(transcription)

            start_time = time.time()

            def transcribe_progress(progress: float) -> None:
                transcription.update_progress(30 + (progress * 0.7))

            result = await self._whisper.transcribe(
                audio_path=audio_path,
                language=input_data.language,
                on_progress=transcribe_progress,
            )

            processing_time = time.time() - start_time
            device = self._whisper.get_device()

            transcription.complete(
                result=TranscriptionResult(
                    text=result.text,
                    segments=result.segments,
                    language=result.language,
                    duration_seconds=video_info.duration_seconds,
                ),
                device=device,
                processing_time=processing_time,
            )
            await self._repository.save(transcription)

            if os.path.exists(audio_path):
                os.remove(audio_path)

        except Exception as e:
            transcription.fail(str(e))
            await self._repository.save(transcription)
            raise
