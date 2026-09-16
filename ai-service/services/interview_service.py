"""
Interview service — AI question generation + semantic answer evaluation.

Uses Gemini for question generation and SentenceTransformer for
cosine-similarity-based answer grading (same model as matching_service).
"""

import logging
import numpy as np
from sentence_transformers import SentenceTransformer

from services.llm_service import llm_service
from utils.text_processing import clean_for_grading

logger = logging.getLogger(__name__)

# Reuse the same model instance from matching_service if already loaded,
# or load our own. SentenceTransformer caches internally.
_model = SentenceTransformer("all-MiniLM-L6-v2")


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Compute cosine similarity between two vectors."""
    dot = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(dot / (norm_a * norm_b))


async def generate_questions(
    job_title: str,
    requirements: list[str],
    candidate_skills: list[str],
) -> list[dict]:
    """
    Generate 5 technical interview questions tailored to the job and candidate.

    Args:
        job_title: The job title.
        requirements: Job requirements/skills.
        candidate_skills: Skills from the candidate's resume analysis.

    Returns:
        List of 5 dicts: { questionText, skill, goldenAnswer }
    """
    prompt = f"""Generate exactly 5 technical interview questions for a candidate 
applying for the position of "{job_title}".

Job requirements: {', '.join(requirements)}
Candidate's skills from resume: {', '.join(candidate_skills)}

For each question:
- Focus on skills that overlap between requirements and candidate skills
- Include at least 1 question on a skill the candidate claims but needs verification
- Make questions progressively harder (easy → medium → hard)
- Each question should test a DIFFERENT skill/topic

Return ONLY valid JSON as an array:
[
  {{
    "questionText": "The interview question",
    "skill": "The specific skill being tested",
    "goldenAnswer": "The ideal answer in 2-3 sentences"
  }}
]"""

    system_prompt = """You are a senior technical interviewer. Generate clear, 
fair questions that test practical understanding, not trick questions. 
Golden answers should capture the key concepts a good candidate would mention."""

    try:
        questions = await llm_service.generate_json(prompt, system_prompt)
        # Validate structure
        if isinstance(questions, list):
            validated = []
            for q in questions[:5]:  # Cap at 5
                validated.append({
                    "questionText": q.get("questionText", ""),
                    "skill": q.get("skill", ""),
                    "goldenAnswer": q.get("goldenAnswer", ""),
                })
            return validated
        else:
            raise ValueError("Expected a JSON array of questions")
    except Exception as e:
        logger.error("Question generation failed: %s", e)
        raise


async def evaluate_answers(questions_with_answers: list[dict]) -> dict:
    """
    Evaluate candidate answers against golden answers using semantic similarity + LLM feedback.

    For each question:
      1. Clean both answers (preserve negation words)
      2. Generate embeddings
      3. Cosine similarity → score (0-100)
      4. LLM generates 1-sentence feedback

    Args:
        questions_with_answers: List of dicts with questionText, goldenAnswer, candidateAnswer.

    Returns:
        dict with scores[], feedbacks[], overallScore
    """
    scores = []
    feedbacks = []

    for item in questions_with_answers:
        question = item.get("questionText", "")
        golden = item.get("goldenAnswer", "")
        candidate = item.get("candidateAnswer", "")

        if not candidate or not candidate.strip():
            scores.append(0.0)
            feedbacks.append("No answer provided.")
            continue

        # 1. Clean for grading (preserves negation words)
        candidate_clean = clean_for_grading(candidate)
        golden_clean = clean_for_grading(golden)

        # 2. Generate embeddings
        candidate_emb = _model.encode(candidate_clean)
        golden_emb = _model.encode(golden_clean)

        # 3. Cosine similarity → score
        score = _cosine_similarity(candidate_emb, golden_emb) * 100
        score = round(max(0, min(100, score)), 1)
        scores.append(score)

        # 4. LLM feedback
        try:
            feedback = await llm_service.generate(
                f"""Question: "{question}"
Candidate's answer: "{candidate}"
Expected answer covers: "{golden}"
Similarity score: {score}%

Give exactly 1 sentence of constructive feedback for the candidate. 
Be specific about what they got right or what they missed.""",
                system_prompt="You are a fair technical interviewer giving brief feedback.",
            )
            feedbacks.append(feedback.strip())
        except Exception as e:
            logger.error("Feedback generation failed: %s", e)
            feedbacks.append(f"Score: {score}%. Unable to generate detailed feedback.")

    overall_score = round(sum(scores) / max(len(scores), 1), 1)

    return {
        "scores": scores,
        "feedbacks": feedbacks,
        "overallScore": overall_score,
    }
