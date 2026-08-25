from __future__ import annotations

import re
from typing import Any
from uuid import UUID

from app.repositories.base import BaseRepository
from app.schemas.enums import Role
from app.utils.pagination import pagination_range


class ProfileRepository(BaseRepository):
    table_name = "profiles"

    def get(self, user_id: UUID | str) -> dict[str, Any] | None:
        response = self.execute(self.table.select("*").eq("id", str(user_id)).limit(1))
        return self.first(response.data)

    def create(self, payload: dict[str, Any]) -> dict[str, Any]:
        response = self.execute(self.table.insert(payload))
        return response.data[0]

    def update(self, user_id: UUID | str, payload: dict[str, Any]) -> dict[str, Any] | None:
        response = self.execute(self.table.update(payload).eq("id", str(user_id)))
        return self.first(response.data)

    def list(
        self,
        *,
        page: int,
        limit: int,
        role: Role | None,
        is_active: bool | None,
        search: str | None,
    ) -> tuple[list[dict[str, Any]], int]:
        query = self.table.select("*", count="exact")
        if role:
            query = query.eq("role", role.value)
        if is_active is not None:
            query = query.eq("is_active", is_active)
        if search:
            safe_term = re.sub(r"[^\w\s@.+-]", "", search, flags=re.UNICODE).strip()
            if safe_term:
                query = query.or_(f"full_name.ilike.%{safe_term}%,email.ilike.%{safe_term}%")
        start, end = pagination_range(page, limit)
        response = self.execute(query.order("created_at", desc=True).range(start, end))
        return response.data or [], response.count or 0
