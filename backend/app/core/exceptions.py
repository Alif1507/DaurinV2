from typing import Any

from fastapi import status


class AppError(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        *,
        errors: list[dict[str, Any]] | None = None,
    ) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        self.errors = errors
        super().__init__(message)


class ConfigurationError(AppError):
    def __init__(self, message: str = "Supabase is not configured") -> None:
        super().__init__("CONFIGURATION_ERROR", message, status.HTTP_503_SERVICE_UNAVAILABLE)


class AuthenticationError(AppError):
    def __init__(self, message: str = "Invalid or expired access token") -> None:
        super().__init__("UNAUTHORIZED", message, status.HTTP_401_UNAUTHORIZED)


class AuthorizationError(AppError):
    def __init__(self, message: str = "You do not have permission to perform this action") -> None:
        super().__init__("FORBIDDEN", message, status.HTTP_403_FORBIDDEN)


class NotFoundError(AppError):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(code, message, status.HTTP_404_NOT_FOUND)


class ConflictError(AppError):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(code, message, status.HTTP_409_CONFLICT)
