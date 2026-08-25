from fastapi import APIRouter

from app.api.v1 import auth, dashboard, guides, locations, reports, users, waste


api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(locations.router)
api_router.include_router(reports.router)
api_router.include_router(waste.router)
api_router.include_router(guides.router)
api_router.include_router(dashboard.router)
api_router.include_router(users.router)
