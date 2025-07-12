from sqlmodel import select, func
from app.models import DetentionStatsReport
from sqlalchemy import text


def current_report_subquery():
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
