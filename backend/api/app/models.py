from pydantic import BaseModel
from typing import Any, Optional
from datetime import datetime, date
from uuid import UUID
from sqlmodel import Relationship, SQLModel, Field
from sqlalchemy import func


def uuid():
    return Field(
        default=None,
        sa_column_kwargs={"server_default": func.gen_random_uuid()},
        unique=True,
        index=True,
    )


# for scheduler
class AppSchedulerJobs(SQLModel, table=True):
    __tablename__ = "apscheduler_jobs"
    # id character varying(191) COLLATE pg_catalog."default" NOT NULL,
    id: str = Field(primary_key=True, max_length=191)
    # next_run_time double precision,
    next_run_time: Optional[float] = Field(index=True)
    #  job_state bytea NOT NULL,
    job_state: bytes


class TaskSmallBase(SQLModel):
    name: str = Field(index=True)
    # 'pending', 'in-progress', 'completed', 'failed'
    status: str = Field(index=True, default="pending")
    # 0 to 100, optional progress for progress bars
    progress: Optional[int] = Field(index=True, default=None)


class TaskBase(TaskSmallBase):
    environment: Optional[str] = Field(index=True, default="production")
    retries: Optional[int] = Field(index=True)


class Task(TaskBase, table=True):
    __tablename__ = "tasks"
    id: Optional[int] = Field(primary_key=True)
    uuid: Optional[UUID] = uuid()
    args: Optional[str] = Field(default=None)  # JSON as string
    results: Optional[str] = Field(default=None)  # JSON as string
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    priority: Optional[int] = Field(default=1, index=True)


class TaskRead(TaskBase):
    uuid: UUID
    created_at: datetime
    updated_at: datetime


# reports
class BaseDetentionStatsReport(SQLModel):
    source_name: str = Field(index=True)  # e.g. FY25_detentionStats06202025
    fiscal_year: str = Field(index=True)  # e.g. "FY2025" (from name)
    publication_date: datetime = Field(index=True)  # e.g. 2025-06-20 (from name)
    publication_month: str = Field(index=True)  # Jan, Feb, Mar, etc.
    publication_year: int = Field(index=True)  # 2025
    raw_bytes: bytes = Field(default=None)
    hidden: bool = Field(default=False, index=True)


class DetentionStatsReport(BaseDetentionStatsReport, table=True):
    __tablename__ = "detention_stats_reports"

    id: Optional[int] = Field(primary_key=True)
    uuid: Optional[UUID] = uuid()
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

    average_daily_populations: list["AverageDailyPopulation"] = Relationship(
        back_populates="report",
    )
    average_stay_lengths: list["AverageStayLength"] = Relationship(
        back_populates="report",
    )
    book_out_releases: list["BookOutRelease"] = Relationship(
        back_populates="report",
    )
    book_ins: list["BookIn"] = Relationship(
        back_populates="report",
    )
    processing_dispositions: list["ProcessingDisposition"] = Relationship(
        back_populates="report",
    )
    facilities: list["Facility"] = Relationship(
        back_populates="report",
    )


class BaseAverageDailyPopulation(SQLModel):
    incomplete: bool = Field(default=False, index=True)
    started: bool = Field(default=False, index=True)
    range: str = Field(default="month", index=True)
    timestamp: datetime = Field(index=True)
    agency: str = Field(index=True)
    criminality: str = Field(index=True)
    population: float = Field(index=True)


class AverageDailyPopulation(BaseAverageDailyPopulation, table=True):
    __tablename__ = "average_daily_population"
    id: Optional[int] = Field(primary_key=True)
    uuid: Optional[UUID] = uuid()
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    report_id: int = Field(foreign_key="detention_stats_reports.id", index=True)
    report: DetentionStatsReport = Relationship(
        back_populates="average_daily_populations"
    )


class BaseAverageStayLength(SQLModel):
    incomplete: bool = Field(default=False, index=True)
    started: bool = Field(default=False, index=True)
    range: str = Field(default="month", index=True)
    timestamp: datetime = Field(index=True)
    agency: str = Field(index=True)
    criminality: str = Field(index=True)
    length_of_stay: float = Field(index=True)


class AverageStayLength(BaseAverageStayLength, table=True):
    __tablename__ = "average_stay_length"
    id: Optional[int] = Field(primary_key=True)
    uuid: Optional[UUID] = uuid()
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    report_id: int = Field(foreign_key="detention_stats_reports.id", index=True)
    report: DetentionStatsReport = Relationship(back_populates="average_stay_lengths")


class BaseBookOutRelease(SQLModel):
    incomplete: bool = Field(default=False, index=True)
    started: bool = Field(default=False, index=True)
    range: str = Field(default="month", index=True)
    timestamp: datetime = Field(index=True)
    reason: str = Field(index=True)
    criminality: str = Field(index=True)
    releases: int = Field(index=True)


class BookOutRelease(BaseBookOutRelease, table=True):
    __tablename__ = "book_out_release"
    id: Optional[int] = Field(primary_key=True)
    uuid: Optional[UUID] = uuid()
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    report_id: int = Field(foreign_key="detention_stats_reports.id", index=True)
    report: DetentionStatsReport = Relationship(back_populates="book_out_releases")


class BaseBookIn(SQLModel):
    incomplete: bool = Field(default=False, index=True)
    started: bool = Field(default=False, index=True)
    range: str = Field(default="month", index=True)
    timestamp: datetime = Field(index=True)
    agency: str = Field(index=True)
    bookings: int = Field(index=True)


