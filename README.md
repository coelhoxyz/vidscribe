# VidScribe - Open-Source Video Transcription & Subtitle Generator

**Transcribe any video or audio to text locally using OpenAI Whisper.** VidScribe is a free, open-source speech-to-text application that runs entirely on your machine — no cloud services, no API keys, no data leaves your computer.

Paste a YouTube URL or upload a video file, and get accurate transcriptions with subtitle export in SRT, VTT, TXT, and JSON formats. Built with a modern web UI and powered by [OpenAI Whisper](https://github.com/openai/whisper), which achieves human-level accuracy across 99 languages ([Radford et al., 2022](https://arxiv.org/abs/2212.04356)).

## Why VidScribe?

| Feature | VidScribe | Cloud Services (Otter.ai, Rev, etc.) |
|---------|-----------|--------------------------------------|
| **Privacy** | 100% local processing | Data uploaded to third-party servers |
| **Cost** | Free forever | $16–$30/month |
| **Languages** | 99 languages (auto-detect) | Limited language support |
| **Offline** | Works without internet | Requires internet connection |
| **Formats** | SRT, VTT, TXT, JSON | Varies by provider |
| **Source Code** | Open-source (MIT) | Proprietary |

## Features

- **Video & Audio Transcription** — Upload MP4, MKV, AVI, MP3, WAV, or any FFmpeg-supported format
- **YouTube Transcription** — Paste any YouTube URL to transcribe directly via [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- **99 Language Support** — Automatic language detection powered by Whisper's multilingual model
- **Subtitle Export** — Generate SRT, VTT, TXT, and JSON files for use in video editors, YouTube Studio, or media players
- **Real-Time Progress** — WebSocket-based live progress tracking during transcription
- **GPU Acceleration** — CUDA (NVIDIA) and MPS (Apple Silicon) support for faster processing
- **Multiple Model Sizes** — Choose from tiny, base, small, medium, or large Whisper models to balance speed and accuracy
- **Clean Architecture** — Modular, maintainable codebase following Clean Architecture and SOLID principles

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- pnpm
- FFmpeg (`brew install ffmpeg` on macOS)

### Installation

```bash
# Clone the repository
git clone https://github.com/coelhoxyz/vidscribe.git
cd vidscribe

# Copy environment file
cp .env.example .env

# Install frontend dependencies
pnpm install

# Install backend dependencies
cd apps/api
uv venv --python 3.11 .venv
source .venv/bin/activate
uv pip install -e ".[dev]"
cd ../..

# Run both frontend and backend
pnpm dev
```

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000

## How It Works

1. **Upload or paste a URL** — Drag a video/audio file or paste a YouTube link
2. **Processing** — VidScribe extracts audio using FFmpeg (or downloads via yt-dlp for YouTube) and feeds it to the Whisper model
3. **Transcription** — Whisper processes the audio locally on your CPU or GPU, with real-time progress updates via WebSocket
4. **Export** — Download the transcription as SRT subtitles, VTT captions, plain text, or structured JSON

## Architecture

```
vidscribe/
├── apps/
│   ├── web/          # Next.js 14 + React + TypeScript + Tailwind CSS
│   └── api/          # Python + FastAPI + OpenAI Whisper + yt-dlp
├── turbo.json        # Turborepo pipeline configuration
└── pnpm-workspace.yaml
```

Both frontend and backend follow **Clean Architecture** with domain, application, infrastructure, and interface adapter layers — keeping business logic decoupled from frameworks and external dependencies.

| Layer | Responsibility |
|-------|---------------|
| **Domain** | Entities, value objects (no external dependencies) |
| **Application** | Use cases, ports/interfaces |
| **Infrastructure** | Whisper engine, yt-dlp adapter, API client |
| **Interface Adapters** | REST routes, WebSocket handlers, React hooks |

## API Reference

```
GET  /api/v1/health                                  # Health check
GET  /api/v1/status                                  # Model info & device
POST /api/v1/transcriptions                          # Start transcription
GET  /api/v1/transcriptions/:id                      # Get transcription result
GET  /api/v1/transcriptions/:id/export?format=srt    # Export as SRT/VTT/TXT/JSON
WS   /ws/transcriptions/:id/progress                 # Real-time progress updates
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `WHISPER_MODEL_SIZE` | `base` | Whisper model: `tiny`, `base`, `small`, `medium`, `large` |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend URL for the frontend |

### Whisper Model Comparison

| Model | Parameters | Speed | Accuracy | VRAM |
|-------|-----------|-------|----------|------|
| `tiny` | 39M | Fastest | Good for clear audio | ~1 GB |
| `base` | 74M | Fast | Good balance | ~1 GB |
| `small` | 244M | Moderate | High accuracy | ~2 GB |
| `medium` | 769M | Slow | Very high accuracy | ~5 GB |
| `large` | 1550M | Slowest | Best accuracy | ~10 GB |

## FAQ

**What file formats does VidScribe support?**
VidScribe supports any audio or video format that FFmpeg can process, including MP4, MKV, AVI, MOV, WebM, MP3, WAV, FLAC, OGG, and more.

**Does VidScribe work offline?**
Yes. After the initial setup (downloading dependencies and the Whisper model), VidScribe works entirely offline. No internet connection is required for transcription.

**How accurate is the transcription?**
VidScribe uses OpenAI Whisper, which approaches human-level accuracy on English speech. According to the [original research paper](https://arxiv.org/abs/2212.04356), the large model achieves a 2.7% word error rate on the LibriSpeech benchmark. Accuracy varies by language, audio quality, and model size.

**Can I generate subtitles for YouTube videos?**
Yes. Paste any YouTube URL and VidScribe will download the audio using yt-dlp, transcribe it with Whisper, and let you export subtitles in SRT or VTT format — ready to upload to YouTube Studio or any video editor.

**Does it support GPU acceleration?**
Yes. VidScribe automatically detects NVIDIA GPUs (via CUDA) and Apple Silicon (via MPS) for faster transcription. CPU-only processing is also supported.

## Tech Stack

- **Frontend**: [Next.js 14](https://nextjs.org/), React, TypeScript, Tailwind CSS
- **Backend**: [FastAPI](https://fastapi.tiangolo.com/), Python, [OpenAI Whisper](https://github.com/openai/whisper), [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- **Build**: [Turborepo](https://turbo.build/), pnpm workspaces
- **Real-time**: WebSocket for live progress tracking

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT
