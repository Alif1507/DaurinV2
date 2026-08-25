from app.schemas.enums import Role


def role_allowed(actual_role: Role, allowed_roles: tuple[Role, ...]) -> bool:
    return actual_role in allowed_roles
