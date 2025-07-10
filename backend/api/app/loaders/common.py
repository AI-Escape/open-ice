from abc import ABC, abstractmethod
import logging
from pandas import DataFrame
from sqlmodel import SQLModel
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

from app.models import DetentionStatsReport


class ICEDataLoader(ABC):
    def __init__(self, name: str, title: str):
        self.name = name
        self.title = title
        self.logger = logging.getLogger(f"openice.loaders.{name}")
        self.logger.setLevel(logging.INFO)

    @abstractmethod
    def load(self, df: DataFrame, report: DetentionStatsReport) -> list[SQLModel]:
        pass


def month_end_for_fy(month_abbr: str, pub_date: datetime) -> datetime:
    """
    Convert a fiscal-year month abbreviation (Oct-Sep) into the last day of the
    *calendar* month it belongs to, based on the report’s publication date.
    """
    month_num = datetime.strptime(month_abbr, "%b").month

    # What year did this fiscal year start?
    #  - If the report was published Oct-Dec, the FY started this same year.
    #  - Otherwise (Jan-Sep) it started in the *previous* calendar year.
    fy_start_year = pub_date.year if pub_date.month >= 10 else pub_date.year - 1

    # Oct-Dec belong to the FY’s *start* year, the rest to start_year+1
    year = fy_start_year if month_num >= 10 else fy_start_year + 1

    first_day = datetime(year, month_num, 1)
    return first_day + relativedelta(months=1) - timedelta(days=1)
