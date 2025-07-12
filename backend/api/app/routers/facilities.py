from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy import func
from sqlmodel import select
from sqlalchemy.orm import selectinload
from urllib3 import HTTPResponse
from app.db import get_session
from app.limits import limiter
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import (
    Facility,
    FacilityRead,
    DetentionStatsReport,
)
from app.utils.cache import cache_headers
from app.services.reports import current_report_subquery


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
    sub_query = current_report_subquery()
    query = (
        select(Facility)
        .join(
            DetentionStatsReport,
            Facility.report_id == DetentionStatsReport.id,
        )
        .join(
            sub_query,
            Facility.report_id == sub_query.c.id,
        )
    )
    results = await session.exec(query)
    items = results.all()
    response.headers.update(cache_headers(max_age=60 * 60 * 24))
    return items
