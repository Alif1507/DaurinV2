from datetime import date, datetime, timedelta, timezone
from typing import Any

from app.repositories.base import BaseRepository


class CamideRepository(BaseRepository):
    table_name = "waste_identifications"

    def create(self, payload: dict[str, Any]) -> dict[str, Any]:
        response = self.execute(self.table.insert(payload))
        return response.data[0]

    def aggregate_rows(self, *, start_date: date, end_date: date) -> list[dict[str, Any]]:
        start = datetime.combine(start_date, datetime.min.time(), tzinfo=timezone.utc)
        exclusive_end = datetime.combine(end_date + timedelta(days=1), datetime.min.time(), tzinfo=timezone.utc)
        response = self.execute(
            self.table.select("category,confidence,is_confident,created_at")
            .gte("created_at", start.isoformat())
            .lt("created_at", exclusive_end.isoformat())
            .order("created_at")
        )
        return response.data or []
