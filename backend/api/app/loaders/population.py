from pandas import DataFrame
from sqlmodel import SQLModel
from app.loaders.common import ICEDataLoader, month_end_for_fy
from app.models import AverageDailyPopulation, DetentionStatsReport


class AverageDailyPopulationLoader(ICEDataLoader):
    def __init__(self, fy: str):
        super().__init__(
            name="average-daily-population",
            title=f"ICE Average Daily Population by Arresting Agency, Month and Criminality: {fy}",
            sheet_name=f"Detention FY{fy[-2:]}",
        )

    def load(self, df: DataFrame, report: DetentionStatsReport) -> list[SQLModel]:
        items: list[SQLModel] = []

        pub_month = report.publication_date.strftime("%b")
        incomplete = False  # becomes True once we hit pub_month
        started = True  # becomes False once we *pass* pub_month
        current_agency = None

        for _, row in df.iterrows():
            criminality = row["Agency"]
            if "Average" in criminality:
                parts = criminality.split()
                if len(parts) == 1:
                    criminality = "Average"
                    current_agency = "Average"
                else:
                    current_agency, criminality = parts  # two-word form

            for month in df.columns[1:]:
                population = row[month]
                stat_range = "month"

                if month == "FY Overall":
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
                    AverageDailyPopulation(
                        report=report,
                        timestamp=timestamp,
                        agency=current_agency,
                        criminality=criminality,
                        population=round(population, 2),
                        incomplete=incomplete,
                        started=started,
                        range=stat_range,
                    )
                )

        return items
