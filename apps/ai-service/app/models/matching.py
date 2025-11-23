"""
AI-Powered Mentor Matching Models

Uses sentence transformers for semantic similarity and FAISS for efficient vector search.
"""

import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Optional, Tuple
import structlog
from dataclasses import dataclass
from datetime import datetime

from app.core.config import settings

logger = structlog.get_logger()


@dataclass
class MenteeProfile:
    """Mentee profile for matching"""
    id: str
    goals: List[str]
    skills_to_learn: List[str]
    industries: List[str]
    experience_level: str
    learning_style: str
    communication_preference: str
    budget_min: float
    budget_max: float
    availability: Dict[str, List[str]]  # {day: [time_slots]}
    preferred_languages: List[str]


@dataclass
class MentorProfile:
    """Mentor profile for matching"""
    id: str
    expertise: List[str]
    industries: List[str]
    years_experience: int
    hourly_rate: float
    availability: Dict[str, List[str]]
    languages: List[str]
    communication_style: str
    rating: float
    total_sessions: int
    success_rate: float
    response_time_hours: float
    embedding: Optional[np.ndarray] = None


@dataclass
class MatchResult:
    """Result of mentor matching"""
    mentor_id: str
    score: float  # 0-100
    factors: Dict[str, float]
    explanation: str


