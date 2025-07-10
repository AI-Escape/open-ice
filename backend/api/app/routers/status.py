from fastapi import APIRouter, Request
from urllib3 import HTTPResponse
from app.limits import limiter


router = APIRouter(
    prefix="/status",
    tags=["status"],
    responses={404: {"description": "Not found"}},
)


@router.head("/is-alive")
@limiter.limit("10/second")
async def is_alive(
    request: Request,
):
    return HTTPResponse(status=200)
