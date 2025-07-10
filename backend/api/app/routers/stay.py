from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy import func
from sqlmodel import select
from sqlalchemy.orm import selectinload
from urllib3 import HTTPResponse
from app.db import get_session
from app.limits import limiter
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import (
    AverageStayLength,
    AverageStayLengthRead,
    DetentionStatsReport,
)
from app.utils.cache import cache_headers


router = APIRouter(
    prefix="/stay",
    tags=["stay"],
    responses={404: {"description": "Not found"}},
)


@router.get("/current")
@limiter.limit("10/second")
async def current(
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_session),
) -> list[AverageStayLengthRead]:
    sub_query = (
        select(
            DetentionStatsReport.id,
            func.max(DetentionStatsReport.publication_date).label(
                "max_publication_date"
            ),
        )
        .group_by(DetentionStatsReport.id)
        .subquery()
    )
    query = (
        select(AverageStayLength)
        .join(
            DetentionStatsReport,
            AverageStayLength.report_id == DetentionStatsReport.id,
        )
        .join(
            sub_query,
            AverageStayLength.report_id == sub_query.c.id,
        )
        .where(
            AverageStayLength.incomplete == False,
            AverageStayLength.started == True,
            AverageStayLength.range == "month",
        )
    )
    results = await session.exec(query)
    items = results.all()
    response.headers.update(cache_headers(max_age=60 * 60 * 24))
    return items
