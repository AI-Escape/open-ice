from typing import Optional
from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import StreamingResponse
from sqlmodel import select
from urllib3 import HTTPResponse
from app.db import get_session
from app.limits import limiter
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import (
    Chat,
    ChatMessageCreate,
    ChatRead,
)
from app.services.chat import run_chat

router = APIRouter(
    prefix="/chat",
    tags=["chat"],
    responses={404: {"description": "Not found"}},
)


@router.post("")
@limiter.limit("10/minute")
async def create_chat(
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> ChatRead:
    chat = Chat(name="New Chat")
    session.add(chat)
    await session.commit()
    chat_query = (
        select(Chat).options(selectinload(Chat.messages)).where(Chat.id == chat.id)
    )
    chat_result = await session.exec(chat_query)
    chat = chat_result.one_or_none()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat


@router.get("/{uuid}")
@limiter.limit("10/second")
async def get_chat(
    request: Request,
    uuid: str,
    session: AsyncSession = Depends(get_session),
) -> ChatRead:
    chat_query = (
        select(Chat).where(Chat.uuid == uuid)
        # TODO hide hidden and other hidden messages
        .options(selectinload(Chat.messages))
    )
    chat_result = await session.exec(chat_query)
    chat = chat_result.one_or_none()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat


@router.post("/{uuid}/messages")
@limiter.limit("20/minute")
async def create_message(
    request: Request,
    uuid: str,
    message: ChatMessageCreate,
    session: AsyncSession = Depends(get_session),
):
    new_content = message.content.strip()
    if not new_content:
        raise HTTPException(status_code=400, detail="Message content is required")
    chat_query = (
        select(Chat).options(selectinload(Chat.messages)).where(Chat.uuid == uuid)
    )
    chat_result = await session.exec(chat_query)
    chat = chat_result.one_or_none()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    # TODO maybe prevent multiple concurrent chats with same uuid
    # sort messages by created_at, ascending (oldest first) and filter out hidden messages
    # TODO could do this in query
    messages = sorted(
        [m for m in chat.messages if not m.hidden], key=lambda m: m.created_at
    )

    gen = run_chat(chat.id, messages, new_content)

    return StreamingResponse(gen, media_type="text/event-stream")
