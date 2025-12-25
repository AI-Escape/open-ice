from fastapi import APIRouter, Depends, Request, Response
from sqlmodel import select
from app.db import get_session
from app.limits import limiter
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import (
    Facility,
    FacilityRead,
)
from app.utils.cache import cache_headers
from app.services.reports import merged_facilities_subquery


router = APIRouter(
    prefix="/facilities",
    tags=["facilities"],
    responses={404: {"description": "Not found"}},
)


@router.get("/current")
@limiter.limit("10/second")
async def current(
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_session),
) -> list[FacilityRead]:
    sub_query = merged_facilities_subquery()
    query = select(Facility).where(Facility.id.in_(select(sub_query.c.id)))
    results = await session.exec(query)
    items = results.all()
    response.headers.update(cache_headers(max_age=60 * 60 * 24))
    return items
