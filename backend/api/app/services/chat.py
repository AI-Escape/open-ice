from datetime import date, datetime
import json
import logging
import os
from typing import Any, AsyncGenerator
from uuid import UUID
from decimal import Decimal

from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession
from app.ai import client
from app.db import session_context
import pandas as pd

from app.models import (
    AverageDailyPopulation,
    AverageStayLength,
    BookOutRelease,
    Chat,
    ChatMessage,
    DetentionStatsReport,
)

# TODO add tools here
# from app.services.tools.search import run_search, search_tool


class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return float(o)
        elif isinstance(o, UUID):
            return str(o)
        elif isinstance(o, datetime):
            return o.isoformat()
        elif isinstance(o, date):
            return o.isoformat()
        return super().default(o)


logger = logging.getLogger("openice.chat")
logger.setLevel(logging.INFO)
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
ch = logging.StreamHandler()
ch.setLevel(logging.INFO)
ch.setFormatter(formatter)
logger.addHandler(ch)


MAX_TOOL_CALL_STREAMS = int(os.getenv("MAX_TOOL_CALL_STREAMS", 30))


def create_tools() -> list[dict]:
    # TODO add more tools here
    return [
        # search_tool,
    ]


async def run_tool(
    name: str, arguments: str, chat_id: int
) -> tuple[str, dict[str, Any]]:
    args = json.loads(arguments)
    # TODO add tools here
    # if name == "search":
    #     return await run_search(args)
    # else:
    raise ValueError(f"Unknown tool: {name} ({arguments})")


def create_history(messages: list[ChatMessage]) -> list[dict]:
    history: list[dict] = []
    # TODO handle images, audio, etc.
    for message in messages:
        # skip hidden messages
        if message.hidden:
            continue
        if message.type == "text":
            history.append({"role": "user", "content": message.content})
        elif message.type == "function_call":
            assert message.arguments is not None, "Function call arguments are required"
            assert message.name is not None, "Function call name is required"
            assert message.call_id is not None, "Function call ID is required"
            history.append(
                {
                    "type": "function_call",
                    "call_id": message.call_id,
                    "name": message.name,
                    "arguments": message.arguments,
                }
            )
        elif message.type == "function_call_output":
            assert message.output is not None, "Function call output is required"
            assert message.call_id is not None, "Function call ID is required"
            history.append(
                {
                    "type": "function_call_output",
                    "call_id": message.call_id,
                    "output": message.output,
                }
            )
        else:
            raise ValueError(f"Unknown message type: {message.type}: {message}")
    return history


def parse_message(chat_id: int, message: dict) -> ChatMessage:
    if "type" not in message or message["type"] == "text":
        return ChatMessage(
            type="text",
            role=message["role"],
            content=message["content"],
            chat_id=chat_id,
            created_at=message["created_at"],
        )
    elif message["type"] == "function_call":
        return ChatMessage(
            type="function_call",
            call_id=message["call_id"],
            name=message["name"],
            arguments=message["arguments"],
            chat_id=chat_id,
            created_at=message["created_at"],
        )
    elif message["type"] == "function_call_output":
        return ChatMessage(
            type="function_call_output",
            call_id=message["call_id"],
            output=message["output"],
            value=message["value"],
            chat_id=chat_id,
            created_at=message["created_at"],
        )
    else:
        raise ValueError(f"Unknown message type: {message['type']}: {message}")


def parse_response_messages(
    chat_id: int,
    new_messages: list[dict],
) -> list[ChatMessage]:
    return [parse_message(chat_id, message) for message in new_messages]


# TODO add more context here
BASE_PROMPT = """
You are a helpful assistant that can answer questions about U.S. immigration detention statistics.

Provide high-level answers to the user's question, don't go into too much detail unless the user asks for it.

Avoid showing math or equations, just provide high-level answers based on the data you have access to.

If the user has not asked for a specific date, use the latest available data.

You can respond in markdown where appropriate, it will be rendered in the UI.
"""

MODEL_NAME = "gpt-4.1-mini"


