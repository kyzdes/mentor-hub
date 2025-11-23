# MentorHub AI Service

AI-powered matching, transcription, and analytics service for MentorHub v3.0.

## Features

### 🎯 Intelligent Matching
- Semantic similarity using Sentence Transformers
- FAISS-powered vector search (sub-50ms)
- Multi-factor scoring (availability, expertise, communication style)
- Explainable AI with human-readable explanations

### 📝 Session Transcription
- Real-time transcription with Deepgram
- GPT-4 powered summarization
- Automatic action item extraction
- Knowledge graph generation

### 📊 Predictive Analytics
- Churn prediction (30-day lookahead)
- Revenue forecasting
- User health scoring
- Engagement metrics

## Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL 15+
- Redis 7+

### Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env with your API keys
```

### Run Locally

```bash
# Development mode (auto-reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Run with Docker

```bash
# Build image
docker build -t mentorhub-ai:latest .

# Run container
docker run -d \
  -p 8000:8000 \
  --env-file .env \
  --name mentorhub-ai \
  mentorhub-ai:latest
```

## API Documentation

### Interactive Docs
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Key Endpoints

#### Matching
```bash
# Get mentor recommendations
POST /api/v3/matching/recommend
{
  "mentee_id": "user_123",
  "goals": ["Learn React"],
  "skills_to_learn": ["React", "TypeScript"],
  "experience_level": "intermediate",
  "budget_min": 50,
  "budget_max": 150
}

# Load mentors (sync from main DB)
POST /api/v3/matching/load-mentors
{
  "mentors": [...]
}

# Record feedback
POST /api/v3/matching/feedback
{
  "mentee_id": "user_123",
  "mentor_id": "mentor_456",
  "action": "booked",
  "rating": 5
}
```

#### Transcription
```bash
# Start transcription
POST /api/v3/transcription/start
{
  "session_id": "session_789",
  "audio_url": "https://...",
  "language": "en"
}

# Stop and get summary
POST /api/v3/transcription/stop
{
  "session_id": "session_789"
}
```

#### Analytics
```bash
# Predict churn
POST /api/v3/analytics/predict-churn
{
  "user_id": "user_123"
}

# Get user health score
GET /api/v3/analytics/user-health/{user_id}

# Forecast revenue
POST /api/v3/analytics/forecast-revenue
{
  "time_horizon_days": 30
}
```

## Architecture

```
┌─────────────────────────────────────┐
│         FastAPI Application         │
├─────────────────────────────────────┤
│  ┌──────────┐  ┌──────────────────┐│
│  │ Matching │  │  Transcription   ││
│  │  Module  │  │     Module       ││
│  └──────────┘  └──────────────────┘│
│  ┌──────────┐  ┌──────────────────┐│
│  │Analytics │  │   ML Models      ││
│  │  Module  │  │  (Transformers)  ││
│  └──────────┘  └──────────────────┘│
└─────────────────────────────────────┘
           │              │
           ▼              ▼
    ┌───────────┐  ┌─────────────┐
    │PostgreSQL │  │    Redis    │
    │ (Metadata)│  │   (Cache)   │
    └───────────┘  └─────────────┘
```

## Configuration

See `.env.example` for all configuration options.

### Key Settings

- `SENTENCE_TRANSFORMER_MODEL`: Model for embeddings (default: all-MiniLM-L6-v2)
- `FAISS_INDEX_TYPE`: Vector index type (Flat, IVF, HNSW)
- `MATCHING_TOP_K`: Initial candidates before filtering
- `WEIGHT_*`: Scoring weights for different factors

## Development

### Code Style
```bash
# Format code
black app/

# Sort imports
isort app/

# Type checking
mypy app/

# Linting
flake8 app/
```

### Testing
```bash
# Run all tests
pytest

# With coverage
pytest --cov=app --cov-report=html

# Specific test
pytest tests/test_matching.py -v
```

### Monitoring

- **Health Check**: GET /health
- **Readiness Check**: GET /ready
- **Metrics**: GET /metrics (Prometheus format)

## Performance

### Benchmarks
- Matching query: < 50ms (p95)
- Transcription latency: ~2s per minute of audio
- Model loading: ~3s on startup

### Scaling
- Horizontal: Deploy multiple instances behind load balancer
- Caching: Redis for embeddings and results (5min TTL)
- Database: Connection pooling (10 connections per instance)

## Security

- API key authentication (via headers)
- Rate limiting: 100 req/min per IP
- Input validation: Pydantic models
- No sensitive data logging
- Secrets via environment variables

## Troubleshooting

### Common Issues

**Import errors**
```bash
# Ensure you're in virtual environment
source venv/bin/activate
pip install -r requirements.txt
```

**Model download fails**
```bash
# Models are downloaded on first use
# Ensure internet connection and disk space
# Models cached in ~/.cache/huggingface/
```

**Memory issues**
```bash
# Use smaller model or increase container memory
# Default model (all-MiniLM-L6-v2): ~80MB
```

## Contributing

1. Create feature branch
2. Make changes
3. Add tests
4. Run linting and tests
5. Submit PR

## License

Proprietary - MentorHub Platform

---

**Version**: 3.0.0
**Last Updated**: 2025-11-23
