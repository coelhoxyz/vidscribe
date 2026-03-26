from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from src.domain.entities import BatchTranscription


class BatchTranscriptionRepository(ABC):
    @abstractmethod
    async def save(self, batch: BatchTranscription) -> None:
        pass

    @abstractmethod
    async def get(self, id: UUID) -> Optional[BatchTranscription]:
        pass

    @abstractmethod
    async def list_all(self) -> list[BatchTranscription]:
        pass

    @abstractmethod
    async def delete(self, id: UUID) -> bool:
        pass
