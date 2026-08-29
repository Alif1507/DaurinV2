from uuid import UUID

from app.core.exceptions import AuthenticationError, AuthorizationError, ConflictError
from app.repositories.profile_repository import ProfileRepository
from app.schemas.user import Profile
from app.services.supabase import SupabaseGateway


class AuthService:
    def __init__(self, gateway: SupabaseGateway, profiles: ProfileRepository) -> None:
        self.gateway = gateway
        self.profiles = profiles

    def authenticate(self, token: str) -> Profile:
        try:
            response = self.gateway.auth_client.auth.get_user(token)
            auth_user = response.user
        except Exception as exc:
            raise AuthenticationError() from exc

        if auth_user is None or not auth_user.id:
            raise AuthenticationError()

        profile_data = self.profiles.get(UUID(str(auth_user.id)))
        if profile_data is None:
            profile_data = self._provision_student_profile(auth_user)
        profile = Profile.model_validate(profile_data)
        if not profile.is_active:
            raise AuthorizationError("This account is inactive")
        return profile

    def _provision_student_profile(self, auth_user) -> dict:
        email = str(auth_user.email or "").strip().lower()
        if not email:
            raise AuthenticationError("Authenticated account has no email address")
        metadata = auth_user.user_metadata or {}
        full_name = str(metadata.get("full_name") or email.split("@", maxsplit=1)[0]).strip()
        if len(full_name) < 2:
            full_name = "Daurin User"
        payload = {
            "id": str(auth_user.id),
            "full_name": full_name[:150],
            "email": email,
            "role": "student",
            "is_active": True,
        }
        try:
            return self.profiles.create(payload)
        except ConflictError:
            # Two simultaneous first requests may race; return the row that won.
            existing = self.profiles.get(UUID(str(auth_user.id)))
            if existing is None:
                raise
            return existing
