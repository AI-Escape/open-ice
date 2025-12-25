from pandas import DataFrame
from sqlmodel import SQLModel
import pandas as pd
from app.loaders.common import ICEDataLoader, month_end_for_fy
from app.models import BookIn, DetentionStatsReport


class BookInLoader(ICEDataLoader):
    def __init__(self, fy: str):
        super().__init__(
            name="book-in",
            title=f"ICE Initial Book-Ins by Arresting Agency and Month: {fy}",
            sheet_name=f"Detention FY{fy[-2:]}",
        )

    def load(self, df: DataFrame, report: DetentionStatsReport) -> list[SQLModel]:
        items: list[SQLModel] = []

        pub_month = report.publication_date.strftime("%b")
        incomplete = False  # becomes True once we hit pub_month
        started = True  # becomes False once we *pass* pub_month

        for _, row in df.iterrows():
            agency = row["Agency"]

            for month in df.columns[1:]:
                if pd.isna(row[month]) or row[month] is None:
                    bookings = 0
                else:
                    bookings = int(row[month])
                stat_range = "month"

                if month == "Total":
                    timestamp = report.publication_date
                    stat_range = "fy"
                    started = True
                    incomplete = False
                elif month == pub_month:
                    timestamp = report.publication_date  # reporting month ⇒ exact date
                    incomplete = True
                else:
                    timestamp = month_end_for_fy(month, report.publication_date)

                    # keep the started / incomplete flags in sync
                    if incomplete and started:
                        started = False

                items.append(
                    BookIn(
                        report=report,
                        timestamp=timestamp,
                        agency=agency,
                        bookings=bookings,
                        incomplete=incomplete,
                        started=started,
                        range=stat_range,
                    )
                )

        return items
