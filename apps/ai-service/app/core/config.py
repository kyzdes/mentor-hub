"""
Configuration Management for AI Service

Uses pydantic-settings for type-safe configuration from environment variables.
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Application
    APP_NAME: str = "MentorHub AI Service"
    DEBUG: bool = False
    VERSION: str = "3.0.0"

    # API
    API_PREFIX: str = "/api/v3"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/mentorhub"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL: int = 300  # 5 minutes

    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4-turbo-preview"
    OPENAI_MAX_TOKENS: int = 2000

    # Deepgram (for transcription)
    DEEPGRAM_API_KEY: str = ""

    # ML Models
    SENTENCE_TRANSFORMER_MODEL: str = "all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION: int = 384
    FAISS_INDEX_TYPE: str = "Flat"  # Flat, IVF, HNSW

    # Matching Algorithm
    MATCHING_TOP_K: int = 50  # Initial candidates before filtering
    MATCHING_FINAL_K: int = 10  # Final recommendations
    MATCHING_MIN_SCORE: float = 0.5  # Minimum compatibility score

    # Scoring Weights
    WEIGHT_SEMANTIC: float = 0.30
    WEIGHT_AVAILABILITY: float = 0.20
    WEIGHT_EXPERTISE: float = 0.25
    WEIGHT_COMMUNICATION: float = 0.10
    WEIGHT_SUCCESS: float = 0.15

    # Analytics
    CHURN_THRESHOLD_DAYS: int = 30
    CHURN_MODEL_VERSION: str = "v1.0"

    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_PERIOD: int = 60  # seconds

    # Monitoring
    ENABLE_METRICS: bool = True
    ENABLE_TRACING: bool = True

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()
