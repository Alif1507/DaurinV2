import base64
from io import BytesIO
from types import SimpleNamespace
from uuid import uuid4

import numpy as np
import pytest
from PIL import Image

from app.core.config import Settings
from app.core.dependencies import get_current_user
from app.core.exceptions import AppError
from app.main import app
from app.ml.classifier import WasteClassifier
from app.schemas.enums import Role
from app.schemas.user import Profile
from app.services.camide_service import CamideService
from app.services.container import get_services


PNG_1X1 = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
)


def current_user() -> Profile:
    return Profile(
        id=uuid4(),
        full_name="Camide Student",
        email="camide@example.com",
        role=Role.STUDENT,
        is_active=True,
    )


class FakeRepository:
    def __init__(self, *, fail: bool = False) -> None:
        self.fail = fail

    def create(self, payload):
        if self.fail:
            raise AppError("DATABASE_ERROR", "Database operation failed", 500)
        return payload


class FakeStorage:
    def __init__(self) -> None:
        self.removed = []

    def upload_to(self, *args):
        return None

    def remove_from(self, bucket, path):
        self.removed.append((bucket, path))


class FakeClassifier:
    def __init__(self, confidence=0.91, category="inorganic") -> None:
        self.confidence = confidence
        self.category = category

    def predict(self, image, source_bytes):
        return {"category": self.category, "confidence": self.confidence}


def make_service(*, confidence=0.91, repository=None, store_images=False):
    settings = Settings(
        app_env="test",
        max_upload_mb=5,
        camide_confidence_threshold=0.55,
        camide_store_images=store_images,
    )
    return CamideService(
        repository or FakeRepository(),
        FakeStorage(),
        FakeClassifier(confidence),
        settings,
    )


def test_camide_requires_authentication(client):
    response = client.post(
        "/api/v1/camide/identify",
        files={"file": ("waste.png", PNG_1X1, "image/png")},
    )
    assert response.status_code == 401


def test_invalid_mime_is_rejected():
    with pytest.raises(AppError) as error:
        make_service().identify(current_user(), PNG_1X1, "text/plain")
    assert error.value.status_code == 422
    assert error.value.code == "INVALID_FILE_TYPE"


def test_oversized_file_is_rejected():
    with pytest.raises(AppError) as error:
        make_service().identify(current_user(), b"\x89PNG\r\n\x1a\n" + b"0" * (5 * 1024 * 1024), "image/png")
    assert error.value.status_code == 413


def test_invalid_image_bytes_are_rejected():
    with pytest.raises(AppError) as error:
        make_service().identify(current_user(), b"\x89PNG\r\n\x1a\nnot-an-image", "image/png")
    assert error.value.status_code == 422
    assert error.value.code == "INVALID_IMAGE"


def test_valid_mock_contract_and_low_confidence():
    result = make_service(confidence=0.42).identify(current_user(), PNG_1X1, "image/png")
    assert result["category"] in {"organic", "inorganic", "b3", "residual"}
    assert 0 <= result["confidence"] <= 1
    assert result["is_confident"] is False


def test_endpoint_returns_prediction(client):
    service = make_service()
    fake_services = SimpleNamespace(
        settings=service.settings,
        camide=service,
    )
    app.dependency_overrides[get_current_user] = current_user
    app.dependency_overrides[get_services] = lambda: fake_services
    response = client.post(
        "/api/v1/camide/identify",
        files={"file": ("waste.png", PNG_1X1, "image/png")},
    )
    assert response.status_code == 200
    assert response.json()["data"]["label"] == "Anorganik"


def test_missing_production_model_returns_503():
    settings = Settings(
        app_env="test",
        camide_mock_classifier=False,
        camide_model_path="missing-model.onnx",
    )
    classifier = WasteClassifier(settings)
    with pytest.raises(AppError) as error:
        classifier.predict(object(), PNG_1X1)
    assert error.value.status_code == 503
    assert error.value.code == "MODEL_NOT_READY"


def test_recylo_profile_uses_nhwc_and_groups_subclasses():
    settings = Settings(app_env="test", camide_model_profile="recylo_10class")
    classifier = WasteClassifier(settings)

    class FakeSession:
        tensor = None

        def get_inputs(self):
            return [SimpleNamespace(name="input")]

        def run(self, *_args):
            self.tensor = _args[1]["input"]
            return [np.asarray([[0.10, 0.10, 0.10, 0.10, 0.10, 0.20, 0.075, 0.075, 0.075, 0.075]])]

    session = FakeSession()
    classifier._get_session = lambda: session
    image = Image.open(BytesIO(PNG_1X1)).convert("RGB")

    result = classifier.predict(image, PNG_1X1)

    assert session.tensor.shape == (1, 224, 224, 3)
    assert result["category"] == "b3"
    assert result["confidence"] == pytest.approx(0.4)


def test_database_failure_removes_stored_image():
    service = make_service(repository=FakeRepository(fail=True), store_images=True)
    with pytest.raises(AppError) as error:
        service.identify(current_user(), PNG_1X1, "image/png")
    assert error.value.code == "DATABASE_ERROR"
    assert len(service.storage.removed) == 1
