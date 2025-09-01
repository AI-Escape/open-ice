from pandas import DataFrame
from sqlmodel import SQLModel
import pandas as pd
from app.loaders.common import ICEDataLoader, month_end_for_fy
from app.models import BookOutRelease, DetentionStatsReport


class BookOutReleaseLoader(ICEDataLoader):
    def __init__(self, fy: str):
        super().__init__(
            name="book-out-release",
            title=f"ICE Final Book Outs by Release Reason, Month and Criminality: {fy}",
            sheet_name=f"Detention FY{fy[-2:]}",
        )

    def load(self, df: DataFrame, report: DetentionStatsReport) -> list[SQLModel]:
        items: list[SQLModel] = []

        pub_month = report.publication_date.strftime("%b")
        incomplete = False  # becomes True once we hit pub_month
        started = True  # becomes False once we *pass* pub_month
        current_reason = None

        for _, row in df.iterrows():
            criminality = row["Criminality"]
            if not criminality:
                criminality = "Total"
            reason = row["Release Reason"]
            if current_reason is None or (
                current_reason != reason and reason is not None
            ):
                current_reason = reason

            for month in df.columns[2:]:
                value = row[month]
                # check if value is NaN or None and set to 0
                if pd.isna(value) or value is None:
                    releases = 0
                else:
                    releases = int(value)
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
                    BookOutRelease(
                        report=report,
                        timestamp=timestamp,
                        reason=current_reason,
                        criminality=criminality,
                        releases=releases,
                        incomplete=incomplete,
                        started=started,
                        range=stat_range,
                    )
                )

        return items
