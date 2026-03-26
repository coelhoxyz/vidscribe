from typing import Optional
from uuid import UUID

from src.application.ports import BatchTranscriptionRepository
from src.domain.entities import BatchTranscription


class InMemoryBatchTranscriptionRepository(BatchTranscriptionRepository):
    def __init__(self):
        self._storage: dict[UUID, BatchTranscription] = {}

    async def save(self, batch: BatchTranscription) -> None:
        self._storage[batch.id] = batch

    async def get(self, id: UUID) -> Optional[BatchTranscription]:
        return self._storage.get(id)

    async def list_all(self) -> list[BatchTranscription]:
        return list(self._storage.values())

    async def delete(self, id: UUID) -> bool:
        if id in self._storage:
            del self._storage[id]
            return True
        return False
