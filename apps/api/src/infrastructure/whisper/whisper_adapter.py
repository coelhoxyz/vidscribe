import asyncio
import threading
from typing import Callable, Optional

import torch
import whisper

from src.application.ports.whisper_service import WhisperResult, WhisperService
from src.domain.entities import TranscriptionSegment


class WhisperAdapter(WhisperService):
    def __init__(self, model_size: str = "base"):
        self._model_size = model_size
        self._model: Optional[whisper.Whisper] = None
        self._device = self._detect_device()

    def _detect_device(self) -> str:
        if torch.cuda.is_available():
            return "cuda"
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            return "mps"
        return "cpu"

    def _load_model(self) -> whisper.Whisper:
        if self._model is None:
            self._model = whisper.load_model(self._model_size, device=self._device)
        return self._model

    def get_device(self) -> str:
        return self._device

    async def transcribe(
        self,
        audio_path: str,
        language: Optional[str] = None,
        on_progress: Optional[Callable[[float], None]] = None,
    ) -> WhisperResult:
        model = self._load_model()

        loop = asyncio.get_event_loop()
        done_event = threading.Event()

        if on_progress:
            on_progress(5)

        async def simulate_progress() -> None:
            """Increment progress smoothly while transcription runs."""
            current = 5.0
            while not done_event.is_set() and current < 90:
                current = min(current + 2, 90)
                if on_progress:
                    on_progress(current)
                await asyncio.sleep(1)

        progress_task = asyncio.ensure_future(simulate_progress()) if on_progress else None

        def run_transcription():
            try:
                options: dict = {"verbose": False}
                if language and language != "auto":
                    options["language"] = language
                return model.transcribe(audio_path, **options)
            finally:
                done_event.set()

        result = await loop.run_in_executor(None, run_transcription)

        if progress_task:
            await progress_task

        if on_progress:
            on_progress(95)

        segments = [
            TranscriptionSegment(
                id=i,
                start=seg["start"],
                end=seg["end"],
                text=seg["text"].strip(),
                confidence=seg.get("avg_logprob", 0),
            )
            for i, seg in enumerate(result["segments"])
        ]

        if on_progress:
            on_progress(100)

        return WhisperResult(
            text=result["text"].strip(),
            segments=segments,
            language=result.get("language", "unknown"),
        )
