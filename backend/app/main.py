import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import init_db
from app.api import router as api_router

logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("kugaya.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Log production readiness and initialize DB
    readiness = settings.validate_production_readiness()
    logger.info(f"Starting {settings.PROJECT_NAME} in '{settings.ENVIRONMENT}' mode.")
    logger.info(f"Infrastructure: Database={readiness['database_type']}, Baseten={'Ready' if readiness['baseten_configured'] else 'Unset'}, Gnani={'Ready' if readiness['gnani_speech_configured'] else 'Unset'}")
    await init_db()
    yield
    logger.info(f"Shutting down {settings.PROJECT_NAME} gracefully.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG or settings.ENVIRONMENT != "production" else None,
    redoc_url=None,
    lifespan=lifespan
)

# Robust CORS Configuration for Production & Preview Environments
cors_origins = settings.ALLOWED_ORIGINS if isinstance(settings.ALLOWED_ORIGINS, list) else [settings.ALLOWED_ORIGINS]

if "*" in cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.netlify\.app|https://.*\.pages\.dev|http://localhost:\d+|http://127\.0\.0\.1:\d+",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_PREFIX)

@app.get("/health")
async def health_check():
    readiness = settings.validate_production_readiness()
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "ai_provider": settings.AI_PROVIDER,
        "database": readiness["database_type"],
        "baseten_ready": readiness["baseten_configured"],
        "gnani_speech_ready": readiness["gnani_speech_configured"]
    }

# Unified Single-Container SPA Frontend Serving (Optional)
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

static_dir = os.environ.get("FRONTEND_DIST_DIR", "static")
if os.path.isdir(static_dir):
    assets_dir = os.path.join(static_dir, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa_frontend(full_path: str):
        target = os.path.join(static_dir, full_path)
        if full_path and os.path.isfile(target):
            return FileResponse(target)
        return FileResponse(os.path.join(static_dir, "index.html"))

