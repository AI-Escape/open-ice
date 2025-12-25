from sqlmodel import select, func
from sqlalchemy import text, and_
from app.models import (
    DetentionStatsReport,
    AverageDailyPopulation,
    AverageStayLength,
    BookIn,
    BookOutRelease,
    ProcessingDisposition,
    Facility,
)


def current_report_subquery():
    """
    Returns a subquery that selects the ID of the most recent report.
    Used for point-in-time data where we only want the latest snapshot.
    """
    return (
        select(DetentionStatsReport.id)
        .select_from(
            select(
                DetentionStatsReport.id,
                DetentionStatsReport.publication_date,
                func.row_number()
                .over(
                    order_by=[
                        DetentionStatsReport.publication_date.desc(),
                        DetentionStatsReport.id.desc(),
                    ]
                )
                .label("rn"),
            )
            .select_from(DetentionStatsReport)
            .subquery()
        )
        .where(text("rn = 1"))
        .subquery()
    )


def merged_population_subquery():
    """
    Returns a subquery that selects the IDs of population records
    keeping the newest entry for each unique (timestamp, agency, criminality).
    This merges data across all reports, preferring newer reports.
    """
    inner = (
        select(
            AverageDailyPopulation.id,
            func.row_number()
            .over(
                partition_by=[
                    AverageDailyPopulation.timestamp,
                    AverageDailyPopulation.agency,
                    AverageDailyPopulation.criminality,
                ],
                order_by=[
                    DetentionStatsReport.publication_date.desc(),
                    DetentionStatsReport.id.desc(),
                ],
            )
            .label("rn"),
        )
        .select_from(AverageDailyPopulation)
        .join(
            DetentionStatsReport,
            AverageDailyPopulation.report_id == DetentionStatsReport.id,
        )
        .where(
            AverageDailyPopulation.incomplete == False,
            AverageDailyPopulation.started == True,
            AverageDailyPopulation.range == "month",
        )
        .subquery()
    )
    return select(inner.c.id).where(text("rn = 1")).subquery()


def merged_stay_subquery():
    """
    Returns a subquery that selects the IDs of stay length records
    keeping the newest entry for each unique (timestamp, agency, criminality).
    This merges data across all reports, preferring newer reports.
    """
    inner = (
        select(
            AverageStayLength.id,
            func.row_number()
            .over(
                partition_by=[
                    AverageStayLength.timestamp,
                    AverageStayLength.agency,
                    AverageStayLength.criminality,
                ],
                order_by=[
                    DetentionStatsReport.publication_date.desc(),
                    DetentionStatsReport.id.desc(),
                ],
            )
            .label("rn"),
        )
        .select_from(AverageStayLength)
        .join(
            DetentionStatsReport,
            AverageStayLength.report_id == DetentionStatsReport.id,
        )
        .where(
            AverageStayLength.incomplete == False,
            AverageStayLength.started == True,
            AverageStayLength.range == "month",
        )
        .subquery()
    )
    return select(inner.c.id).where(text("rn = 1")).subquery()


def merged_booking_subquery():
    """
    Returns a subquery that selects the IDs of booking records
    keeping the newest entry for each unique (timestamp, agency).
    This merges data across all reports, preferring newer reports.
    """
    inner = (
        select(
            BookIn.id,
            func.row_number()
            .over(
                partition_by=[
                    BookIn.timestamp,
                    BookIn.agency,
                ],
                order_by=[
                    DetentionStatsReport.publication_date.desc(),
                    DetentionStatsReport.id.desc(),
                ],
            )
            .label("rn"),
        )
        .select_from(BookIn)
        .join(
            DetentionStatsReport,
            BookIn.report_id == DetentionStatsReport.id,
        )
        .where(
            BookIn.incomplete == False,
            BookIn.started == True,
            BookIn.range == "month",
        )
        .subquery()
    )
    return select(inner.c.id).where(text("rn = 1")).subquery()


def merged_release_subquery():
    """
    Returns a subquery that selects the IDs of release records
    keeping the newest entry for each unique (timestamp, reason, criminality).
    This merges data across all reports, preferring newer reports.
    """
    inner = (
        select(
            BookOutRelease.id,
            func.row_number()
            .over(
                partition_by=[
                    BookOutRelease.timestamp,
                    BookOutRelease.reason,
                    BookOutRelease.criminality,
                ],
                order_by=[
                    DetentionStatsReport.publication_date.desc(),
                    DetentionStatsReport.id.desc(),
                ],
            )
            .label("rn"),
        )
        .select_from(BookOutRelease)
        .join(
            DetentionStatsReport,
            BookOutRelease.report_id == DetentionStatsReport.id,
        )
        .where(
            BookOutRelease.incomplete == False,
            BookOutRelease.started == True,
            BookOutRelease.range == "month",
        )
        .subquery()
    )
    return select(inner.c.id).where(text("rn = 1")).subquery()


def merged_facilities_subquery():
    """
    Returns a subquery that selects the IDs of facility records
    keeping the newest entry for each unique facility name.
    This merges data across all reports, preferring newer reports.
    """
    inner = (
        select(
            Facility.id,
            func.row_number()
            .over(
                partition_by=[
                    Facility.name,
                ],
                order_by=[
                    DetentionStatsReport.publication_date.desc(),
                    DetentionStatsReport.id.desc(),
                ],
            )
            .label("rn"),
        )
        .select_from(Facility)
        .join(
            DetentionStatsReport,
            Facility.report_id == DetentionStatsReport.id,
        )
        .subquery()
    )
    return select(inner.c.id).where(text("rn = 1")).subquery()
