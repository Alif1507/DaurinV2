from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.exceptions import AuthenticationError, AuthorizationError
from app.core.security import role_allowed
from app.schemas.enums import Role
from app.schemas.user import Profile
from app.services.container import get_services


bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> Profile:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise AuthenticationError("Bearer access token is required")
    profile = get_services().auth.authenticate(credentials.credentials)
    request.state.user_id = str(profile.id)
    return profile


def require_roles(*allowed_roles: Role) -> Callable[..., Profile]:
    def dependency(current_user: Annotated[Profile, Depends(get_current_user)]) -> Profile:
        if not role_allowed(current_user.role, allowed_roles):
            raise AuthorizationError()
        return current_user

    return dependency


CurrentUser = Annotated[Profile, Depends(get_current_user)]
