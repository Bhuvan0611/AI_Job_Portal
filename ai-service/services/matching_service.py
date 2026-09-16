"""
Matching service — Embedding-based semantic matching + skill overlap scoring.

Uses SentenceTransformer ('all-MiniLM-L6-v2') for 384-dim embeddings
and cosine similarity, same model as the AI-HR-Platform reference.
"""

import logging
import numpy as np
from sentence_transformers import SentenceTransformer

from services.llm_service import llm_service

logger = logging.getLogger(__name__)

# Load model once at module level — stays in memory for all requests.
# First load downloads ~80MB model, subsequent loads are instant.
logger.info("Loading SentenceTransformer model...")
_model = SentenceTransformer("all-MiniLM-L6-v2")
logger.info("SentenceTransformer model loaded.")


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Compute cosine similarity between two vectors."""
    dot = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(dot / (norm_a * norm_b))


async def compute_match(
    resume_text: str,
    resume_skills: list[str],
    job_title: str,
    job_description: str,
    job_requirements: list[str],
) -> dict:
    """
    Compute a composite match score between a resume and a job.

    Pipeline:
      1. Generate embeddings for resume text and job text
      2. Cosine similarity → semantic_score (0-100)
      3. Set intersection of skills vs requirements → skill_score (0-100)
      4. Composite: (semantic * 0.6) + (skill * 0.4)
      5. LLM explanation of the match

    Args:
        resume_text: Cleaned resume text.
        resume_skills: List of skills from resume analysis.
        job_title: Title of the job.
        job_description: Job description text.
        job_requirements: List of job requirements/skills.

    Returns:
        dict with matchScore, semanticScore, skillScore, matchedSkills,
        missingSkills, explanation, resumeEmbedding, jobEmbedding
    """
    # 1. Build text representations
    resume_repr = resume_text
    job_repr = f"{job_title}. {job_description}. Requirements: {', '.join(job_requirements)}"

    # 2. Generate embeddings (384-dimensional vectors)
    resume_embedding = _model.encode(resume_repr)
    job_embedding = _model.encode(job_repr)

    # 3. Cosine similarity → percentage
    semantic_score = _cosine_similarity(resume_embedding, job_embedding) * 100
    semantic_score = max(0, min(100, semantic_score))  # clamp to 0-100

    # 4. Skill overlap
    resume_skills_lower = {s.lower().strip() for s in resume_skills if s}
    job_req_lower = {r.lower().strip() for r in job_requirements if r}

    matched_skills = sorted(resume_skills_lower & job_req_lower)
    missing_skills = sorted(job_req_lower - resume_skills_lower)

    if job_req_lower:
        skill_score = (len(matched_skills) / len(job_req_lower)) * 100
    else:
        skill_score = 0.0

    # 5. Composite score
    match_score = (semantic_score * 0.6) + (skill_score * 0.4)
    match_score = round(match_score, 1)
    semantic_score = round(semantic_score, 1)
    skill_score = round(skill_score, 1)

    # 6. LLM explanation
    try:
        explanation = await llm_service.generate(
            f"""Given a candidate-job match analysis:
- Overall match score: {match_score}%
- Matched skills: {', '.join(matched_skills) if matched_skills else 'None'}
- Missing skills: {', '.join(missing_skills) if missing_skills else 'None'}
- Job title: {job_title}

Write a concise 2-3 sentence explanation of this candidate's fit for the role.
Be specific about what makes them a good or poor fit.""",
            system_prompt="You are a recruitment analyst. Be concise and factual.",
        )
    except Exception as e:
        logger.error("LLM explanation failed: %s", e)
        explanation = f"Match score: {match_score}%. Matched {len(matched_skills)} of {len(job_req_lower)} required skills."

    return {
        "matchScore": match_score,
        "semanticScore": semantic_score,
        "skillScore": skill_score,
        "matchedSkills": matched_skills,
        "missingSkills": missing_skills,
        "explanation": explanation,
        "resumeEmbedding": resume_embedding.tolist(),
        "jobEmbedding": job_embedding.tolist(),
    }
