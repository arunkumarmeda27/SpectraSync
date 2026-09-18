"""FastAPI main application entrypoint for SpectraSync."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.analysis import router as analysis_router
from backend.app.api.auth import router as auth_router
from backend.app.api.demos import router as demos_router
from backend.app.api.files import router as files_router
from backend.app.api.health import router as health_router
from backend.app.api.jobs import router as jobs_router
from backend.app.api.reports import router as reports_router
from backend.app.api.websocket import router as websocket_router
from backend.app.core.config import settings
from backend.app.core.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Automated .IQ / .WAV Signal Analysis Platform - From Raw Recordings to Meaningful Signal Insights",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for local dev flexibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers under /api
api_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=api_prefix)
app.include_router(files_router, prefix=api_prefix)
app.include_router(jobs_router, prefix=api_prefix)
app.include_router(analysis_router, prefix=api_prefix)
app.include_router(reports_router, prefix=api_prefix)
app.include_router(demos_router, prefix=api_prefix)
app.include_router(health_router, prefix=api_prefix)
app.include_router(websocket_router)


@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "tagline": "From Raw Recordings to Meaningful Signal Insights",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR,
        "status": "operational"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
