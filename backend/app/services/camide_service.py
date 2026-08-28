from __future__ import annotations

from io import BytesIO
from uuid import uuid4

from PIL import Image, UnidentifiedImageError

from app.core.config import Settings
from app.core.exceptions import AppError
from app.ml.classifier import WasteClassifier
from app.repositories.camide_repository import CamideRepository
from app.schemas.user import Profile
from app.services.storage_service import StorageService
from app.utils.files import validate_image


LABELS = {
    "organic": "Organik",
    "inorganic": "Anorganik",
    "b3": "B3",
    "residual": "Residu",
}


class CamideService:
    def __init__(
        self,
        repository: CamideRepository,
        storage: StorageService,
        classifier: WasteClassifier,
        settings: Settings,
    ) -> None:
        self.repository = repository
        self.storage = storage
        self.classifier = classifier
        self.settings = settings

    def identify(self, current_user: Profile, content: bytes, content_type: str | None) -> dict:
        validated = validate_image(content, content_type, self.settings.max_upload_bytes)
        image = self._decode(validated.content)
        prediction = self.classifier.predict(image, validated.content)

        category = prediction["category"]
        confidence = min(1.0, max(0.0, float(prediction["confidence"])))
        identification_id = uuid4()
        image_path = None

        if self.settings.camide_store_images:
            image_path = f"camide/{current_user.id}/{identification_id}.{validated.extension}"
            self.storage.upload_to(
                self.settings.camide_image_bucket,
                image_path,
                validated.content,
                validated.content_type,
            )

        payload = {
            "id": str(identification_id),
            "user_id": str(current_user.id),
            "category": category,
            "confidence": confidence,
            "is_confident": confidence >= self.settings.camide_confidence_threshold,
            "image_path": image_path,
            "model_version": self.settings.camide_model_version,
        }
        try:
            saved = self.repository.create(payload)
        except Exception:
            if image_path:
                self.storage.remove_from(self.settings.camide_image_bucket, image_path)
            raise

        return {
            "category": category,
            "label": LABELS[category],
            "confidence": confidence,
            "is_confident": payload["is_confident"],
            "identification_id": saved.get("id", str(identification_id)),
        }

    def _decode(self, content: bytes) -> Image.Image:
        try:
            with Image.open(BytesIO(content)) as source:
                source.load()
                width, height = source.size
                if width > self.settings.camide_max_dimension or height > self.settings.camide_max_dimension:
                    raise AppError(
                        "IMAGE_DIMENSIONS_TOO_LARGE",
                        f"Image dimensions must not exceed {self.settings.camide_max_dimension} x "
                        f"{self.settings.camide_max_dimension} pixels",
                        422,
                    )
                return source.convert("RGB")
        except AppError:
            raise
        except (UnidentifiedImageError, OSError, ValueError) as exc:
            raise AppError("INVALID_IMAGE", "Uploaded file is not a decodable image", 422) from exc
