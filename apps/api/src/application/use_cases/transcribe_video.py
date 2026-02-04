import os
import time
from dataclasses import dataclass
from typing import Optional
from uuid import UUID

from src.application.ports import TranscriptionRepository, WhisperService
from src.domain.entities import TranscriptionResult


@dataclass
class TranscribeVideoInput:
    file_path: str
    filename: str
    file_size: int
    language: Optional[str] = None
    model_size: str = "base"


class TranscribeVideoUseCase:
    def __init__(
        self,
        whisper_service: WhisperService,
        repository: TranscriptionRepository,
    ):
        self._whisper = whisper_service
        self._repository = repository

    async def execute(self, transcription_id: UUID, input_data: TranscribeVideoInput) -> None:
        transcription = await self._repository.get(transcription_id)
        if not transcription:
            raise ValueError(f"Transcription {transcription_id} not found")

        try:
            transcription.start_transcription()
            await self._repository.save(transcription)

            start_time = time.time()

            def progress_callback(progress: float) -> None:
                transcription.update_progress(progress)

            result = await self._whisper.transcribe(
                audio_path=input_data.file_path,
                language=input_data.language,
                on_progress=progress_callback,
            )

            processing_time = time.time() - start_time
            device = self._whisper.get_device()

            transcription.complete(
                result=TranscriptionResult(
                    text=result.text,
                    segments=result.segments,
                    language=result.language,
                    duration_seconds=0,
                ),
                device=device,
                processing_time=processing_time,
            )
            await self._repository.save(transcription)

            if os.path.exists(input_data.file_path):
                os.remove(input_data.file_path)

        except Exception as e:
            transcription.fail(str(e))
            await self._repository.save(transcription)
            raise
