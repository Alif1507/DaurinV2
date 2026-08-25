from typing import Any
from uuid import UUID

from app.repositories.base import BaseRepository


class LocationRepository(BaseRepository):
    table_name = "locations"

    def get(self, location_id: UUID | str) -> dict[str, Any] | None:
        response = self.execute(self.table.select("*").eq("id", str(location_id)).limit(1))
        return self.first(response.data)

    def list_active(self) -> list[dict[str, Any]]:
        response = self.execute(self.table.select("*").eq("is_active", True).order("name"))
        return response.data or []

    def create(self, payload: dict[str, Any]) -> dict[str, Any]:
        response = self.execute(self.table.insert(payload))
        return response.data[0]

    def update(self, location_id: UUID | str, payload: dict[str, Any]) -> dict[str, Any] | None:
        response = self.execute(self.table.update(payload).eq("id", str(location_id)))
        return self.first(response.data)
