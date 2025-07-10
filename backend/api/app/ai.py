import logging
import os

from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

logging.basicConfig(level=logging.INFO)


client = AsyncOpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    # 15 minutes - for flex tier
    timeout=int(os.getenv("OPENAI_API_TIMEOUT", 900)),
)