class BookIn(BaseBookIn, table=True):
    __tablename__ = "book_in"
    id: Optional[int] = Field(primary_key=True)
    uuid: Optional[UUID] = uuid()
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    report_id: int = Field(foreign_key="detention_stats_reports.id", index=True)
    report: DetentionStatsReport = Relationship(back_populates="book_ins")


class BaseProcessingDisposition(SQLModel):
    disposition: str = Field(index=True)
    facility: str = Field(index=True)
    population: int = Field(index=True)


class ProcessingDisposition(BaseProcessingDisposition, table=True):
    __tablename__ = "processing_disposition"
    id: Optional[int] = Field(primary_key=True)
    uuid: Optional[UUID] = uuid()
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    report_id: int = Field(foreign_key="detention_stats_reports.id", index=True)
    report: DetentionStatsReport = Relationship(
        back_populates="processing_dispositions"
    )


class BaseFacility(SQLModel):
    name: str = Field(index=True)
    address: str = Field(index=True)
    city: str = Field(index=True)
    state: str = Field(index=True)
    zip_code: str = Field(index=True)
    aor: str = Field(index=True)
    type_detailed: str = Field(index=True)
    gender: Optional[str] = Field(default=None, index=True)
    # TODO need to re-name this column
    fy25_alos: float = Field(index=True)
    level_a: Optional[float] = Field(default=None, index=True)
    level_b: Optional[float] = Field(default=None, index=True)
    level_c: Optional[float] = Field(default=None, index=True)
    level_d: Optional[float] = Field(default=None, index=True)
    male_crim: Optional[float] = Field(default=None, index=True)
    male_non_crim: Optional[float] = Field(default=None, index=True)
    female_crim: Optional[float] = Field(default=None, index=True)
    female_non_crim: Optional[float] = Field(default=None, index=True)
    ice_threat_level_1: Optional[float] = Field(default=None, index=True)
    ice_threat_level_2: Optional[float] = Field(default=None, index=True)
    ice_threat_level_3: Optional[float] = Field(default=None, index=True)
    no_ice_threat_level: Optional[float] = Field(default=None, index=True)
    mandatory: Optional[float] = Field(default=None, index=True)
    guaranteed_minimum: Optional[float] = Field(default=None, index=True)
    last_inspection_type: Optional[str] = Field(default=None, index=True)
    last_inspection_end_date: Optional[datetime] = Field(default=None, index=True)
    # TODO need to re-name this column
    pending_fy25_inspection: Optional[str] = Field(default=None, index=True)
    last_inspection_standard: Optional[str] = Field(default=None, index=True)
    last_final_rating: Optional[str] = Field(default=None, index=True)


class Facility(BaseFacility, table=True):
    __tablename__ = "facilities"
    id: Optional[int] = Field(primary_key=True)
    uuid: Optional[UUID] = uuid()
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    report_id: int = Field(foreign_key="detention_stats_reports.id", index=True)
    report: DetentionStatsReport = Relationship(back_populates="facilities")


class AverageDailyPopulationRead(BaseAverageDailyPopulation):
    pass


class AverageStayLengthRead(BaseAverageStayLength):
    pass


class BookOutReleaseRead(BaseBookOutRelease):
    pass


class ProcessingDispositionRead(BaseProcessingDisposition):
    pass


class BookInRead(BaseBookIn):
    pass


class FacilityRead(BaseFacility):
    pass


# for chat
class ChatMessageBase(SQLModel):
    type: str  # function_call, function_call_output, text, etc.
    name: Optional[str] = Field(default=None)  # name of function for function_call
    arguments: Optional[str] = Field(default=None)  # json text for function_call
    call_id: Optional[str] = Field(
        default=None
    )  # id of function_call for function_call_output
    role: Optional[str] = Field(
        default=None
    )  # user, assistant, system, or none for function calls
    content: Optional[str] = Field(
        default=None
    )  # text content if type is text, otherwise none
    output: Optional[str] = Field(
        default=None
    )  # output of function_call_output, otherwise none
    value: Optional[str] = Field(
        default=None
    )  # json value of function_call_output, otherwise none
    hidden: bool = Field(default=False, index=True)


class ChatMessage(ChatMessageBase, table=True):
    __tablename__ = "chat_messages"
    id: Optional[int] = Field(primary_key=True)
    uuid: Optional[UUID] = Field(
        default=None,
        sa_column_kwargs={
            "server_default": func.gen_random_uuid(),
        },
        unique=True,
        index=True,
    )
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    chat_id: int = Field(index=True, foreign_key="chats.id")
    chat: "Chat" = Relationship(back_populates="messages")


class ChatMessageCreate(BaseModel):
    content: str


class ChatBase(SQLModel):
    name: Optional[str] = Field(index=True, default=None)
    description: Optional[str] = Field(index=True, default=None)


class Chat(ChatBase, table=True):
    __tablename__ = "chats"
    id: Optional[int] = Field(primary_key=True)
    uuid: Optional[UUID] = Field(
        default=None,
        sa_column_kwargs={
            "server_default": func.gen_random_uuid(),
        },
        unique=True,
        index=True,
    )
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    messages: list[ChatMessage] = Relationship(back_populates="chat")
    hidden: Optional[bool] = Field(default=None, index=True)


class ChatMessageRead(ChatMessageBase):
    uuid: UUID
    created_at: datetime


class ChatRead(ChatBase):
    id: int
    uuid: UUID
    created_at: datetime
    messages: list[ChatMessageRead]
