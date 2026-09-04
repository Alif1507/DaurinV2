from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from app.core.exceptions import AppError, AuthorizationError, NotFoundError
from app.repositories.profile_repository import ProfileRepository
from app.schemas.enums import Role
from app.schemas.user import UserCreate, UserUpdate


class UserService:
    def __init__(self, admin_client: Any, profiles: ProfileRepository) -> None:
        self.admin_client = admin_client
        self.profiles = profiles

    def create(self, model: UserCreate) -> dict:
        auth_user_id: str | None = None
        try:
            response = self.admin_client.auth.admin.create_user(
                {
                    "email": str(model.email),
                    "password": model.password,
                    "email_confirm": True,
                    "user_metadata": {"full_name": model.full_name},
                }
            )
            if response.user is None:
                raise AppError("AUTH_USER_CREATE_FAILED", "Supabase did not create the user", 502)
            auth_user_id = str(response.user.id)
            return self.profiles.create(
                {
                    "id": auth_user_id,
                    "email": str(model.email),
                    "full_name": model.full_name,
                    "role": model.role.value,
                    "is_active": True,
                }
            )
        except AppError:
            if auth_user_id:
                self._delete_auth_user(auth_user_id)
            raise
        except Exception as exc:
            if auth_user_id:
                self._delete_auth_user(auth_user_id)
            raise AppError("USER_CREATE_FAILED", "Could not create user", 502) from exc

    def update(self, user_id: UUID, model: UserUpdate) -> dict:
        current = self.profiles.get(user_id)
        if current is None:
            raise NotFoundError("USER_NOT_FOUND", "User not found")
        payload = model.model_dump(mode="json", exclude_unset=True)
        if "role" in payload and current["role"] == Role.ADMIN.value:
            raise AuthorizationError("Admin roles are protected and cannot be changed")
        payload["updated_at"] = datetime.now(timezone.utc).isoformat()
        result = self.profiles.update(user_id, payload)
        if result is None:
            raise NotFoundError("USER_NOT_FOUND", "User not found")
        return result

    def _delete_auth_user(self, user_id: str) -> None:
        try:
            self.admin_client.auth.admin.delete_user(user_id)
        except Exception:
            return
