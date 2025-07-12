import asyncio
import argparse
from collections import defaultdict
from datetime import datetime
import httpx
import logging
import os
from dotenv import load_dotenv
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import init_db, session_context
from app.loaders import get_loaders
from app.models import DetentionStatsReport
from app.services.excel import convert_to_df_dict, extract_tables
from app.loaders.common import ICEDataLoader


logger = logging.getLogger("openice.import-data")
logger.setLevel(logging.INFO)


async def import_data(file_path: str, session: AsyncSession):
    logger.info("Extracting tables...")
    with open(file_path, "rb") as file:
        raw_bytes = file.read()

    source_name = os.path.basename(file_path)
    file_name, file_extension = os.path.splitext(source_name)
    start_part, end_part = file_name.split("_")
    fiscal_year = start_part
    # 20XX or 21XX, either way remove last 2 digits
    current_year = str(datetime.now().year)
    if len(start_part) == 4:
        # 20XX, remove last 2 digits
        current_start = current_year[:2]
        fiscal_year = f"FY{current_start}{start_part[2:]}"

    # grab last 8 characters
    date_part = end_part[-8:]
    report_date = datetime.strptime(date_part, "%m%d%Y")
    publication_month = report_date.strftime("%b")
    publication_year = report_date.year

    report = DetentionStatsReport(
        source_name=source_name,
        fiscal_year=fiscal_year,
        publication_date=report_date,
        publication_month=publication_month,
        publication_year=publication_year,
        raw_bytes=raw_bytes,
    )
    session.add(report)

    all_loaders = get_loaders(fiscal_year)
    # group loaders by sheet name
    loaders_by_sheet: dict[str, list[ICEDataLoader]] = defaultdict(list)
    for loader in all_loaders:
        loaders_by_sheet[loader.sheet_name].append(loader)

    for sheet_name, sheet_loaders in loaders_by_sheet.items():
        logger.info(f"Processing {sheet_name}...")
        loader_skip_rows: list[int] = []
        for loader in sheet_loaders:
            loader_skip_rows.extend(loader.sheet_skip_rows or [])
        tables = extract_tables(
            file_path,
            sheet_name=sheet_name,
            sheet_skip_rows=None if not loader_skip_rows else loader_skip_rows,
        )
        data = convert_to_df_dict(tables)

        logger.info(
            f"Found {len(data)} tables in {sheet_name}, processing with {len(sheet_loaders)} loaders..."
        )
        for loader in sheet_loaders:
            logger.info(f"Loading {loader.name}...")
            df = data[loader.title]
            items = loader.load(df, report)
            session.add_all(items)
            await session.commit()
            for item in items:
                await session.refresh(item)
            logger.info(f"Loaded {len(items)} items for {loader.name}")
        logger.info(f"Completed {sheet_name}")
    logger.info("Data import completed")


async def main(file_path: str):
    logger.info("Initializing database...")
    await init_db()
    async with session_context() as session:
        await import_data(file_path, session)


if __name__ == "__main__":
    load_dotenv()
    parser = argparse.ArgumentParser()
    parser.add_argument("--file_path", type=str, required=True)
    args = parser.parse_args()

    logger.info("Starting data import...")
    try:
        asyncio.run(main(args.file_path))
    except KeyboardInterrupt:
        logger.info("Data import stopped.")
