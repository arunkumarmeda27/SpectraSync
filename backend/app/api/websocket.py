"""WebSocket endpoint for streaming pipeline stage progress and logs."""

import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from workers.tasks import register_ws_subscriber, unregister_ws_subscriber

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/jobs/{job_id}")
async def job_progress_websocket(websocket: WebSocket, job_id: int):
    """Subscribe to real-time progress events for an active DSP analysis job."""
    await websocket.accept()
    queue = asyncio.Queue()

    def subscriber_cb(msg):
        try:
            queue.put_nowait(msg)
        except Exception:
            pass

    register_ws_subscriber(job_id, subscriber_cb)

    try:
        # Send initial confirmation
        await websocket.send_json({"type": "connected", "job_id": job_id})

        while True:
            # Wait for event from worker callback
            msg = await queue.get()
            await websocket.send_json(msg)
            if msg.get("status") in ["completed", "failed"]:
                break
    except (WebSocketDisconnect, Exception):
        pass
    finally:
        unregister_ws_subscriber(job_id, subscriber_cb)
