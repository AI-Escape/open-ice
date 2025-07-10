import asyncio
from datetime import datetime
import httpx
import logging
import os
from dotenv import load_dotenv

from app.db import init_db, session_context
from app.loaders import get_loaders
from app.models import DetentionStatsReport
from app.services.excel import convert_to_df_dict, extract_tables


logger = logging.getLogger("openice.import-data")
logger.setLevel(logging.INFO)


async def main():
    logger.info("Initializing database...")
    await init_db()
    async with session_context() as session:
        logger.info("Extracting tables...")
        file_path = "app/files/data/FY25_detentionStats07072025.xlsx"
        sheet_name = "Detention FY25"
        with open(file_path, "rb") as file:
            raw_bytes = file.read()
        tables = extract_tables(
            file_path,
            sheet_name=sheet_name,
        )
        data = convert_to_df_dict(tables)
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
        loaders = get_loaders(fiscal_year)
        logger.info(
            f"Found {len(data)} tables, processing with {len(loaders)} loaders..."
        )
        for loader in loaders:
            logger.info(f"Loading {loader.name}...")
            df = data[loader.title]
            items = loader.load(df, report)
            session.add_all(items)
            await session.commit()
            for item in items:
                await session.refresh(item)
            logger.info(f"Loaded {len(items)} items for {loader.name}")
        logger.info("Data import completed")


if __name__ == "__main__":
    load_dotenv()

    logger.info("Starting data import...")
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Data import stopped.")
