from dataclasses import dataclass

from app.core.exceptions import AppError


ALLOWED_IMAGE_MIME = {"image/jpeg", "image/png", "image/webp"}


@dataclass(frozen=True)
class ValidatedImage:
    content: bytes
    content_type: str
    extension: str


def detect_image_type(content: bytes) -> tuple[str, str] | None:
    if content.startswith(b"\xff\xd8\xff"):
        return "image/jpeg", "jpg"
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png", "png"
    if len(content) >= 12 and content[:4] == b"RIFF" and content[8:12] == b"WEBP":
        return "image/webp", "webp"
    return None


def validate_image(content: bytes, declared_mime: str | None, max_bytes: int) -> ValidatedImage:
    if len(content) > max_bytes:
        raise AppError("FILE_TOO_LARGE", "Image exceeds the configured upload limit", 413)
    if not content:
        raise AppError("EMPTY_FILE", "Uploaded image is empty", 400)
    if declared_mime not in ALLOWED_IMAGE_MIME:
        raise AppError("INVALID_FILE_TYPE", "Only JPEG, PNG, and WebP images are allowed", 422)

    detected = detect_image_type(content)
    if detected is None or detected[0] != declared_mime:
        raise AppError("INVALID_FILE_CONTENT", "File content does not match its image MIME type", 422)
    return ValidatedImage(content, detected[0], detected[1])
