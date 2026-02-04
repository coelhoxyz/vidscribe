from typing import Optional
from uuid import UUID

from src.application.ports import TranscriptionRepository
from src.domain.entities import Transcription


class InMemoryTranscriptionRepository(TranscriptionRepository):
    def __init__(self):
        self._storage: dict[UUID, Transcription] = {}

    async def save(self, transcription: Transcription) -> None:
        self._storage[transcription.id] = transcription

    async def get(self, id: UUID) -> Optional[Transcription]:
        return self._storage.get(id)

    async def list_all(self) -> list[Transcription]:
        return list(self._storage.values())

    async def delete(self, id: UUID) -> bool:
        if id in self._storage:
            del self._storage[id]
            return True
        return False
