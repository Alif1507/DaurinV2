from typing import Any

from app.core.config import Settings
from app.core.exceptions import AppError


class StorageService:
    def __init__(self, client: Any, settings: Settings) -> None:
        self.client = client
        self.settings = settings

    def upload(self, path: str, content: bytes, content_type: str) -> None:
        self.upload_to(self.settings.report_image_bucket, path, content, content_type)

    def upload_to(self, bucket: str, path: str, content: bytes, content_type: str) -> None:
        try:
            self.client.storage.from_(bucket).upload(
                path,
                content,
                file_options={"content-type": content_type, "upsert": "true"},
            )
        except Exception as exc:
            raise AppError("STORAGE_UPLOAD_FAILED", "Could not upload report image", 502) from exc

    def remove(self, path: str) -> None:
        self.remove_from(self.settings.report_image_bucket, path)

    def remove_from(self, bucket: str, path: str) -> None:
        try:
            self.client.storage.from_(bucket).remove([path])
        except Exception:
            # Cleanup is best effort and must not hide the successful primary operation.
            return

    def signed_url(self, path: str) -> str | None:
        try:
            result = self.client.storage.from_(self.settings.report_image_bucket).create_signed_url(
                path,
                self.settings.signed_url_ttl_seconds,
            )
            return result.get("signedURL") or result.get("signedUrl")
        except Exception:
            return None
