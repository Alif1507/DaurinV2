from datetime import datetime, timezone
from uuid import UUID, uuid4

from app.core.config import Settings
from app.core.exceptions import AuthorizationError, ConflictError, NotFoundError
from app.repositories.report_repository import ReportRepository
from app.schemas.enums import ReportStatus, Role
from app.schemas.report import ReportCreate
from app.schemas.user import Profile
from app.services.location_service import LocationService
from app.services.storage_service import StorageService
from app.utils.files import validate_image


def validate_report_transition(current: ReportStatus, target: ReportStatus) -> None:
    allowed = {
        ReportStatus.REPORTED: ReportStatus.IN_PROGRESS,
        ReportStatus.IN_PROGRESS: ReportStatus.RESOLVED,
    }
    if allowed.get(current) != target:
        raise ConflictError(
            "INVALID_REPORT_TRANSITION",
            f"Report cannot transition from {current.value} to {target.value}",
        )


class ReportService:
    def __init__(
        self,
        repository: ReportRepository,
        locations: LocationService,
        storage: StorageService,
        settings: Settings,
    ) -> None:
        self.repository = repository
        self.locations = locations
        self.storage = storage
        self.settings = settings

    def create(self, model: ReportCreate, current_user: Profile) -> dict:
        self.locations.require_active(model.location_id)
        payload = model.model_dump(mode="json", exclude_none=True)
        payload.update({"reporter_id": str(current_user.id), "status": ReportStatus.REPORTED.value})
        return self.repository.create(payload)

    def get_authorized(self, report_id: UUID, current_user: Profile) -> dict:
        report = self.repository.get(report_id)
        if report is None:
            raise NotFoundError("REPORT_NOT_FOUND", "Report not found")
        if current_user.role in {Role.STUDENT, Role.TEACHER} and report["reporter_id"] != str(current_user.id):
            raise AuthorizationError("You can only access your own reports")
        return self.with_signed_url(report)

    def with_signed_url(self, report: dict) -> dict:
        result = dict(report)
        result["photo_url"] = self.storage.signed_url(report["photo_path"]) if report.get("photo_path") else None
        return result

    def start(self, report_id: UUID, current_user: Profile) -> dict:
        current = self.repository.get(report_id)
        if current is None:
            raise NotFoundError("REPORT_NOT_FOUND", "Report not found")
        validate_report_transition(ReportStatus(current["status"]), ReportStatus.IN_PROGRESS)
        now = datetime.now(timezone.utc).isoformat()
        updated = self.repository.transition(
            report_id,
            ReportStatus.REPORTED,
            {
                "status": ReportStatus.IN_PROGRESS.value,
                "handled_by": str(current_user.id),
                "started_at": now,
                "updated_at": now,
            },
        )
        if updated is None:
            raise ConflictError("REPORT_ALREADY_CHANGED", "Report status changed concurrently")
        return self.with_signed_url(updated)

    def resolve(self, report_id: UUID, resolution_note: str) -> dict:
        current = self.repository.get(report_id)
        if current is None:
            raise NotFoundError("REPORT_NOT_FOUND", "Report not found")
        validate_report_transition(ReportStatus(current["status"]), ReportStatus.RESOLVED)
        now = datetime.now(timezone.utc).isoformat()
        updated = self.repository.transition(
            report_id,
            ReportStatus.IN_PROGRESS,
            {
                "status": ReportStatus.RESOLVED.value,
                "resolution_note": resolution_note,
                "resolved_at": now,
                "updated_at": now,
            },
        )
        if updated is None:
            raise ConflictError("REPORT_ALREADY_CHANGED", "Report status changed concurrently")
        return self.with_signed_url(updated)

    def upload_image(
        self,
        report_id: UUID,
        current_user: Profile,
        content: bytes,
        content_type: str | None,
    ) -> dict:
        report = self.get_authorized(report_id, current_user)
        image = validate_image(content, content_type, self.settings.max_upload_bytes)
        path = f"reports/{report_id}/{uuid4()}.{image.extension}"
        self.storage.upload(path, image.content, image.content_type)
        try:
            updated = self.repository.update_photo(report_id, path)
            if updated is None:
                raise NotFoundError("REPORT_NOT_FOUND", "Report not found")
        except Exception:
            self.storage.remove(path)
            raise
        if report.get("photo_path"):
            self.storage.remove(report["photo_path"])
        return self.with_signed_url(updated)