async def get_report_prompt(session: AsyncSession) -> str:
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
        select(DetentionStatsReport)
        .join(
            sub_query,
            DetentionStatsReport.id == sub_query.c.id,
        )
        .order_by(DetentionStatsReport.publication_date.desc())
        .limit(1)
    )
    results = await session.exec(query)
    report = results.one_or_none()

    if report is None:
        return "No reports found"

    return f"The latest report is from {report.publication_date.strftime('%B %Y')}"


async def get_pop_prompt(session: AsyncSession) -> str:
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
        select(AverageDailyPopulation)
        .join(
            DetentionStatsReport,
            AverageDailyPopulation.report_id == DetentionStatsReport.id,
        )
        .join(
            sub_query,
            AverageDailyPopulation.report_id == sub_query.c.id,
        )
        .where(
            AverageDailyPopulation.incomplete == False,
            AverageDailyPopulation.started == True,
            AverageDailyPopulation.range == "month",
        )
        .order_by(AverageDailyPopulation.timestamp.asc())
    )
    results = await session.exec(query)
    items = results.all()

    grouped: dict[tuple[str, str], dict[str, float]] = {}

    # group by agency and criminality, then other columns are months and values are population
    for item in items:
        # YYYY-MM
        month = item.timestamp.strftime("%Y-%m")
        key = (item.agency, item.criminality)
        if key not in grouped:
            grouped[key] = {}
        grouped[key][month] = item.population

    rows: list[dict[str, Any]] = []
    # flatten and turn into table
    for (agency, criminality), row in grouped.items():
        row_dict = {
            "Agency": agency,
            "Criminality": criminality,
        }
        for month, population in row.items():
            row_dict[month] = population
        rows.append(row_dict)

    df = pd.DataFrame(rows)

    # turn into markdown table
    table = df.to_markdown()

    return f"Detention Population Statistics:\n\n{table}"


async def get_stay_prompt(session: AsyncSession) -> str:
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
        .order_by(AverageStayLength.timestamp.asc())
    )
    results = await session.exec(query)
    items = results.all()

    grouped: dict[tuple[str, str], dict[str, float]] = {}

    # group by agency and criminality, then other columns are months and values are population
    for item in items:
        # YYYY-MM
        month = item.timestamp.strftime("%Y-%m")
        key = (item.agency, item.criminality)
        if key not in grouped:
            grouped[key] = {}
        grouped[key][month] = item.length_of_stay

    rows: list[dict[str, Any]] = []
    # flatten and turn into table
    for (agency, criminality), row in grouped.items():
        row_dict = {
            "Agency": agency,
            "Criminality": criminality,
        }
        for month, length_of_stay in row.items():
            row_dict[month] = length_of_stay
        rows.append(row_dict)

    df = pd.DataFrame(rows)

    # turn into markdown table
    table = df.to_markdown()

    return f"Detention Stay Length Statistics:\n\n{table}"


async def get_release_prompt(session: AsyncSession) -> str:
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
        select(BookOutRelease)
        .join(
            DetentionStatsReport,
            BookOutRelease.report_id == DetentionStatsReport.id,
        )
        .join(
            sub_query,
            BookOutRelease.report_id == sub_query.c.id,
        )
        .where(
            BookOutRelease.incomplete == False,
            BookOutRelease.started == True,
            BookOutRelease.range == "month",
        )
        .order_by(BookOutRelease.timestamp.asc())
    )
    results = await session.exec(query)
    items = results.all()

    grouped: dict[tuple[str, str], dict[str, float]] = {}

    # group by agency and criminality, then other columns are months and values are population
    for item in items:
        # YYYY-MM
        month = item.timestamp.strftime("%Y-%m")
        key = (item.reason, item.criminality)
        if key not in grouped:
            grouped[key] = {}
        grouped[key][month] = item.releases

    rows: list[dict[str, Any]] = []
    # flatten and turn into table
    for (reason, criminality), row in grouped.items():
        row_dict = {
            "Reason": reason,
            "Criminality": criminality,
        }
        for month, releases in row.items():
            row_dict[month] = releases
        rows.append(row_dict)

    df = pd.DataFrame(rows)

    # turn into markdown table
    table = df.to_markdown()

    return f"Detention Release Statistics:\n\n{table}"