class MentorMatcher:
    """
    AI-powered mentor-mentee matching system

    Uses semantic similarity combined with business rules for optimal matches.
    """

    def __init__(self):
        logger.info("initializing_mentor_matcher")

        # Load sentence transformer model
        self.model = SentenceTransformer(settings.SENTENCE_TRANSFORMER_MODEL)
        logger.info("loaded_sentence_transformer", model=settings.SENTENCE_TRANSFORMER_MODEL)

        # Initialize FAISS index
        self.dimension = settings.EMBEDDING_DIMENSION
        if settings.FAISS_INDEX_TYPE == "Flat":
            self.index = faiss.IndexFlatL2(self.dimension)
        elif settings.FAISS_INDEX_TYPE == "IVF":
            quantizer = faiss.IndexFlatL2(self.dimension)
            self.index = faiss.IndexIVFFlat(quantizer, self.dimension, 100)
        else:  # HNSW
            self.index = faiss.IndexHNSWFlat(self.dimension, 32)

        logger.info("initialized_faiss_index", type=settings.FAISS_INDEX_TYPE)

        # Mentor cache
        self.mentors: List[MentorProfile] = []
        self.mentor_id_to_index: Dict[str, int] = {}

    def generate_embedding(self, profile: Dict[str, any]) -> np.ndarray:
        """
        Generate embedding for a profile

        Combines multiple text fields into semantic representation.
        """
        # Combine profile fields into text
        text_parts = []

        if isinstance(profile, dict):
            # Mentee profile
            if 'goals' in profile:
                text_parts.extend(profile.get('goals', []))
            if 'skills_to_learn' in profile:
                text_parts.extend(profile.get('skills_to_learn', []))
            if 'industries' in profile:
                text_parts.extend(profile.get('industries', []))
            if 'experience_level' in profile:
                text_parts.append(f"Experience: {profile['experience_level']}")

        text = " ".join(text_parts)

        # Generate embedding
        embedding = self.model.encode(text, convert_to_numpy=True)
        return embedding.astype('float32')

    def add_mentor(self, mentor: MentorProfile):
        """Add mentor to the matching system"""
        if mentor.embedding is None:
            # Generate embedding from mentor profile
            mentor.embedding = self.generate_embedding({
                'expertise': mentor.expertise,
                'industries': mentor.industries,
                'years_experience': mentor.years_experience
            })

        # Add to FAISS index
        self.index.add(mentor.embedding.reshape(1, -1))

        # Cache mentor
        index = len(self.mentors)
        self.mentors.append(mentor)
        self.mentor_id_to_index[mentor.id] = index

        logger.debug("added_mentor", mentor_id=mentor.id, index=index)

    def load_mentors(self, mentors: List[MentorProfile]):
        """Batch load mentors"""
        logger.info("loading_mentors", count=len(mentors))

        for mentor in mentors:
            self.add_mentor(mentor)

        logger.info("mentors_loaded", total=len(self.mentors))

    def calculate_availability_overlap(
        self,
        mentee_availability: Dict[str, List[str]],
        mentor_availability: Dict[str, List[str]]
    ) -> float:
        """
        Calculate availability overlap score (0-1)

        Checks how many time slots overlap between mentee and mentor.
        """
        if not mentee_availability or not mentor_availability:
            return 0.5  # Neutral if no availability data

        total_overlap = 0
        total_slots = 0

        for day in mentee_availability:
            if day not in mentor_availability:
                continue

            mentee_slots = set(mentee_availability[day])
            mentor_slots = set(mentor_availability[day])

            overlap = len(mentee_slots & mentor_slots)
            total = len(mentee_slots)

            if total > 0:
                total_overlap += overlap
                total_slots += total

        if total_slots == 0:
            return 0.5

        return total_overlap / total_slots

    def calculate_expertise_match(
        self,
        mentee_skills: List[str],
        mentor_expertise: List[str]
    ) -> float:
        """Calculate expertise match score (0-1)"""
        if not mentee_skills or not mentor_expertise:
            return 0.5

        mentee_set = set(s.lower() for s in mentee_skills)
        mentor_set = set(e.lower() for e in mentor_expertise)

        intersection = len(mentee_set & mentor_set)
        union = len(mentee_set | mentor_set)

        if union == 0:
            return 0.5

        # Jaccard similarity
        return intersection / union

    def calculate_communication_match(
        self,
        mentee_pref: str,
        mentor_style: str
    ) -> float:
        """Calculate communication style compatibility (0-1)"""
        # Simple mapping - in production, use ML model
        compatibility_matrix = {
            ('formal', 'formal'): 1.0,
            ('formal', 'casual'): 0.6,
            ('formal', 'structured'): 0.8,
            ('casual', 'formal'): 0.6,
            ('casual', 'casual'): 1.0,
            ('casual', 'structured'): 0.7,
            ('structured', 'formal'): 0.8,
            ('structured', 'casual'): 0.7,
            ('structured', 'structured'): 1.0,
        }

        key = (mentee_pref.lower(), mentor_style.lower())
        return compatibility_matrix.get(key, 0.7)

    def calculate_composite_score(
        self,
        semantic_similarity: float,
        availability_match: float,
        expertise_match: float,
        communication_match: float,
        success_rate: float
    ) -> float:
        """
        Calculate weighted composite score (0-100)

        Uses configurable weights for different factors.
        """
        score = (
            semantic_similarity * settings.WEIGHT_SEMANTIC +
            availability_match * settings.WEIGHT_AVAILABILITY +
            expertise_match * settings.WEIGHT_EXPERTISE +
            communication_match * settings.WEIGHT_COMMUNICATION +
            success_rate * settings.WEIGHT_SUCCESS
        ) * 100

        return min(100.0, max(0.0, score))

    def explain_match(
        self,
        mentee: MenteeProfile,
        mentor: MentorProfile,
        factors: Dict[str, float]
    ) -> str:
        """Generate human-readable explanation for the match"""
        reasons = []

        # Semantic match
        if factors['semantic'] > 0.8:
            reasons.append("Strong alignment with your learning goals")
        elif factors['semantic'] > 0.6:
            reasons.append("Good fit for your objectives")

        # Expertise match
        if factors['expertise'] > 0.7:
            matching_skills = set(mentee.skills_to_learn) & set(mentor.expertise)
            if matching_skills:
                reasons.append(f"Expert in {', '.join(list(matching_skills)[:2])}")

        # Availability
        if factors['availability'] > 0.7:
            reasons.append("Excellent schedule compatibility")

        # Experience
        if mentor.years_experience >= 10:
            reasons.append(f"{mentor.years_experience}+ years of experience")

        # Success rate
        if mentor.success_rate > 0.9:
            reasons.append(f"{int(mentor.success_rate * 100)}% success rate")

        # Rating
        if mentor.rating >= 4.5:
            reasons.append(f"{mentor.rating}/5.0 rating from {mentor.total_sessions} sessions")

        return " • ".join(reasons) if reasons else "Recommended based on overall compatibility"

    async def recommend_mentors(
        self,
        mentee: MenteeProfile,
        top_k: int = None
    ) -> List[MatchResult]:
        """
        Get top mentor recommendations for a mentee

        Args:
            mentee: Mentee profile
            top_k: Number of recommendations to return

        Returns:
            List of MatchResult sorted by score
        """
        if top_k is None:
            top_k = settings.MATCHING_FINAL_K

        logger.info("generating_recommendations", mentee_id=mentee.id, top_k=top_k)

        # Generate mentee embedding
        mentee_embedding = self.generate_embedding({
            'goals': mentee.goals,
            'skills_to_learn': mentee.skills_to_learn,
            'industries': mentee.industries,
            'experience_level': mentee.experience_level
        })

        # Search FAISS index
        k = min(settings.MATCHING_TOP_K, len(self.mentors))
        distances, indices = self.index.search(mentee_embedding.reshape(1, -1), k)

        logger.debug("faiss_search_complete", candidates=k)

        # Score and filter candidates
        candidates = []

        for dist, idx in zip(distances[0], indices[0]):
            if idx < 0 or idx >= len(self.mentors):
                continue

            mentor = self.mentors[idx]

            # Apply business rules
            # Price filter
            if mentor.hourly_rate > mentee.budget_max or mentor.hourly_rate < mentee.budget_min:
                continue

            # Calculate individual factors
            semantic_similarity = 1 - (dist / 2.0)  # Normalize L2 distance
            availability_match = self.calculate_availability_overlap(
                mentee.availability,
                mentor.availability
            )
            expertise_match = self.calculate_expertise_match(
                mentee.skills_to_learn,
                mentor.expertise
            )
            communication_match = self.calculate_communication_match(
                mentee.communication_preference,
                mentor.communication_style
            )

            # Calculate composite score
            score = self.calculate_composite_score(
                semantic_similarity,
                availability_match,
                expertise_match,
                communication_match,
                mentor.success_rate
            )

            # Filter by minimum score
            if score < settings.MATCHING_MIN_SCORE * 100:
                continue

            factors = {
                'semantic': round(semantic_similarity, 3),
                'availability': round(availability_match, 3),
                'expertise': round(expertise_match, 3),
                'communication': round(communication_match, 3),
                'success': round(mentor.success_rate, 3)
            }

            explanation = self.explain_match(mentee, mentor, factors)

            candidates.append(MatchResult(
                mentor_id=mentor.id,
                score=round(score, 2),
                factors=factors,
                explanation=explanation
            ))

        # Sort by score and return top K
        candidates.sort(key=lambda x: x.score, reverse=True)
        results = candidates[:top_k]

        logger.info(
            "recommendations_generated",
            mentee_id=mentee.id,
            candidates=len(candidates),
            returned=len(results)
        )

        return results

    def get_stats(self) -> Dict[str, any]:
        """Get matcher statistics"""
        return {
            'total_mentors': len(self.mentors),
            'index_size': self.index.ntotal,
            'embedding_dimension': self.dimension,
            'model': settings.SENTENCE_TRANSFORMER_MODEL
        }


# Global matcher instance (singleton)
_matcher: Optional[MentorMatcher] = None


def get_matcher() -> MentorMatcher:
    """Get or create global matcher instance"""
    global _matcher
    if _matcher is None:
        _matcher = MentorMatcher()
    return _matcher
