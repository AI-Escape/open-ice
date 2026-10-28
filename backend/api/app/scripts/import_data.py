import asyncio
import argparse
from collections import defaultdict
from datetime import datetime
import logging
import os
from dotenv import load_dotenv
from sqlmodel import SQLModel, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import init_db, session_context
from app.loaders import get_loaders
from app.models import DetentionStatsReport
from app.services.excel import convert_to_df_dict, extract_tables
from app.loaders.common import ICEDataLoader

logger = logging.getLogger("openice.import-data")
logger.setLevel(logging.INFO)


async def import_data(
    file_path: str, session: AsyncSession | None = None
) -> dict[str, int]:
    """Load every table before saving; omit the session to validate only."""
    source_name = os.path.basename(file_path)
    if session is not None:
        existing = await session.exec(
            select(DetentionStatsReport).where(
                DetentionStatsReport.source_name == source_name
            )
        )
        if existing.first() is not None:
            logger.info("Report %s is already imported; skipping", source_name)
            return {}

    logger.info("Extracting tables...")
    with open(file_path, "rb") as file:
        raw_bytes = file.read()

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
    all_loaders = get_loaders(fiscal_year)
    counts: dict[str, int] = {}
    all_items: list[SQLModel] = []
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
            title = loader.title
            # Newer workbooks give the facility table its own heading.
            if loader.name == "facilities" and "Facility Information" in data:
                title = "Facility Information"
            df = data[title]
            if df.empty:
                raise ValueError(f"No rows found for {loader.name}")
            items = loader.load(df, report)
            all_items.extend(items)
            counts[loader.name] = len(items)
            logger.info(f"Loaded {len(items)} items for {loader.name}")
        logger.info(f"Completed {sheet_name}")

    if session is not None:
        session.add(report)
        session.add_all(all_items)
        await session.commit()
        logger.info("Data import completed")
    else:
        logger.info("Validation completed; no database writes")
    return counts


async def main(file_path: str, dry_run: bool = False):
    if dry_run:
        await import_data(file_path)
        return
    logger.info("Initializing database...")
    await init_db()
    async with session_context() as session:
        await import_data(file_path, session)


if __name__ == "__main__":
    load_dotenv()
    parser = argparse.ArgumentParser()
    parser.add_argument("--file_path", type=str, required=True)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate without database access",
    )
    args = parser.parse_args()

    logger.info("Starting data import...")
    try:
        asyncio.run(main(args.file_path, args.dry_run))
    except KeyboardInterrupt:
        logger.info("Data import stopped.")
