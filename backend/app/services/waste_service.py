from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

from app.core.exceptions import AppError, AuthorizationError, NotFoundError
from app.repositories.waste_repository import WasteRepository
from app.schemas.enums import Role
from app.schemas.user import Profile
from app.schemas.waste import WasteRecordCreate, WasteRecordUpdate
from app.services.location_service import LocationService


class WasteService:
    def __init__(self, repository: WasteRepository, locations: LocationService) -> None:
        self.repository = repository
        self.locations = locations

    def create(self, model: WasteRecordCreate, current_user: Profile) -> dict:
        self.locations.require_active(model.location_id)
        payload = model.model_dump(mode="json", exclude_none=True)
        payload["recorded_by"] = str(current_user.id)
        return self.repository.create(payload)

    def get(self, record_id: UUID) -> dict:
        record = self.repository.get(record_id)
        if record is None:
            raise NotFoundError("WASTE_RECORD_NOT_FOUND", "Waste record not found")
        return record

    @staticmethod
    def require_manager(record: dict, current_user: Profile) -> None:
        if current_user.role != Role.ADMIN and record["recorded_by"] != str(current_user.id):
            raise AuthorizationError("You can only change waste records that you created")

    def update(self, record_id: UUID, model: WasteRecordUpdate, current_user: Profile) -> dict:
        current = self.get(record_id)
        self.require_manager(current, current_user)
        payload = model.model_dump(mode="json", exclude_unset=True)
        if model.location_id is not None:
            self.locations.require_active(model.location_id)

        organic = Decimal(str(payload.get("organic_weight", current["organic_weight"])))
        inorganic = Decimal(str(payload.get("inorganic_weight", current["inorganic_weight"])))
        residual = Decimal(str(payload.get("residual_weight", current["residual_weight"])))
        if organic <= 0 and inorganic <= 0 and residual <= 0:
            raise AppError(
                "INVALID_WASTE_WEIGHTS",
                "At least one waste weight must be greater than zero",
                422,
            )
        payload["updated_at"] = datetime.now(timezone.utc).isoformat()
        return self.repository.update(record_id, payload) or {}

    def delete(self, record_id: UUID, current_user: Profile) -> None:
        current = self.get(record_id)
        self.require_manager(current, current_user)
        if not self.repository.delete(record_id):
            raise NotFoundError("WASTE_RECORD_NOT_FOUND", "Waste record not found")
