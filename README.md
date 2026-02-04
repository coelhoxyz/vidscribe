# VidScribe

Open-source video transcription application powered by OpenAI Whisper. All processing happens locally on your machine for privacy.

## Features

- Video to text transcription (upload files)
- YouTube video transcription (paste URL)
- Multiple language support (auto-detection)
- Export transcriptions in TXT, SRT, VTT, JSON formats
- Real-time progress tracking
- GPU acceleration support (CUDA/MPS)

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- pnpm
- FFmpeg (`brew install ffmpeg` on macOS)

### Setup

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

## Architecture

- **Frontend**: Next.js + React + TypeScript + Tailwind CSS
- **Backend**: Python + FastAPI + OpenAI Whisper + yt-dlp

Both frontend and backend follow Clean Architecture principles.

## API Endpoints

```
GET  /api/v1/health              # Health check
GET  /api/v1/status              # Backend status (model, device)
POST /api/v1/transcriptions      # Start transcription
GET  /api/v1/transcriptions/:id  # Get transcription
GET  /api/v1/transcriptions/:id/export?format=srt|vtt|txt|json
```

## Environment Variables

```bash
# Backend
WHISPER_MODEL_SIZE=base  # tiny, base, small, medium, large
CORS_ORIGINS=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## License

MIT
