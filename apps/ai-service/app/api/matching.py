"""
Matching API Endpoints

Provides endpoints for AI-powered mentor-mentee matching.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import structlog

from app.models.matching import (
    get_matcher,
    MentorMatcher,
    MenteeProfile,
    MentorProfile,
    MatchResult
)

logger = structlog.get_logger()
router = APIRouter()


# Request/Response Models
class MatchingRequest(BaseModel):
    """Request model for mentor recommendations"""
    mentee_id: str
    goals: List[str] = Field(..., min_items=1, description="Learning goals")
    skills_to_learn: List[str] = Field(..., description="Skills to learn")
    industries: List[str] = Field(default=[], description="Industries of interest")
    experience_level: str = Field(..., description="beginner, intermediate, advanced")
    learning_style: str = Field(default="mixed", description="Learning style preference")
    communication_preference: str = Field(default="casual", description="Communication style")
    budget_min: float = Field(default=0, ge=0)
    budget_max: float = Field(default=1000, ge=0)
    availability: Dict[str, List[str]] = Field(default={}, description="Available time slots")
    preferred_languages: List[str] = Field(default=["en"])
    limit: int = Field(default=10, ge=1, le=50, description="Number of recommendations")

    class Config:
        json_schema_extra = {
            "example": {
                "mentee_id": "user_123",
                "goals": ["Learn React development", "Build portfolio projects"],
                "skills_to_learn": ["React", "TypeScript", "Next.js"],
                "industries": ["Technology", "Startups"],
                "experience_level": "intermediate",
                "learning_style": "hands-on",
                "communication_preference": "casual",
                "budget_min": 50,
                "budget_max": 150,
                "availability": {
                    "Monday": ["18:00-20:00"],
                    "Wednesday": ["18:00-20:00"],
                    "Saturday": ["10:00-14:00"]
                },
                "preferred_languages": ["en"],
                "limit": 10
            }
        }


class MatchFactors(BaseModel):
    """Individual matching factors"""
    semantic: float = Field(..., description="Semantic similarity score")
    availability: float = Field(..., description="Availability overlap score")
    expertise: float = Field(..., description="Expertise match score")
    communication: float = Field(..., description="Communication style compatibility")
    success: float = Field(..., description="Historical success rate")


class MatchRecommendation(BaseModel):
    """Single mentor recommendation"""
    mentor_id: str
    score: float = Field(..., ge=0, le=100, description="Overall compatibility score")
    factors: MatchFactors
    explanation: str = Field(..., description="Human-readable explanation")


class MatchingResponse(BaseModel):
    """Response model for mentor recommendations"""
    success: bool = True
    recommendations: List[MatchRecommendation]
    meta: Dict[str, any]


class LoadMentorsRequest(BaseModel):
    """Request to load/update mentor data"""
    mentors: List[Dict[str, any]]


class FeedbackRequest(BaseModel):
    """Implicit feedback for improving recommendations"""
    mentee_id: str
    mentor_id: str
    action: str = Field(..., description="viewed, booked, completed, dismissed")
    rating: Optional[int] = Field(None, ge=1, le=5)


# Endpoints
@router.post("/recommend", response_model=MatchingResponse)
async def recommend_mentors(
    request: MatchingRequest,
    matcher: MentorMatcher = Depends(get_matcher)
):
    """
    Get AI-powered mentor recommendations

    This endpoint uses semantic similarity combined with business rules
    to find the best mentor matches for a mentee.
    """
    try:
        logger.info("recommend_request_received", mentee_id=request.mentee_id)

        # Create mentee profile
        mentee = MenteeProfile(
            id=request.mentee_id,
            goals=request.goals,
            skills_to_learn=request.skills_to_learn,
            industries=request.industries,
            experience_level=request.experience_level,
            learning_style=request.learning_style,
            communication_preference=request.communication_preference,
            budget_min=request.budget_min,
            budget_max=request.budget_max,
            availability=request.availability,
            preferred_languages=request.preferred_languages
        )

        # Get recommendations
        results = await matcher.recommend_mentors(mentee, top_k=request.limit)

        # Convert to response format
        recommendations = [
            MatchRecommendation(
                mentor_id=r.mentor_id,
                score=r.score,
                factors=MatchFactors(**r.factors),
                explanation=r.explanation
            )
            for r in results
        ]

        return MatchingResponse(
            success=True,
            recommendations=recommendations,
            meta={
                "mentee_id": request.mentee_id,
                "total_results": len(recommendations),
                "matcher_stats": matcher.get_stats()
            }
        )

    except Exception as e:
        logger.error("recommend_failed", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate recommendations: {str(e)}"
        )


@router.post("/load-mentors", status_code=status.HTTP_201_CREATED)
async def load_mentors(
    request: LoadMentorsRequest,
    matcher: MentorMatcher = Depends(get_matcher)
):
    """
    Load or update mentor data in the matching system

    This endpoint should be called periodically to sync mentor data
    from the main database.
    """
    try:
        logger.info("load_mentors_request", count=len(request.mentors))

        mentors = []
        for m_data in request.mentors:
            mentor = MentorProfile(
                id=m_data['id'],
                expertise=m_data.get('expertise', []),
                industries=m_data.get('industries', []),
                years_experience=m_data.get('years_experience', 0),
                hourly_rate=m_data.get('hourly_rate', 0),
                availability=m_data.get('availability', {}),
                languages=m_data.get('languages', ['en']),
                communication_style=m_data.get('communication_style', 'casual'),
                rating=m_data.get('rating', 0),
                total_sessions=m_data.get('total_sessions', 0),
                success_rate=m_data.get('success_rate', 0.8),
                response_time_hours=m_data.get('response_time_hours', 24)
            )
            mentors.append(mentor)

        matcher.load_mentors(mentors)

        return {
            "success": True,
            "message": f"Loaded {len(mentors)} mentors",
            "stats": matcher.get_stats()
        }

    except Exception as e:
        logger.error("load_mentors_failed", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load mentors: {str(e)}"
        )


@router.post("/feedback", status_code=status.HTTP_204_NO_CONTENT)
async def record_feedback(request: FeedbackRequest):
    """
    Record implicit feedback to improve matching algorithm

    This feedback is used to retrain the matching model and improve
    recommendation quality over time.
    """
    try:
        logger.info(
            "feedback_received",
            mentee_id=request.mentee_id,
            mentor_id=request.mentor_id,
            action=request.action,
            rating=request.rating
        )

        # TODO: Store feedback in database
        # TODO: Use for model retraining

        return None

    except Exception as e:
        logger.error("feedback_failed", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record feedback"
        )


@router.get("/stats")
async def get_matching_stats(matcher: MentorMatcher = Depends(get_matcher)):
    """Get matching system statistics"""
    return {
        "success": True,
        "stats": matcher.get_stats()
    }
