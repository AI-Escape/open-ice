import json
from functools import wraps
import os
from typing import Any, Callable, TypeVar, Awaitable, Dict, Generic, ParamSpec, Optional
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models import Task
from app.db import session_context


ENVIRONMENT_NAME = os.getenv("ENVIRONMENT_NAME", "development")

P = ParamSpec("P")  # Represents the parameter specification
R = TypeVar("R")  # Represents the return type of the wrapped function

task_map: Dict[str, Callable[..., Awaitable[Any]]] = {}
max_parallel_map: Dict[str, int] = {}


class TaskQueueWrapper(Generic[P, R]):
    def __init__(
        self,
        func: Callable[P, Awaitable[R]],
        priority: int = 1,
        max_parallel: int = 1,
    ):
        self.func = func
        self.name = func.__name__
        self.priority = priority
        self.max_parallel = max_parallel
        task_map[self.name] = func
        max_parallel_map[self.name] = max_parallel

    def __call__(self, *args: P.args, **kwargs: P.kwargs) -> Awaitable[R]:
        """Call the original function."""
        return self.func(*args, **kwargs)

    def queue(self, *args: P.args, **kwargs: P.kwargs) -> Awaitable[Task]:
        """Queue the task in the database."""

        @wraps(self.func)
        async def wrapped_queue() -> Task:
            async with session_context() as session:
                # Serialize the args and kwargs to JSON
                # pop user_id from kwargs if it exists
                priority_modifier: Optional[int] = kwargs.pop("priority_modifier", None)
                task_args = json.dumps({"args": args, "kwargs": kwargs})

                priority = self.priority
                if priority_modifier is not None:
                    priority += priority_modifier

                # Create the Task object with the given priority
                task = Task(
                    name=self.name,
                    args=task_args,
                    priority=priority,
                    environment=ENVIRONMENT_NAME,
                )
                session.add(task)
                await session.commit()
                await session.refresh(task)
                return task

        return wrapped_queue()


def task(
    func: Optional[Callable[P, Awaitable[R]]] = None,
    *,
    priority: int = 1,
    max_parallel: int = 1,
):
    """
    Decorator for registering tasks. Can be used as:
    @task
    def my_task(...):
        ...

    or

    @task(priority=1)
    def my_task(...):
        ...
    """
    if func is None:
        # Decorator called with arguments
        def wrapper(f: Callable[P, Awaitable[R]]) -> TaskQueueWrapper[P, R]:
            return TaskQueueWrapper(f, priority=priority, max_parallel=max_parallel)

        return wrapper
    else:
        # Decorator called without arguments
        return TaskQueueWrapper(func, priority=priority, max_parallel=max_parallel)
