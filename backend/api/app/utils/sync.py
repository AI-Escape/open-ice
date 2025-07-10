from datetime import datetime
import logging
from typing import Callable, TypeVar
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession


def update_model_if_changed(
    new: SQLModel,
    old: SQLModel,
    skip_fields: set | None = None,
    logger: logging.Logger = None,
) -> bool:
    """Compares and updates fields of 'old' model with values from 'new' model if they are different.

    Args:
        new (SQLModel): The new model instance with potentially updated fields.
        old (SQLModel): The old model instance to update.

    Returns:
        bool: True if any changes were made, False otherwise.
    """
    changed = False
    for field in new.__fields__.keys():
        if skip_fields and field in skip_fields:
            continue
        new_value = getattr(new, field)
        old_value = getattr(old, field)
        if isinstance(new_value, datetime):
            # assumes all datetimes are in UTC
            new_value = new_value.replace(tzinfo=None)
        if isinstance(old_value, datetime):
            # assumes all datetimes are in UTC
            old_value = old_value.replace(tzinfo=None)
        if new_value is None and old_value is None:
            continue
        if new_value != old_value:
            if logger:
                logger.info(f"  Updating {field} from {old_value} to {new_value}")
            setattr(old, field, new_value)
            changed = True

    return changed


T = TypeVar("T")


async def sync_db(
    session: AsyncSession,
    external: list[T],
    db: list[T],
    key: Callable[[T], str | int],
    logger: logging.Logger = None,
    skip_fields: set | None = None,
    refresh: bool = False,
):
    total = 0
    updated = 0
    found = 0
    updates = []
    inserts = []
    if skip_fields is None:
        skip_fields = set()
    db_lookup = {key(o): o for o in db}
    for o in external:
        o_key = key(o)
        if o_key in db_lookup:
            found += 1
            o_db = db_lookup[o_key]
            changed = update_model_if_changed(o, o_db, skip_fields, logger)
            if changed:
                updates.append(o_db)
                updated += 1
        else:
            inserts.append(o)
            db_lookup[o_key] = o
            total += 1

    if len(updates) > 0:
        session.add_all(updates)
        await session.commit()
        if refresh:
            for d in updates:
                await session.refresh(d)
    if len(inserts) > 0:
        session.add_all(inserts)
        await session.commit()
        if refresh:
            for d in inserts:
                await session.refresh(d)
    if logger:
        logger.info(f"  Added {total:,} and updated {updated:,}/{found:,}")
    return db_lookup
