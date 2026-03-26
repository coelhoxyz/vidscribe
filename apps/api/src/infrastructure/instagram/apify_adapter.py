import logging
import re
from typing import Optional

import httpx

from src.application.ports.profile_video_lister import ProfileVideoInfo, ProfileVideoLister

logger = logging.getLogger(__name__)

_PROFILE_URL_PATTERN = re.compile(
    r"(?:https?://)?(?:www\.)?instagram\.com/([A-Za-z0-9._]+)/?(?:\?.*)?$"
)

_APIFY_BASE_URL = "https://api.apify.com/v2"
_ACTOR_ID = "apify~instagram-scraper"


class ApifyAdapter(ProfileVideoLister):
    def __init__(self, api_token: str):
        self._api_token = api_token

    async def validate_profile_url(self, url: str) -> str:
        url = url.strip().rstrip("/")
        if re.fullmatch(r"[A-Za-z0-9._]+", url):
            return url

        match = _PROFILE_URL_PATTERN.match(url)
        if not match:
            raise ValueError(
                "Invalid Instagram URL. Use https://instagram.com/username or just the username."
            )
        return match.group(1)

    async def list_videos(
        self,
        profile_url: str,
        max_videos: Optional[int] = None,
    ) -> list[ProfileVideoInfo]:
        username = await self.validate_profile_url(profile_url)
        limit = max_videos or 20

        payload = {
            "directUrls": [f"https://www.instagram.com/{username}/"],
            "resultsType": "posts",
            "resultsLimit": limit,
            "searchType": "user",
            "searchLimit": 1,
        }

        url = f"{_APIFY_BASE_URL}/acts/{_ACTOR_ID}/run-sync-get-dataset-items"

        async with httpx.AsyncClient(timeout=300) as client:
            response = await client.post(
                url,
                params={"token": self._api_token},
                json=payload,
            )

            if response.status_code == 402:
                raise ValueError("Apify usage limit reached. Check your Apify plan.")
            if response.status_code == 401:
                raise ValueError("Invalid Apify API token. Check APIFY_API_TOKEN.")
            if response.status_code not in (200, 201):
                raise ValueError(f"Apify request failed (HTTP {response.status_code})")

            items = response.json()

        videos: list[ProfileVideoInfo] = []
        for item in items:
            is_video = item.get("isVideo") or item.get("type") == "Video"
            if not is_video:
                continue

            shortcode = item.get("shortCode", "")
            post_url = item.get("url") or f"https://www.instagram.com/p/{shortcode}/"

            videos.append(
                ProfileVideoInfo(
                    url=post_url,
                    title=item.get("caption", shortcode)[:80] if item.get("caption") else shortcode,
                    duration_seconds=item.get("videoDuration"),
                    posted_at=None,
                )
            )

            if max_videos and len(videos) >= max_videos:
                break

        logger.info(f"Found {len(videos)} videos for @{username} via Apify")
        return videos
