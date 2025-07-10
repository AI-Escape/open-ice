import os
import asyncio
import json
from datetime import datetime
import traceback
from typing import Optional, Tuple
from sqlmodel import select, or_, and_, desc, func
from posthog import Posthog

from app.db import session_context
from app.models import Task
from app.tasks import task_map, max_parallel_map

import logging


MAX_TASK_RETRIES = int(os.getenv("MAX_TASK_RETRIES", 3))


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger()

ENVIRONMENT_NAME = os.getenv("ENVIRONMENT_NAME", "development")

if ENVIRONMENT_NAME != "development":
    posthog = Posthog(
        project_api_key=os.getenv("POSTHOG_API_KEY"),
        host=os.getenv("POSTHOG_HOST"),
    )


async def fetch_next_task(environment_name: str) -> Optional[Task]:
    """
    Fetch the most recent pending task and mark it as in-progress.
    """
    async with session_context() as session:
        # Select the next pending task
        # Change to priority ordering, so first sort by priority, then by created_at
        # include failed tasks with less than max retries left.
        statement = (
            select(Task).where(
                # implicit and between conditions and environment
                (
                    # either pending or failed with less than max retries
                    or_(
                        Task.status == "pending",
                        and_(
                            Task.status == "failed",
                            or_(
                                Task.retries == None,
                                Task.retries < MAX_TASK_RETRIES,
                            ),
                        ),
                    )
                ),
                Task.environment == environment_name,
            )
            # rank all pending above all failed so that pending tasks are
            # processed first, then we can retry failed tasks
            .order_by(
                desc(Task.status == "pending"),
                # then by priority, from lowest first to highest last
                Task.priority.asc(),
                # then by created_at, oldest first
                Task.created_at.asc(),
            )
        )
        result = await session.exec(statement)
        candidates = result.all()

        # Keep track of task names that have reached their parallel limit.
        at_capacity_names = set()

        for candidate in candidates:
            if candidate.name in at_capacity_names:
                # Skip checking this candidate if we already know its name is at capacity.
                # It is totally possible the capacity has changed since the last check.
                # but we will look at it again next time around. This is a good way to
                # avoid wasting time checking tasks that we know were recently at capacity.
                # this does mean sometimes the priority order is not respected, but it is
                # better to be efficient here and it is not a big deal if the priority order
                # is not always perfectly maintained.
                # Also, priority won't be respected anyways even without this, as
                # the list could have changed since we last checked - so no big deal.
                continue

            allowed_parallel = max_parallel_map.get(candidate.name, 1)

            # Count how many tasks with the same name are currently in progress.
            count_stmt = (
                select(func.count())
                .select_from(Task)
                .where(
                    Task.name == candidate.name,
                    Task.status == "in-progress",
                    Task.environment == environment_name,
                )
            )
            count_result = await session.exec(count_stmt)
            count_in_progress = count_result.one()
            if count_in_progress >= allowed_parallel:
                # Mark this name as having no capacity so we don't repeatedly check it
                # in this scheduling check.
                at_capacity_names.add(candidate.name)
                continue

            # Claim this task by marking it in-progress.
            candidate.status = "in-progress"
            candidate.updated_at = datetime.utcnow()
            session.add(candidate)
            await session.commit()
            return candidate

        return None


async def process_task(task: Task) -> Tuple[str, Optional[str]]:
    """
    Process a single task. Simulate processing with async sleep.
    """
    logger.info(f"Processing task {task.id}: {task.name}")

    try:
        # Parse {"args": args, "kwargs": kwargs} (stored as string) as JSON
        function_inputs = json.loads(task.args) if task.args else {}
        args = function_inputs.get("args", [])
        kwargs = function_inputs.get("kwargs", {})

        if task.name not in task_map:
            raise ValueError(f"Unknown task: {task.name}")

        task_function = task_map[task.name]
        kwargs["task"] = task
        raw_results = await task_function(*args, **kwargs)
        results = None
        if raw_results:
            results = json.dumps(raw_results)

        return "completed", results

    except Exception as e:
        logger.info(
            f"Task {task.id} ({task.name}) failed: {type(e)} - {e} {traceback.format_exc()}"
        )
        if ENVIRONMENT_NAME != "development":
            posthog.capture_exception(e)
        return "failed", None


async def update_task_status(task: Task, status: str, results: Optional[str]):
    """
    Update the status of a task in the database.
    """
    async with session_context() as session:
        task.status = status
        task.updated_at = datetime.utcnow()
        if results:
            task.results = results
        if status == "failed":
            if task.retries is None:
                task.retries = 0
            task.retries += 1
        session.add(task)
        await session.commit()


async def handle_task(task: Task):
    """
    Wraps the processing of a single task so that it can be launched as a background
    task. Once processing is complete, the task status is updated accordingly.
    """
    status, results = await process_task(task)
    await update_task_status(task, status, results)


async def cleanup_pending_tasks(environment_name: str):
    """
    Clean up any pending tasks that may have been interrupted while in-progress.
    """
    logger.info("Cleaning up pending tasks...")
    async with session_context() as session:
        statement = (
            select(Task)
            .where(
                Task.status == "in-progress",
                Task.environment == environment_name,
            )
            .order_by(Task.priority.asc(), Task.created_at.asc())
        )
        result = await session.exec(statement)
        tasks = result.all()
        for task in tasks:
            task.status = "pending"
            task.updated_at = datetime.utcnow()
            session.add(task)
        await session.commit()


async def task_worker(environment_name: str):
    """
    Continuously fetch and process tasks from the database.
    """

    logger.info("Starting task worker...")

    # first clean up any pending tasks that may have been interrupted while in-progress
    await cleanup_pending_tasks(environment_name)

    logger.info("Task worker ready to process tasks...")
    while True:
        try:
            candidate = await fetch_next_task(environment_name)
            if candidate:
                asyncio.create_task(handle_task(candidate))
            else:
                # Sleep before polling again
                await asyncio.sleep(2)
        except Exception as e:
            logger.info(f"Error in task worker: {e}")
            if ENVIRONMENT_NAME != "development":
                posthog.capture_exception(e)
            # Sleep before retrying
            await asyncio.sleep(10)
