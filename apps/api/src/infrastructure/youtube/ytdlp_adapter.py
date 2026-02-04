import asyncio
from typing import Callable, Optional

import yt_dlp

from src.application.ports.video_downloader import VideoDownloader, VideoInfo


class YtdlpAdapter(VideoDownloader):
    async def get_info(self, url: str) -> VideoInfo:
        loop = asyncio.get_event_loop()

        def extract_info():
            ydl_opts = {
                "quiet": True,
                "no_warnings": True,
                "extract_flat": False,
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                return VideoInfo(
                    title=info.get("title", "Unknown"),
                    duration_seconds=info.get("duration", 0),
                    url=url,
                )

        return await loop.run_in_executor(None, extract_info)

    async def download_audio(
        self,
        url: str,
        output_path: str,
        on_progress: Optional[Callable[[float], None]] = None,
    ) -> str:
        loop = asyncio.get_event_loop()

        def progress_hook(d):
            if on_progress and d["status"] == "downloading":
                total = d.get("total_bytes") or d.get("total_bytes_estimate", 0)
                downloaded = d.get("downloaded_bytes", 0)
                if total > 0:
                    on_progress((downloaded / total) * 100)

        def download():
            output_template = output_path.rsplit(".", 1)[0]
            ydl_opts = {
                "format": "bestaudio/best",
                "postprocessors": [
                    {
                        "key": "FFmpegExtractAudio",
                        "preferredcodec": "mp3",
                        "preferredquality": "192",
                    }
                ],
                "outtmpl": output_template,
                "quiet": True,
                "no_warnings": True,
                "progress_hooks": [progress_hook],
            }

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])

            return f"{output_template}.mp3"

        return await loop.run_in_executor(None, download)
