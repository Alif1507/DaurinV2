from __future__ import annotations

from datetime import date, timedelta
from typing import Any
from uuid import UUID

from app.repositories.base import BaseRepository
from app.utils.pagination import pagination_range


class WasteRepository(BaseRepository):
    table_name = "waste_records"

    def create(self, payload: dict[str, Any]) -> dict[str, Any]:
        response = self.execute(self.table.insert(payload))
        return response.data[0]

    def get(self, record_id: UUID | str) -> dict[str, Any] | None:
        response = self.execute(self.table.select("*").eq("id", str(record_id)).limit(1))
        return self.first(response.data)

    def list(
        self,
        *,
        page: int,
        limit: int,
        location_id: UUID | None,
        start_date: date | None,
        end_date: date | None,
    ) -> tuple[list[dict[str, Any]], int]:
        query = self.table.select("*", count="exact")
        if location_id:
            query = query.eq("location_id", str(location_id))
        if start_date:
            query = query.gte("record_date", start_date.isoformat())
        if end_date:
            query = query.lte("record_date", end_date.isoformat())
        start, end = pagination_range(page, limit)
        response = self.execute(query.order("record_date", desc=True).range(start, end))
        return response.data or [], response.count or 0

    def update(self, record_id: UUID | str, payload: dict[str, Any]) -> dict[str, Any] | None:
        response = self.execute(self.table.update(payload).eq("id", str(record_id)))
        return self.first(response.data)

    def delete(self, record_id: UUID | str) -> bool:
        response = self.execute(self.table.delete().eq("id", str(record_id)))
        return bool(response.data)

    def aggregate_rows(
        self,
        *,
        start_date: date | None,
        end_date: date | None,
        location_id: UUID | None,
    ) -> list[dict[str, Any]]:
        query = self.table.select(
            "record_date,organic_weight,inorganic_weight,residual_weight,location_id"
        )
        if location_id:
            query = query.eq("location_id", str(location_id))
        if start_date:
            query = query.gte("record_date", start_date.isoformat())
        if end_date:
            query = query.lt("record_date", (end_date + timedelta(days=1)).isoformat())
        response = self.execute(query.order("record_date"))
        return response.data or []
