import asyncio
from typing import Dict
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

connections: Dict[UUID, list[WebSocket]] = {}
progress_updates: Dict[UUID, dict] = {}


def notify_progress(transcription_id: UUID, transcription) -> None:
    progress_updates[transcription_id] = {
        "type": "progress",
        "data": {
            "id": str(transcription_id),
            "status": transcription.status.value,
            "progress": transcription.progress,
            "text": transcription.result.text if transcription.result else None,
        },
    }

    if transcription_id in connections:
        for ws in connections[transcription_id]:
            try:
                asyncio.create_task(ws.send_json(progress_updates[transcription_id]))
            except Exception:
                pass


@router.websocket("/ws/transcriptions/{transcription_id}/progress")
async def websocket_progress(websocket: WebSocket, transcription_id: UUID):
    await websocket.accept()

    if transcription_id not in connections:
        connections[transcription_id] = []
    connections[transcription_id].append(websocket)

    try:
        if transcription_id in progress_updates:
            await websocket.send_json(progress_updates[transcription_id])

        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        connections[transcription_id].remove(websocket)
        if not connections[transcription_id]:
            del connections[transcription_id]
