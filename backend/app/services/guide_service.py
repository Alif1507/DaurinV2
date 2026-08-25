from datetime import datetime, timezone
from uuid import UUID

from app.core.exceptions import NotFoundError
from app.repositories.guide_repository import GuideRepository
from app.schemas.guide import GuideCreate, GuideUpdate


class GuideService:
    def __init__(self, repository: GuideRepository) -> None:
        self.repository = repository

    def create(self, model: GuideCreate) -> dict:
        return self.repository.create(model.model_dump(mode="json", exclude_none=True))

    def update(self, guide_id: UUID, model: GuideUpdate) -> dict:
        if self.repository.get(guide_id) is None:
            raise NotFoundError("GUIDE_NOT_FOUND", "Waste guide not found")
        payload = model.model_dump(mode="json", exclude_unset=True)
        payload["updated_at"] = datetime.now(timezone.utc).isoformat()
        return self.repository.update(guide_id, payload) or {}

    def deactivate(self, guide_id: UUID) -> None:
        self.update(guide_id, GuideUpdate(is_active=False))
