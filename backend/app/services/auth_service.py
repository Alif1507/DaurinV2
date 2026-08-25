from uuid import UUID

from app.core.exceptions import AuthenticationError, AuthorizationError, NotFoundError
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
            raise NotFoundError("PROFILE_NOT_FOUND", "Authenticated user profile was not found")
        profile = Profile.model_validate(profile_data)
        if not profile.is_active:
            raise AuthorizationError("This account is inactive")
        return profile
