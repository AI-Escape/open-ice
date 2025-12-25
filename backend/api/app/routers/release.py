from fastapi import APIRouter, Depends, Request, Response
from sqlmodel import select
from app.db import get_session
from app.limits import limiter
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import (
    BookOutRelease,
    BookOutReleaseRead,
)
from app.utils.cache import cache_headers
from app.services.reports import merged_release_subquery


router = APIRouter(
    prefix="/release",
    tags=["release"],
    responses={404: {"description": "Not found"}},
)


@router.get("/current")
@limiter.limit("10/second")
async def current(
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_session),
) -> list[BookOutReleaseRead]:
    sub_query = merged_release_subquery()
    query = select(BookOutRelease).where(
        BookOutRelease.id.in_(select(sub_query.c.id))
    )
    results = await session.exec(query)
    items = results.all()
    response.headers.update(cache_headers(max_age=60 * 60 * 24))
    return items
