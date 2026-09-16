"""
RAG service — Retrieval-Augmented Generation for the recruiter assistant.

This version uses structured MongoDB data (passed from Express) as context,
NOT vector search. The retrieval happens in Express (authorization-scoped
MongoDB queries), and this service handles context formatting + LLM generation.
"""

import logging

from services.llm_service import llm_service

logger = logging.getLogger(__name__)


def _format_candidate_context(candidate_data: list[dict]) -> str:
    """Format candidate data as readable text for the LLM context."""
    if not candidate_data:
        return "No candidate data available."

    context_parts = []
    for c in candidate_data:
        parts = [f"Candidate: {c.get('name', 'Unknown')}"]

        skills = c.get("skills", [])
        if skills:
            parts.append(f"  Skills: {', '.join(skills)}")

        experience = c.get("experience", [])
        if experience:
            if isinstance(experience, list) and experience:
                if isinstance(experience[0], dict):
                    exp_strs = [
                        f"{e.get('role', '?')} at {e.get('company', '?')} ({e.get('duration', '?')})"
                        for e in experience
                    ]
                    parts.append(f"  Experience: {'; '.join(exp_strs)}")
                else:
                    parts.append(f"  Experience: {'; '.join(str(e) for e in experience)}")

        match_scores = c.get("matchScores", [])
        if match_scores:
            score_strs = [
                f"{m.get('job', '?')}: {m.get('score', '?')}%"
                for m in match_scores
            ]
            parts.append(f"  Match Scores: {'; '.join(score_strs)}")

        interview_score = c.get("interviewScore")
        if interview_score is not None:
            parts.append(f"  Interview Score: {interview_score}%")

        education = c.get("education", [])
        if education:
            parts.append(f"  Education: {'; '.join(education)}")

        context_parts.append("\n".join(parts))

    return "\n\n".join(context_parts)


def _format_job_context(job_data: list[dict]) -> str:
    """Format job data as readable text for the LLM context."""
    if not job_data:
        return "No job data available."

    parts = []
    for j in job_data:
        reqs = j.get("requirements", [])
        req_str = f", Requirements: {', '.join(reqs)}" if reqs else ""
        parts.append(
            f"Job: {j.get('title', '?')} at {j.get('company', '?')} "
            f"(Location: {j.get('location', '?')}, Type: {j.get('jobType', '?')}{req_str})"
        )
    return "\n".join(parts)


async def assistant_query(
    question: str,
    candidate_data: list[dict],
    job_data: list[dict],
    conversation_history: list[dict] | None = None,
) -> dict:
    """
    Answer a recruiter's question grounded in their candidate/job data.

    Args:
        question: The recruiter's question.
        candidate_data: List of candidate dicts with name, skills, experience, etc.
        job_data: List of job dicts with title, requirements, etc.
        conversation_history: Previous messages for multi-turn context.

    Returns:
        dict with answer and sourcesUsed (candidate names referenced).
    """
    # Build context
    candidate_context = _format_candidate_context(candidate_data)
    job_context = _format_job_context(job_data)

    system_prompt = """You are an HR recruitment assistant helping a recruiter 
analyze their candidates. Follow these rules strictly:

1. Answer ONLY based on the candidate data and job data provided below.
2. If information is not in the data, say "I don't have enough data to answer that."
3. Always mention which candidate(s) you're referring to by name.
4. Never invent skills, scores, or experience that aren't in the data.
5. Be concise, helpful, and professional.
6. When comparing candidates, use specific data points."""

    # Build conversation context
    history_text = ""
    if conversation_history:
        recent = conversation_history[-10:]  # Last 10 messages for context window
        for msg in recent:
            role = "Recruiter" if msg.get("role") == "user" else "Assistant"
            history_text += f"{role}: {msg.get('content', '')}\n"

    user_prompt = f"""Candidate Data:
{candidate_context}

Job Data:
{job_context}

{f"Previous Conversation:{chr(10)}{history_text}" if history_text else ""}

Recruiter's Question: {question}"""

    try:
        answer = await llm_service.generate(user_prompt, system_prompt)
    except Exception as e:
        logger.error("RAG query failed: %s", e)
        answer = "I'm sorry, I encountered an error processing your question. Please try again."

    # Extract referenced candidate names from the answer
    candidate_names = [c.get("name", "") for c in candidate_data if c.get("name")]
    sources_used = [name for name in candidate_names if name.lower() in answer.lower()]

    return {
        "answer": answer,
        "sourcesUsed": sources_used,
    }
