import asyncio
import httpx
import logging
import os

from app.tasks.worker import task_worker


ENVIRONMENT_NAME = os.getenv("ENVIRONMENT_NAME", "development")

if __name__ == "__main__":

    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger()

    logging.getLogger("httpx").setLevel(logging.WARNING)

    logger.info("Starting primary worker...")
    try:
        asyncio.run(
            task_worker(
                environment_name=ENVIRONMENT_NAME,
            )
        )
    except KeyboardInterrupt:
        logger.info("Task worker stopped.")
