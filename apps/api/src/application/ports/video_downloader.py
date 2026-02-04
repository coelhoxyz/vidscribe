from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Callable, Optional


@dataclass
class VideoInfo:
    title: str
    duration_seconds: float
    url: str


class VideoDownloader(ABC):
    @abstractmethod
    async def get_info(self, url: str) -> VideoInfo:
        pass

    @abstractmethod
    async def download_audio(
        self,
        url: str,
        output_path: str,
        on_progress: Optional[Callable[[float], None]] = None,
    ) -> str:
        pass
