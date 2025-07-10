import os
from zoneinfo import ZoneInfo
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import asyncio
from app.db import init_db

import logging


logger = logging.getLogger("openice.scheduler")
logger.setLevel(logging.INFO)
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
ch = logging.StreamHandler()
ch.setLevel(logging.INFO)
ch.setFormatter(formatter)
logger.addHandler(ch)

ENVIRONMENT_NAME = os.getenv("ENVIRONMENT_NAME", "development")


def start_scheduler():
    utc = ZoneInfo("UTC")

    # Get the event loop and start the scheduler
    loop = asyncio.get_event_loop()

    # only add jobs if we're not in development
    if ENVIRONMENT_NAME != "development":
        scheduler = AsyncIOScheduler(
            timezone=utc,
            logger=logger,
            event_loop=loop,
        )
        scheduler.add_jobstore(
            "sqlalchemy",
            url=f'postgresql://{os.environ.get("DATABASE_USER")}:{os.environ.get("DATABASE_PASSWORD")}@{os.environ.get("DATABASE_URL")}:5432/{os.environ.get("DATABASE_NAME")}',
        )

        scheduler.start()

    loop.run_until_complete(init_db())

    try:
        loop.run_forever()
    except (KeyboardInterrupt, SystemExit):
        pass


if __name__ == "__main__":
    start_scheduler()
