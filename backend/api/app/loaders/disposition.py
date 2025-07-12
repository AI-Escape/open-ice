from pandas import DataFrame
from sqlmodel import SQLModel
from app.loaders.common import ICEDataLoader
from app.models import ProcessingDisposition, DetentionStatsReport


class ProcessingDispositionLoader(ICEDataLoader):
    def __init__(self, fy: str):
        super().__init__(
            name="processing-disposition",
            title=f"ICE Currently Detained by Processing Disposition and Detention Facility Type: {fy}",
            sheet_name=f"Detention FY{fy[-2:]}",
        )

    def load(self, df: DataFrame, report: DetentionStatsReport) -> list[SQLModel]:
        items: list[SQLModel] = []

        for _, row in df.iterrows():
            disposition = row["Processing Disposition"]

            for facility in df.columns[1:]:
                population = int(row[facility])

                items.append(
                    ProcessingDisposition(
                        report=report,
                        disposition=disposition,
                        facility=facility,
                        population=population,
                    )
                )

        return items
