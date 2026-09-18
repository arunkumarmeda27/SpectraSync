"""Standalone worker daemon for Redis queue processing."""

import json
import logging
import os
import sys
import time
from backend.app.core.config import settings
from workers.tasks import process_analysis_job

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [dsp-worker] %(message)s"
)
logger = logging.getLogger("dsp-worker")


def run_redis_worker():
    """Poll Redis queue and execute DSP analysis jobs."""
    import redis
    redis_url = settings.REDIS_URL
    logger.info(f"Starting SpectraSync DSP Worker connecting to {redis_url}...")

    client = redis.from_url(redis_url)
    queue_key = "spectrasync:jobs"

    logger.info(f"Listening for jobs on queue: {queue_key}")

    while True:
        try:
            # Blocking pop with 2s timeout
            item = client.blpop(queue_key, timeout=2)
            if not item:
                continue

            _, raw_data = item
            msg = json.loads(raw_data.decode("utf-8"))
            task_name = msg.get("task")
            payload = msg.get("payload", {})

            logger.info(f"Received task: {task_name} for job_id={payload.get('job_id')}")

            if task_name == "process_analysis_job":
                process_analysis_job(payload)
            else:
                logger.warning(f"Unknown task: {task_name}")

        except KeyboardInterrupt:
            logger.info("Worker shutting down...")
            break
        except Exception as e:
            logger.error(f"Worker error processing item: {e}", exc_info=True)
            time.sleep(1)


if __name__ == "__main__":
    run_redis_worker()
