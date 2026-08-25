from __future__ import annotations

import re
from typing import Any
from uuid import UUID

from app.repositories.base import BaseRepository
from app.schemas.enums import WasteCategory


class GuideRepository(BaseRepository):
    table_name = "waste_guides"

    def get(self, guide_id: UUID | str) -> dict[str, Any] | None:
        response = self.execute(self.table.select("*").eq("id", str(guide_id)).limit(1))
        return self.first(response.data)

    def list(self, search: str | None, category: WasteCategory | None) -> list[dict[str, Any]]:
        query = self.table.select("*").eq("is_active", True)
        if category:
            query = query.eq("category", category.value)
        if search:
            safe_term = re.sub(r"[^\w\s.+-]", "", search, flags=re.UNICODE).strip()
            if safe_term:
                query = query.ilike("name", f"%{safe_term}%")
        response = self.execute(query.order("name"))
        return response.data or []

    def create(self, payload: dict[str, Any]) -> dict[str, Any]:
        response = self.execute(self.table.insert(payload))
        return response.data[0]

    def update(self, guide_id: UUID | str, payload: dict[str, Any]) -> dict[str, Any] | None:
        response = self.execute(self.table.update(payload).eq("id", str(guide_id)))
        return self.first(response.data)
