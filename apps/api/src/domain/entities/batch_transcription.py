from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4


class BatchStatus(str, Enum):
    PENDING = "pending"
    ENUMERATING = "enumerating"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class BatchTranscription:
    id: UUID = field(default_factory=uuid4)
    profile_url: str = ""
    profile_username: str = ""
    status: BatchStatus = BatchStatus.PENDING
    transcription_ids: list[UUID] = field(default_factory=list)
    total_videos: int = 0
    completed_videos: int = 0
    failed_videos: int = 0
    error_message: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

    @property
    def progress(self) -> float:
        if self.total_videos == 0:
            return 0.0
        return (self.completed_videos + self.failed_videos) / self.total_videos * 100

    def start_enumeration(self) -> None:
        self.status = BatchStatus.ENUMERATING

    def start_processing(self, total: int, ids: list[UUID]) -> None:
        self.status = BatchStatus.PROCESSING
        self.total_videos = total
        self.transcription_ids = ids

    def video_completed(self) -> None:
        self.completed_videos += 1

    def video_failed(self) -> None:
        self.failed_videos += 1

    def complete(self) -> None:
        self.status = BatchStatus.COMPLETED
        self.completed_at = datetime.utcnow()

    def fail(self, error: str) -> None:
        self.status = BatchStatus.FAILED
        self.error_message = error

    def cancel(self) -> None:
        self.status = BatchStatus.CANCELLED
