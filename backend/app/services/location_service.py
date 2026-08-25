from datetime import datetime, timezone
from uuid import UUID

from app.core.exceptions import ConflictError, NotFoundError
from app.repositories.location_repository import LocationRepository
from app.schemas.location import LocationCreate, LocationUpdate


class LocationService:
    def __init__(self, repository: LocationRepository) -> None:
        self.repository = repository

    def require_active(self, location_id: UUID) -> dict:
        location = self.repository.get(location_id)
        if location is None:
            raise NotFoundError("LOCATION_NOT_FOUND", "Location not found")
        if not location["is_active"]:
            raise ConflictError("LOCATION_INACTIVE", "Location is inactive")
        return location

    def create(self, model: LocationCreate) -> dict:
        return self.repository.create(model.model_dump(mode="json", exclude_none=True))

    def update(self, location_id: UUID, model: LocationUpdate) -> dict:
        if self.repository.get(location_id) is None:
            raise NotFoundError("LOCATION_NOT_FOUND", "Location not found")
        payload = model.model_dump(mode="json", exclude_unset=True)
        payload["updated_at"] = datetime.now(timezone.utc).isoformat()
        return self.repository.update(location_id, payload) or {}

    def deactivate(self, location_id: UUID) -> None:
        self.update(location_id, LocationUpdate(is_active=False))
