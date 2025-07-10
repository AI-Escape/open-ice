from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the db
    await init_db()
    yield
