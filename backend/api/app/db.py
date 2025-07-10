import os
from typing import AsyncGenerator
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.exc import SQLAlchemyError

from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import DisconnectionError
from contextlib import asynccontextmanager

import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


engine = create_async_engine(
    f'postgresql+asyncpg://{os.environ.get("DATABASE_USER")}:{os.environ.get("DATABASE_PASSWORD")}@{os.environ.get("DATABASE_URL")}:5432/{os.environ.get("DATABASE_NAME")}',
    pool_size=10,
    max_overflow=20,
    pool_recycle=300,  # Recycles connections after x seconds
    pool_timeout=10,  # Waits for a connection for x seconds before raising an error
)

async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db():
    async with engine.begin() as conn:
        pass


async def get_session():
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except SQLAlchemyError as e:
            logger.info(f"Session rollback because of exception: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()


@asynccontextmanager
async def session_context() -> AsyncGenerator[AsyncSession, None]:
    session: AsyncSession = async_session()
    try:
        yield session
        await session.commit()
    except SQLAlchemyError as e:
        logger.info(f"Session rollback because of exception: {e}")
        await session.rollback()
        raise
    finally:
        await session.close()
