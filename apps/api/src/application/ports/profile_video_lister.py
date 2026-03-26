from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class ProfileVideoInfo:
    url: str
    title: str
    owner_username: Optional[str] = None
    duration_seconds: Optional[float] = None
    posted_at: Optional[datetime] = None
    views_count: Optional[int] = None
    likes_count: Optional[int] = None
    comments_count: Optional[int] = None
    direct_video_url: Optional[str] = None


class ProfileVideoLister(ABC):
    @abstractmethod
    async def list_videos(
        self,
        profile_url: str,
        max_videos: Optional[int] = None,
    ) -> list[ProfileVideoInfo]:
        pass

    @abstractmethod
    async def validate_profile_url(self, url: str) -> str:
        """Validates the URL and returns the username. Raises ValueError on invalid URLs."""
        pass
