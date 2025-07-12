import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from posthog import Posthog
from starlette.middleware.base import BaseHTTPMiddleware
from app.routers import (
    status,
    population,
    stay,
    release,
    disposition,
    booking,
    chat,
    facilities,
)
from app.limits import limiter
from app.utils.lifespan import lifespan
import logging

logger = logging.getLogger(__name__)

logging.basicConfig(level=logging.INFO)

ENVIRONMENT_NAME = os.getenv("ENVIRONMENT_NAME", "development")

app = FastAPI()
app.router.lifespan_context = lifespan
app.state.limiter = limiter

if ENVIRONMENT_NAME != "development":
    posthog = Posthog(
        project_api_key=os.getenv("POSTHOG_API_KEY"),
        host=os.getenv("POSTHOG_HOST"),
    )

    # Add middleware
    @app.middleware("http")
    async def flush_sentry(request: Request, call_next):
        response = await call_next(request)
        posthog.flush()
        return response


app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(status.router)
app.include_router(population.router)
app.include_router(stay.router)
app.include_router(release.router)
app.include_router(disposition.router)
app.include_router(booking.router)
app.include_router(chat.router)
app.include_router(facilities.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CatchServerErrorMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except Exception as exc:
            logger.exception(exc)
            if ENVIRONMENT_NAME != "development":
                posthog.capture_exception(exc)
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error, please try again later"},
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
            )


app.add_middleware(CatchServerErrorMiddleware)
