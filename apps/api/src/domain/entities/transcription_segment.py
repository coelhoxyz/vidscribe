from dataclasses import dataclass


@dataclass
class TranscriptionSegment:
    id: int
    start: float
    end: float
    text: str
    confidence: float = 0.0

    @property
    def duration(self) -> float:
        return self.end - self.start
