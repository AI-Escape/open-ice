from datetime import datetime
from typing import Optional

from sqlmodel import select
from sqlalchemy.orm import selectinload
from app.db import session_context
from app.models import Task


def get_priority_modifier(task: Optional[Task], base_priority: int) -> Optional[int]:
    if task is None:
        return None
    if task.priority == base_priority:
        return None
    # formula is task.priority + modifier = new priority
    # so modifier = new priority - task.priority
    return task.priority - base_priority
