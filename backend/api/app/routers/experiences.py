from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Request, Response
from sqlmodel import select
from app.db import get_session
from app.limits import limiter
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import DetainmentExperience, DetainmentExperienceRead
from app.utils.cache import cache_headers

router = APIRouter(
    prefix="/experiences",
    tags=["experiences"],
    responses={404: {"description": "Not found"}},
)


@router.get("/recent")
@limiter.limit("10/second")
async def recent(
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_session),
) -> list[DetainmentExperienceRead]:
    cutoff = datetime.utcnow() - timedelta(days=180)
    query = (
        select(DetainmentExperience)
        .where(DetainmentExperience.reported_at >= cutoff)
        .order_by(DetainmentExperience.reported_at.desc())
    )
    results = await session.exec(query)
    items = results.all()
    response.headers.update(cache_headers(max_age=60 * 60))
    return items
