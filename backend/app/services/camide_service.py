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

OBJECT_DETAILS = {
    "hazardous_batteries": {
        "label": "Baterai bekas",
        "examples": ["baterai AA/AAA", "baterai kancing", "baterai perangkat"],
        "guidance": "Pisahkan dari sampah biasa dan serahkan ke titik pengumpulan limbah B3.",
    },
    "hazardous_biomedical": {
        "label": "Limbah medis",
        "examples": ["masker terkontaminasi", "perban", "alat medis sekali pakai"],
        "guidance": "Jangan disentuh langsung. Laporkan kepada petugas untuk penanganan khusus.",
    },
    "hazardous_e-waste": {
        "label": "Sampah elektronik",
        "examples": ["kabel", "charger", "perangkat elektronik kecil"],
        "guidance": "Simpan terpisah dan kirim ke pengumpulan e-waste, bukan tempat sampah umum.",
    },
    "hazardous_toxic-sharp": {
        "label": "Benda tajam atau beracun",
        "examples": ["pecahan kaca", "benda tajam", "kemasan bahan kimia"],
        "guidance": "Jangan dipegang langsung. Amankan area dan hubungi petugas sekolah.",
    },
    "non_recyclable": {
        "label": "Sampah non-daur ulang",
        "examples": ["tisu kotor", "styrofoam", "kemasan multilapis"],
        "guidance": "Masukkan ke wadah residu setelah memastikan tidak tercampur bahan berbahaya.",
    },
    "organic": {
        "label": "Sampah organik",
        "examples": ["kulit pisang", "sisa makanan", "daun"],
        "guidance": "Masukkan ke wadah organik untuk pengomposan bila fasilitas tersedia.",
    },
    "recyclable_cardboard": {
        "label": "Kardus daur ulang",
        "examples": ["kotak kardus", "karton kemasan", "dus makanan bersih"],
        "guidance": "Bersihkan, keringkan, lalu pipihkan sebelum masuk wadah daur ulang.",
    },
    "recyclable_metal": {
        "label": "Logam daur ulang",
        "examples": ["kaleng minuman", "kaleng makanan", "tutup logam"],
        "guidance": "Kosongkan dan bilas bila perlu, lalu masukkan ke wadah anorganik.",
    },
    "recyclable_paper": {
        "label": "Kertas daur ulang",
        "examples": ["lembar kertas", "koran", "majalah"],
        "guidance": "Pastikan bersih dan kering sebelum masuk wadah kertas atau anorganik.",
    },
    "recyclable_plastic": {
        "label": "Plastik daur ulang",
        "examples": ["botol plastik", "gelas plastik", "wadah plastik bersih"],
        "guidance": "Kosongkan, bilas, dan masukkan ke wadah anorganik atau bank sampah.",
    },
    "inorganic": {
        "label": "Sampah anorganik",
        "examples": ["botol plastik", "kaleng", "kertas bersih"],
        "guidance": "Pisahkan berdasarkan material dan masukkan ke wadah daur ulang yang sesuai.",
    },
    "b3": {
        "label": "Sampah B3",
        "examples": ["baterai", "e-waste", "benda tajam"],
        "guidance": "Jangan masukkan ke sampah umum. Serahkan kepada petugas sekolah.",
    },
    "residual": {
        "label": "Sampah residu",
        "examples": ["tisu kotor", "styrofoam", "kemasan multilapis"],
        "guidance": "Masukkan ke wadah residu setelah dipastikan tidak berbahaya.",
    },
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
        object_key = prediction.get("object_class", category)
        object_confidence = min(1.0, max(0.0, float(prediction.get("object_confidence", confidence))))
        object_detail = OBJECT_DETAILS.get(object_key, OBJECT_DETAILS[category])
        object_is_confident = object_confidence >= self.settings.camide_confidence_threshold
        guidance_detail = object_detail if object_is_confident else OBJECT_DETAILS[category]
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
            "object_key": object_key,
            "object_label": object_detail["label"],
            "object_confidence": object_confidence,
            "object_is_confident": object_is_confident,
            "examples": guidance_detail["examples"],
            "disposal_guidance": guidance_detail["guidance"],
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
