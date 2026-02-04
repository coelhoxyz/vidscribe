# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VidScribe is an open-source video transcription application powered by OpenAI Whisper. All processing happens locally on the user's machine.

## Commands

```bash
# Development
pnpm dev                    # Run all apps (frontend + backend via turbo)
pnpm build                  # Build all apps
pnpm lint                   # Lint all apps

# Backend only (apps/api)
cd apps/api
uvicorn src.main:app --reload --port 8000

# Frontend only (apps/web)
cd apps/web
pnpm dev
```

## Architecture

Monorepo structure with pnpm workspaces and Turborepo:

```
vidscribe/
├── apps/
│   ├── web/                # Next.js 14 frontend
│   │   └── src/
│   │       ├── app/        # App Router pages
│   │       ├── domain/     # Entities
│   │       ├── infrastructure/  # API client
│   │       └── ui/         # Components, hooks
│   └── api/                # Python FastAPI backend
│       └── src/
│           ├── domain/     # Entities, value objects
│           ├── application/    # Use cases, ports
│           ├── infrastructure/ # Whisper, yt-dlp adapters
│           └── interface_adapters/  # Routes, WebSocket
```

Both apps follow **Clean Architecture**:
- **Domain**: Entities, value objects (no external dependencies)
- **Application**: Use cases, ports (interfaces)
- **Infrastructure**: Concrete implementations (Whisper, yt-dlp, API client)
- **Interface Adapters**: Controllers, routes, presenters

## Key Files

- `apps/api/src/infrastructure/whisper/whisper_adapter.py` - Whisper transcription engine
- `apps/api/src/infrastructure/youtube/ytdlp_adapter.py` - YouTube download
- `apps/api/src/interface_adapters/api/routes/transcription_routes.py` - API endpoints
- `apps/web/src/ui/hooks/useTranscription.ts` - Frontend transcription hook
## API

```
POST /api/v1/transcriptions      # Start transcription (file or youtube_url)
GET  /api/v1/transcriptions/:id  # Get result
GET  /api/v1/transcriptions/:id/export?format=srt|vtt|txt|json
WS   /ws/transcriptions/:id/progress  # Real-time progress
```

## Environment Variables

```bash
WHISPER_MODEL_SIZE=base      # tiny, base, small, medium, large
CORS_ORIGINS=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
```
