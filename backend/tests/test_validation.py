from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.schemas.waste import WasteRecordCreate
from app.utils.files import validate_image


def test_waste_requires_positive_weight():
    with pytest.raises(ValidationError):
        WasteRecordCreate(
            location_id="84356043-3875-4da4-9b85-8f4a574c96a2",
            record_date="2026-08-25",
            organic_weight=Decimal("0"),
            inorganic_weight=Decimal("0"),
            residual_weight=Decimal("0"),
        )


def test_file_signature_must_match_declared_mime():
    with pytest.raises(Exception) as error:
        validate_image(b"not an image", "image/png", 1024)
    assert getattr(error.value, "code", None) == "INVALID_FILE_CONTENT"


def test_valid_png_signature_is_accepted():
    image = validate_image(b"\x89PNG\r\n\x1a\n" + b"0" * 20, "image/png", 1024)
    assert image.extension == "png"
