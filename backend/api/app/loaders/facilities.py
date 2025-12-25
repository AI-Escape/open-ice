from datetime import datetime, timedelta
import math
from pandas import DataFrame
from sqlmodel import SQLModel

from app.loaders.common import ICEDataLoader
from app.models import DetentionStatsReport, Facility


def _excel_to_datetime(value: float | int | str | None):
    if value in (None, ""):
        return None
    try:
        # format is YYYY-MM-DD
        return datetime.strptime(value, "%Y-%m-%d")
    except (TypeError, ValueError):
        return None


def _to_float(value: str | int | float | None):
    if value in (None, ""):
        return None
    try:
        val = float(value)
        # check for nan
        if math.isnan(val):
            return None
        return val
    except ValueError:
        return None


class FacilitiesLoader(ICEDataLoader):
    def __init__(self, fy: str):
        super().__init__(
            name="facilities",
            title=f"ICE Enforcement and Removal Operations Data, {fy}",
            sheet_name=f"Facilities FY{fy[-2:]}",
            sheet_skip_rows=[1, 2, 3, 5, 6],
        )
        self.fy = fy

    def load(self, df: DataFrame, report: DetentionStatsReport) -> list[SQLModel]:
        items: list[SQLModel] = []

        for _, row in df.iterrows():
            alos = _to_float(row[f"FY{self.fy[-2:]} ALOS"])
            if alos is None:
                alos = 0
            items.append(
                Facility(
                    report=report,
                    name=row["Name"],
                    address=row["Address"],
                    city=row["City"],
                    state=row["State"],
                    zip_code=str(row["Zip"]),
                    aor=row["AOR"],
                    type_detailed=row["Type Detailed"],
                    gender=row["Male/Female"],
                    fy25_alos=alos,
                    level_a=_to_float(row["Level A"]),
                    level_b=_to_float(row["Level B"]),
                    level_c=_to_float(row["Level C"]),
                    level_d=_to_float(row["Level D"]),
                    male_crim=_to_float(row["Male Crim"]),
                    male_non_crim=_to_float(row["Male Non-Crim"]),
                    female_crim=_to_float(row["Female Crim"]),
                    female_non_crim=_to_float(row["Female Non-Crim"]),
                    ice_threat_level_1=_to_float(row["ICE Threat Level 1"]),
                    ice_threat_level_2=_to_float(row["ICE Threat Level 2"]),
                    ice_threat_level_3=_to_float(row["ICE Threat Level 3"]),
                    no_ice_threat_level=_to_float(row["No ICE Threat Level"]),
                    mandatory=_to_float(row["Mandatory"]),
                    guaranteed_minimum=_to_float(row["Guaranteed Minimum"]),
                    last_inspection_type=row["Last Inspection Type"],
                    last_inspection_end_date=_excel_to_datetime(
                        row["Last Inspection End Date"]
                    ),
                    # pending_fy25_inspection=row[f"Pending FY{self.fy[-2:]} Inspection"],
                    last_inspection_standard=row["Last Inspection Standard"],
                    last_final_rating=row["Last Final Rating"],
                )
            )

        return items
