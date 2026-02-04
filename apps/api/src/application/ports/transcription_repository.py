from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from src.domain.entities import Transcription


class TranscriptionRepository(ABC):
    @abstractmethod
    async def save(self, transcription: Transcription) -> None:
        pass

    @abstractmethod
    async def get(self, id: UUID) -> Optional[Transcription]:
        pass

    @abstractmethod
    async def list_all(self) -> list[Transcription]:
        pass

    @abstractmethod
    async def delete(self, id: UUID) -> bool:
        pass
