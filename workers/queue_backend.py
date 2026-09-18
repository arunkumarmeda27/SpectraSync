"""Queue abstraction supporting in-memory background worker pool and Redis."""

import abc
import json
import threading
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Callable, Dict, Optional
from backend.app.core.config import settings


class QueueBackend(abc.ABC):
    @abc.abstractmethod
    def enqueue(self, task_name: str, payload: Dict[str, Any]) -> str:
        pass


class InMemoryQueue(QueueBackend):
    """In-memory thread pool queue for zero-setup local development and tests."""

    def __init__(self, max_workers: int = 4):
        self.executor = ThreadPoolExecutor(max_workers=max_workers, thread_name_prefix="dsp-worker")
        self.handlers: Dict[str, Callable[[Dict[str, Any]], None]] = {}

    def register_handler(self, task_name: str, handler: Callable[[Dict[str, Any]], None]):
        self.handlers[task_name] = handler

    def enqueue(self, task_name: str, payload: Dict[str, Any]) -> str:
        handler = self.handlers.get(task_name)
        if not handler:
            raise ValueError(f"No worker handler registered for task: {task_name}")

        self.executor.submit(handler, payload)
        return f"mem-task-{payload.get('job_id', 'unknown')}"


class RedisQueue(QueueBackend):
    """Redis distributed queue for production worker deployment."""

    def __init__(self, redis_url: str):
        import redis
        self.client = redis.from_url(redis_url)
        self.queue_key = "spectrasync:jobs"

    def enqueue(self, task_name: str, payload: Dict[str, Any]) -> str:
        message = json.dumps({"task": task_name, "payload": payload})
        self.client.rpush(self.queue_key, message)
        return f"redis-task-{payload.get('job_id', 'unknown')}"


# Initialize active queue instance
if settings.USE_IN_MEMORY_QUEUE:
    job_queue = InMemoryQueue(max_workers=4)
else:
    try:
        job_queue = RedisQueue(settings.REDIS_URL)
    except Exception:
        job_queue = InMemoryQueue(max_workers=4)