async def get_system_prompt(chat_id: int) -> str:
    async with session_context() as session:
        chat_query = select(Chat).where(Chat.id == chat_id)
        chat_result = await session.exec(chat_query)
        chat = chat_result.one_or_none()
        if chat is None:
            raise ValueError(f"Chat not found: {chat_id}")

        # add basic statistics here for every prompt
        report_prompt = await get_report_prompt(session)
        pop_prompt = await get_pop_prompt(session)
        stay_prompt = await get_stay_prompt(session)
        release_prompt = await get_release_prompt(session)

        prompt = (
            BASE_PROMPT
            + "\n\n"
            + "\n\n".join([report_prompt, pop_prompt, stay_prompt, release_prompt])
        )
        return prompt.strip()


async def run_chat(
    chat_id: int,
    messages: list[ChatMessage],
    new_content: str,
) -> AsyncGenerator[str, None]:
    start = datetime.utcnow()
    # TODO first inject the system prompt
    # TODO read from somewhere
    system_prompt = await get_system_prompt(chat_id)
    history = create_history(messages)
    context = history + [{"role": "user", "content": new_content}]
    tools = create_tools()

    # logger.info(f"Running chat with context: {context}")

    new_response_messages: list[dict] = []

    logger.info("Starting chat")

    logger.info(f"User message: {new_content}")
    done = False
    # TODO error handling and possible retries
    # need to loop here for function calls
    for tool_call_stream_idx in range(MAX_TOOL_CALL_STREAMS):
        ran_function = False
        if done:
            break
        async with client.responses.stream(
            # TODO set this somewhere
            model=MODEL_NAME,
            input=context,
            # we will manage storing the response in the DB ourselves
            store=False,
            instructions=system_prompt,
            # TODO set this somewhere
            max_output_tokens=10000,
            tools=tools,
            parallel_tool_calls=False,
            # reasoning={
            #     "effort": "high",
            #     "summary": "detailed",
            # },
            # TODO consider user, consider truncation, consider setting reasoning amount
            # TODO consider streaming reasoning info, consider temp / top_p
        ) as stream:
            logger.info(f"Starting stream: {tool_call_stream_idx}")
            async for event in stream:
                now = datetime.utcnow()
                if event.type == "response.created":
                    pass
                elif event.type == "response.in_progress":
                    pass
                elif event.type == "response.reasoning_summary_part.added":
                    # new reasoning summary part being created, show reasoning is in progress
                    yield json.dumps(
                        {"type": "response.reasoning_summary_part.added"}
                    ) + "\n"
                elif event.type == "response.reasoning_summary_text.delta":
                    # reasoning summary text being updated, send "delta" to client
                    yield json.dumps(
                        {
                            "type": "response.reasoning_summary_text.delta",
                            "delta": event.delta,
                        }
                    ) + "\n"
                elif event.type == "response.reasoning_summary_text.done":
                    # reasoning summary text is complete, can show reasoning is done
                    yield json.dumps(
                        {
                            "type": "response.reasoning_summary_text.done",
                        }
                    ) + "\n"
                elif event.type == "response.function_call_arguments.done":
                    pass
                elif event.type == "response.function_call_arguments.delta":
                    pass
                elif event.type == "response.reasoning_summary_part.done":
                    # reasoning summary part is complete, can show reasoning is done, don't need to send anything to client
                    pass
                elif event.type == "response.output_item.added":
                    item = event.item
                    if item.type == "reasoning":
                        # could send full reasoning to client
                        pass
                    elif item.type == "message":
                        # could sent full new message being created, has role and status, like role: assistant, status: in_progress
                        pass
                    elif item.type == "function_call":
                        # part is being added, could send to client
                        call_id = item.call_id
                        name = item.name
                        # consider yielding event here to show function call has started
                        pass
                elif event.type == "response.output_item.done":
                    item = event.item
                    if item.type == "reasoning":
                        # could send to show reasoning is done, but don't need to
                        pass
                    elif item.type == "message":
                        # could sent full new message being created, has role and status, like role: assistant, status: in_progress
                        pass
                    elif item.type == "output_text":
                        # full output text is complete
                        pass
                    elif item.type == "summary_text":
                        # could send to show reasoning summary text is complete, can show reasoning is done if we need, but can also use prior event
                        pass
                    elif item.type == "function_call":
                        # part is being added, could send to client
                        call_id = item.call_id
                        name = item.name
                        arguments = item.arguments
                        new_response_messages.append(
                            {
                                "type": "function_call",
                                "call_id": call_id,
                                "name": name,
                                "arguments": arguments,
                                "created_at": now,
                            }
                        )
                        context.append(
                            {
                                "type": "function_call",
                                "call_id": call_id,
                                "name": name,
                                "arguments": arguments,
                            }
                        )
                        # consider sending arguments here
                        yield json.dumps(
                            {
                                "type": "tool.call.created",
                                "name": name,
                            }
                        ) + "\n"
                        # call function
                        output_text, output_obj = await run_tool(
                            name, arguments, chat_id
                        )
                        now = datetime.utcnow()
                        # TODO figure out how to save outputs of these here
                        # yield outputs here
                        yield json.dumps(
                            {
                                "type": "tool.call.done",
                                "name": name,
                                "value": output_obj,
                            },
                            cls=DecimalEncoder,
                        ) + "\n"
                        # add to new messages and context
                        new_response_messages.append(
                            {
                                "type": "function_call_output",
                                "call_id": call_id,
                                "output": output_text,
                                "value": json.dumps(output_obj, cls=DecimalEncoder),
                                "created_at": now,
                            }
                        )
                        context.append(
                            {
                                "type": "function_call_output",
                                "call_id": call_id,
                                "output": output_text,
                            }
                        )
                        ran_function = True
                elif event.type == "response.output_text.delta":
                    # output text is being updated, send "delta" to client
                    yield json.dumps(
                        {"type": "response.output_text.delta", "delta": event.delta}
                    ) + "\n"
                elif event.type == "response.output_text.done":
                    # output text is complete, can add response to new_response_messages
                    logger.info(f"Response text is complete: {event.text}")
                    new_response_messages.append(
                        {
                            "type": "text",
                            "content": event.text,
                            "role": "assistant",
                            "created_at": now,
                        }
                    )
                    context.append(
                        {
                            "role": "assistant",
                            "content": event.text,
                        }
                    )
                elif event.type == "response.content_part.added":
                    # part is being added, could send to client
                    pass
                elif event.type == "response.content_part.done":
                    # part is done, no need to send anything to client
                    pass
                elif event.type == "response.completed":
                    logger.info("Response completed")
                    yield json.dumps(
                        {
                            "type": "response.completed",
                        }
                    ) + "\n"
                    if not ran_function:
                        done = True
                else:
                    event_json = event.json()
                    logger.info(f"unknown chat event:")
                    logger.info(event_json)
            logger.info(f"Stream {tool_call_stream_idx} finished")

    if not done:
        logger.info("Stream finished without completing")
        raise Exception("Stream finished without completing")

    logger.info(f"Persisting {len(new_response_messages) + 1} new chat messages")
    # logger.info(f"Response messages: {new_response_messages}")
    # need to persist new chat messages in db - wait till after streaming succeeds so any errors don't persist in chat
    # also need new session, as old session is closed due to event streaming
    async with session_context() as session:
        new_session_message = ChatMessage(
            type="text",
            content=new_content,
            role="user",
            chat_id=chat_id,
            created_at=start,
        )
        session.add(new_session_message)
        new_session_response_messages = parse_response_messages(
            chat_id, new_response_messages
        )
        session.add_all(new_session_response_messages)
        await session.commit()
    logger.info("New chat messages persisted")
