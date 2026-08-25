from typing import Any

from app.core.exceptions import AppError, ConflictError


class BaseRepository:
    table_name: str

    def __init__(self, client: Any) -> None:
        self.client = client

    @property
    def table(self) -> Any:
        return self.client.table(self.table_name)

    @staticmethod
    def execute(query: Any) -> Any:
        try:
            return query.execute()
        except AppError:
            raise
        except Exception as exc:
            error_code = getattr(exc, "code", None)
            if error_code == "23505":
                raise ConflictError("DUPLICATE_RESOURCE", "A resource with these values already exists") from exc
            if error_code == "23503":
                raise ConflictError("RESOURCE_IN_USE", "The resource is referenced by another record") from exc
            raise AppError("DATABASE_ERROR", "Database operation failed", 500) from exc

    @staticmethod
    def first(data: list[dict[str, Any]] | None) -> dict[str, Any] | None:
        return data[0] if data else None
