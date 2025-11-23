"""
MentorHub AI Service - Main Application Entry Point

This service provides:
- AI-powered mentor-mentee matching
- Session transcription and summarization
- Predictive analytics
- Knowledge graph generation
"""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import make_asgi_app
import structlog
import time

from app.core.config import settings
from app.api import matching, transcription, analytics
from app.core.logging import setup_logging

# Setup structured logging
setup_logging()
logger = structlog.get_logger()

# Initialize FastAPI app
app = FastAPI(
    title="MentorHub AI Service",
    description="AI-powered matching, transcription, and analytics for MentorHub",
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()

    # Log request
    logger.info(
        "request_started",
        method=request.method,
        path=request.url.path,
        client=request.client.host if request.client else None
    )

    try:
        response = await call_next(request)
        duration = time.time() - start_time

        # Log response
        logger.info(
            "request_completed",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=round(duration * 1000, 2)
        )

        # Add timing header
        response.headers["X-Process-Time"] = str(duration)
        return response

    except Exception as e:
        duration = time.time() - start_time
        logger.error(
            "request_failed",
            method=request.method,
            path=request.url.path,
            error=str(e),
            duration_ms=round(duration * 1000, 2)
        )
        raise

# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for load balancers"""
    return {
        "status": "healthy",
        "service": "mentorhub-ai",
        "version": "3.0.0"
    }

# Readiness check endpoint
@app.get("/ready", tags=["Health"])
async def readiness_check():
    """Readiness check - validates all dependencies are available"""
    try:
        # TODO: Check database connection
        # TODO: Check Redis connection
        # TODO: Check ML models loaded

        return {
            "status": "ready",
            "checks": {
                "database": "ok",
                "redis": "ok",
                "ml_models": "ok"
            }
        }
    except Exception as e:
        logger.error("readiness_check_failed", error=str(e))
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "not_ready",
                "error": str(e)
            }
        )

# Include API routers
app.include_router(matching.router, prefix="/api/v3/matching", tags=["Matching"])
app.include_router(transcription.router, prefix="/api/v3/transcription", tags=["Transcription"])
app.include_router(analytics.router, prefix="/api/v3/analytics", tags=["Analytics"])

# Prometheus metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        "unhandled_exception",
        path=request.url.path,
        error=str(exc),
        exc_info=True
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An internal error occurred"
            }
        }
    )

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("ai_service_starting", version="3.0.0")
    # TODO: Load ML models
    # TODO: Initialize database connection pool
    # TODO: Initialize Redis connection
    logger.info("ai_service_started")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("ai_service_shutting_down")
    # TODO: Close database connections
    # TODO: Close Redis connections
    logger.info("ai_service_stopped")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info"
    )
