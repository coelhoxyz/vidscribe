from abc import ABC, abstractmethod
from typing import Callable, Optional

from src.domain.entities import TranscriptionSegment


class WhisperResult:
    def __init__(self, text: str, segments: list[TranscriptionSegment], language: str):
        self.text = text
        self.segments = segments
        self.language = language


class WhisperService(ABC):
    @abstractmethod
    async def transcribe(
        self,
        audio_path: str,
        language: Optional[str] = None,
        on_progress: Optional[Callable[[float], None]] = None,
    ) -> WhisperResult:
        pass

    @abstractmethod
    def get_device(self) -> str:
        pass
