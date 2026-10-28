"""Run: PYTHONPATH=. python -m unittest discover -s tests -p 'test_*.py'."""

from datetime import datetime
from pathlib import Path
from unittest import IsolatedAsyncioTestCase, TestCase
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from sqlalchemy import create_engine
from sqlmodel import Session, select

from app.models import BookIn, DetentionStatsReport, Facility
from app.scripts.import_data import import_data, main
from app.services.excel import extract_tables
from app.services.reports import current_report_subquery

FILES = Path(__file__).resolve().parents[1] / "app/files/data"
LATEST = FILES / "FY26_detentionStats07202026.xlsx"


def recording_session() -> MagicMock:
    session = MagicMock()
    session.exec = AsyncMock(
        return_value=MagicMock(first=MagicMock(return_value=None))
    )
    session.commit = AsyncMock()
    return session


class ImportTests(IsolatedAsyncioTestCase):
    async def test_latest_report_loads_all_tables_and_source_values(self):
        session = recording_session()
        counts = await import_data(str(LATEST), session)
        self.assertEqual(
            counts,
            {
                "average-daily-population": 156,
                "average-stay-length": 156,
                "book-in": 39,
                "book-out-release": 689,
                "processing-disposition": 15,
                "facilities": 208,
            },
        )
        session.commit.assert_awaited_once()
        items = session.add_all.call_args.args[0]
        june_total = next(
            item
            for item in items
            if isinstance(item, BookIn)
            and item.agency == "Total"
            and item.timestamp == datetime(2026, 6, 30)
        )
        self.assertEqual(june_total.bookings, 43138)
        adams = next(
            item
            for item in items
            if isinstance(item, Facility)
            and item.name == "ADAMS COUNTY CORRECTIONAL CENTER"
        )
        self.assertEqual(adams.last_inspection_end_date, datetime(2026, 5, 7))
        completed = {
            item.timestamp.strftime("%Y-%m")
            for item in items
            if isinstance(item, BookIn)
            and item.range == "month"
            and item.started
            and not item.incomplete
        }
        self.assertEqual(
            completed,
            {"2025-10", "2025-11", "2025-12"}
            | {f"2026-{month:02}" for month in range(1, 7)},
        )

    async def test_older_layout_keeps_partial_september_out_of_full_months(
        self,
    ):
        session = recording_session()
        counts = await import_data(
            str(FILES / "FY25_detentionStats09242025.xlsx"), session
        )
        self.assertEqual(counts["facilities"], 189)
        bookings = [
            item
            for item in session.add_all.call_args.args[0]
            if isinstance(item, BookIn) and item.range == "month"
        ]
        september = [item for item in bookings if item.timestamp.month == 9]
        self.assertEqual(len(september), 3)
        self.assertTrue(all(item.incomplete for item in september))

    async def test_last_table_failure_does_not_save_partial_report(self):
        session = recording_session()

        def missing_facilities(file_path, sheet_name, **kwargs):
            if sheet_name == "Facilities FY26":
                return {"Facility Information": []}
            return extract_tables(file_path, sheet_name, **kwargs)

        with patch(
            "app.scripts.import_data.extract_tables",
            side_effect=missing_facilities,
        ):
            with self.assertRaisesRegex(ValueError, "No rows found"):
                await import_data(str(LATEST), session)
        session.add.assert_not_called()
        session.add_all.assert_not_called()
        session.commit.assert_not_awaited()

    async def test_repeated_report_is_skipped(self):
        session = recording_session()
        session.exec.return_value.first.return_value = object()
        self.assertEqual(await import_data(str(LATEST), session), {})
        session.add.assert_not_called()
        session.commit.assert_not_awaited()

    async def test_dry_run_does_not_initialize_database(self):
        with patch("app.scripts.import_data.init_db") as init_db:
            await main(str(LATEST), dry_run=True)
        init_db.assert_not_called()


class LatestReportTests(TestCase):
    def test_latest_snapshot_selects_one_report_even_with_tied_dates(self):
        engine = create_engine("sqlite://")
        DetentionStatsReport.__table__.create(engine)
        with Session(engine) as session:
            for report_id, date in [
                (1, datetime(2025, 12, 22)),
                (2, datetime(2026, 7, 20)),
                (3, datetime(2026, 7, 20)),
            ]:
                session.add(
                    DetentionStatsReport(
                        id=report_id,
                        uuid=uuid4(),
                        source_name=f"report-{report_id}",
                        fiscal_year="FY2026",
                        publication_date=date,
                        publication_month=date.strftime("%b"),
                        publication_year=date.year,
                        raw_bytes=b"test",
                    )
                )
            session.commit()
            query = current_report_subquery()
            self.assertEqual(session.exec(select(query.c.id)).all(), [3])
        engine.dispose()
