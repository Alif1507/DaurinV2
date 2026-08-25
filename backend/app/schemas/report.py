from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.enums import ProblemType, ReportStatus


class ReportCreate(BaseModel):
    location_id: UUID
    problem_type: ProblemType
    description: str | None = Field(default=None, max_length=500)


class ReportResolve(BaseModel):
    resolution_note: str = Field(min_length=2, max_length=500)


class ReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    reporter_id: UUID
    location_id: UUID
    problem_type: ProblemType
    description: str | None = None
    photo_path: str | None = None
    photo_url: str | None = None
    status: ReportStatus
    handled_by: UUID | None = None
    resolution_note: str | None = None
    started_at: datetime | None = None
    resolved_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
