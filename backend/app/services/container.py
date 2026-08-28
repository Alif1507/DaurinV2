from functools import cached_property, lru_cache

from app.core.config import get_settings
from app.repositories.guide_repository import GuideRepository
from app.repositories.camide_repository import CamideRepository
from app.repositories.location_repository import LocationRepository
from app.repositories.profile_repository import ProfileRepository
from app.repositories.report_repository import ReportRepository
from app.repositories.waste_repository import WasteRepository
from app.services.auth_service import AuthService
from app.services.camide_service import CamideService
from app.services.dashboard_service import DashboardService
from app.services.guide_service import GuideService
from app.services.location_service import LocationService
from app.services.report_service import ReportService
from app.services.storage_service import StorageService
from app.services.supabase import SupabaseGateway
from app.services.user_service import UserService
from app.services.waste_service import WasteService
from app.ml.classifier import WasteClassifier


class ServiceContainer:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.gateway = SupabaseGateway(self.settings)

    @cached_property
    def profiles(self) -> ProfileRepository:
        return ProfileRepository(self.gateway.admin_client)

    @cached_property
    def locations_repository(self) -> LocationRepository:
        return LocationRepository(self.gateway.admin_client)

    @cached_property
    def reports_repository(self) -> ReportRepository:
        return ReportRepository(self.gateway.admin_client)

    @cached_property
    def waste_repository(self) -> WasteRepository:
        return WasteRepository(self.gateway.admin_client)

    @cached_property
    def guides_repository(self) -> GuideRepository:
        return GuideRepository(self.gateway.admin_client)

    @cached_property
    def camide_repository(self) -> CamideRepository:
        return CamideRepository(self.gateway.admin_client)

    @cached_property
    def auth(self) -> AuthService:
        return AuthService(self.gateway, self.profiles)

    @cached_property
    def locations(self) -> LocationService:
        return LocationService(self.locations_repository)

    @cached_property
    def storage(self) -> StorageService:
        return StorageService(self.gateway.admin_client, self.settings)

    @cached_property
    def classifier(self) -> WasteClassifier:
        return WasteClassifier(self.settings)

    @cached_property
    def camide(self) -> CamideService:
        return CamideService(self.camide_repository, self.storage, self.classifier, self.settings)

    @cached_property
    def reports(self) -> ReportService:
        return ReportService(self.reports_repository, self.locations, self.storage, self.settings)

    @cached_property
    def waste(self) -> WasteService:
        return WasteService(self.waste_repository, self.locations)

    @cached_property
    def guides(self) -> GuideService:
        return GuideService(self.guides_repository)

    @cached_property
    def users(self) -> UserService:
        return UserService(self.gateway.admin_client, self.profiles)

    @cached_property
    def dashboard(self) -> DashboardService:
        return DashboardService(
            self.reports_repository,
            self.waste_repository,
            self.camide_repository,
            self.locations_repository,
            self.settings,
        )


@lru_cache
def get_services() -> ServiceContainer:
    return ServiceContainer()
