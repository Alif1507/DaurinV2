from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import Any
from uuid import UUID

from app.repositories.base import BaseRepository
from app.schemas.enums import ProblemType, ReportStatus
from app.utils.pagination import pagination_range


class ReportRepository(BaseRepository):
    table_name = "cleanliness_reports"

    def create(self, payload: dict[str, Any]) -> dict[str, Any]:
        response = self.execute(self.table.insert(payload))
        return response.data[0]

    def get(self, report_id: UUID | str) -> dict[str, Any] | None:
        response = self.execute(self.table.select("*").eq("id", str(report_id)).limit(1))
        return self.first(response.data)

    def list(
        self,
        *,
        page: int,
        limit: int,
        reporter_id: UUID | None = None,
        status: ReportStatus | None = None,
        location_id: UUID | None = None,
        problem_type: ProblemType | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> tuple[list[dict[str, Any]], int]:
        query = self.table.select("*", count="exact")
        if reporter_id:
            query = query.eq("reporter_id", str(reporter_id))
        if status:
            query = query.eq("status", status.value)
        if location_id:
            query = query.eq("location_id", str(location_id))
        if problem_type:
            query = query.eq("problem_type", problem_type.value)
        if date_from:
            query = query.gte("created_at", datetime.combine(date_from, datetime.min.time(), tzinfo=timezone.utc).isoformat())
        if date_to:
            exclusive_end = datetime.combine(date_to + timedelta(days=1), datetime.min.time(), tzinfo=timezone.utc)
            query = query.lt("created_at", exclusive_end.isoformat())
        start, end = pagination_range(page, limit)
        response = self.execute(query.order("created_at", desc=True).range(start, end))
        return response.data or [], response.count or 0

    def update_photo(self, report_id: UUID | str, photo_path: str) -> dict[str, Any] | None:
        response = self.execute(self.table.update({"photo_path": photo_path}).eq("id", str(report_id)))
        return self.first(response.data)

    def transition(
        self,
        report_id: UUID | str,
        expected_status: ReportStatus,
        payload: dict[str, Any],
    ) -> dict[str, Any] | None:
        response = self.execute(
            self.table.update(payload).eq("id", str(report_id)).eq("status", expected_status.value)
        )
        return self.first(response.data)

    def aggregate_rows(
        self,
        *,
        start_date: date | None,
        end_date: date | None,
        location_id: UUID | None,
    ) -> list[dict[str, Any]]:
        query = self.table.select("status,created_at,resolved_at,location_id")
        if location_id:
            query = query.eq("location_id", str(location_id))
        if start_date:
            query = query.gte("created_at", start_date.isoformat())
        if end_date:
            query = query.lt("created_at", (end_date + timedelta(days=1)).isoformat())
        response = self.execute(query.order("created_at"))
        return response.data or []
