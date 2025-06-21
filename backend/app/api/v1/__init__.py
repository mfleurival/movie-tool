from fastapi import APIRouter
from .projects import router as projects_router
from .characters import router as characters_router
from .clips import router as clips_router
from .processing import router as processing_router

api_router = APIRouter(prefix="/api/v1")

# Include all routers
api_router.include_router(projects_router)
api_router.include_router(characters_router)
api_router.include_router(clips_router)
api_router.include_router(processing_router)

__all__ = ["api_router"]