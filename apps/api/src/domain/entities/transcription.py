from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4

from src.domain.entities.transcription_segment import TranscriptionSegment


class TranscriptionStatus(str, Enum):
    PENDING = "pending"
    DOWNLOADING = "downloading"
    EXTRACTING_AUDIO = "extracting_audio"
    TRANSCRIBING = "transcribing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class SourceType(str, Enum):
    UPLOAD = "upload"
    YOUTUBE = "youtube"


@dataclass
class VideoSource:
    type: SourceType
    filename: Optional[str] = None
    url: Optional[str] = None
    title: Optional[str] = None
    duration_seconds: Optional[float] = None
    size_bytes: Optional[int] = None


@dataclass
class TranscriptionResult:
    text: str
    segments: list[TranscriptionSegment]
    language: str
    duration_seconds: float


@dataclass
class Transcription:
    id: UUID = field(default_factory=uuid4)
    source: VideoSource = field(default_factory=lambda: VideoSource(type=SourceType.UPLOAD))
    status: TranscriptionStatus = TranscriptionStatus.PENDING
    progress: float = 0.0
    result: Optional[TranscriptionResult] = None
    error_message: Optional[str] = None
    model_used: str = "base"
    device_used: Optional[str] = None
    processing_time_seconds: Optional[float] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

    def start_download(self) -> None:
        self.status = TranscriptionStatus.DOWNLOADING

    def start_audio_extraction(self) -> None:
        self.status = TranscriptionStatus.EXTRACTING_AUDIO

    def start_transcription(self) -> None:
        self.status = TranscriptionStatus.TRANSCRIBING

    def complete(self, result: TranscriptionResult, device: str, processing_time: float) -> None:
        self.status = TranscriptionStatus.COMPLETED
        self.result = result
        self.device_used = device
        self.processing_time_seconds = processing_time
        self.completed_at = datetime.utcnow()
        self.progress = 100.0

    def fail(self, error: str) -> None:
        self.status = TranscriptionStatus.FAILED
        self.error_message = error

    def cancel(self) -> None:
        self.status = TranscriptionStatus.CANCELLED

    def update_progress(self, progress: float) -> None:
        self.progress = min(progress, 100.0)
