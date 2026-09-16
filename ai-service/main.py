"""
AI Service — FastAPI application for the Job Portal AI features.

Endpoints:
  GET  /health              → heartbeat
  POST /extract-and-analyze → PDF resume analysis
  POST /compute-match       → job-candidate matching
  POST /assistant-query     → RAG recruiter assistant
  POST /generate-interview  → interview question generation
  POST /evaluate-answers    → semantic answer evaluation
  POST /generate-report     → explainable hiring report
"""

import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Job Portal AI Service",
    description="Python AI microservice for resume analysis, job matching, interviews, and RAG assistant.",
    version="1.0.0",
)

# CORS — allow Express backend and Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5011",   # Express backend
        "http://localhost:5173",   # Vite dev server
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request/Response Models ───────────────────────────────────────

class HealthResponse(BaseModel):
    status: str


class ExtractAndAnalyzeRequest(BaseModel):
    pdf_base64: str
    filename: str = "resume.pdf"


class ComputeMatchRequest(BaseModel):
    resumeText: str
    resumeSkills: list[str]
    jobTitle: str
    jobDescription: str
    jobRequirements: list[str]


class AssistantQueryRequest(BaseModel):
    question: str
    candidateData: list[dict]
    jobData: list[dict]
    conversationHistory: list[dict] | None = None


class GenerateInterviewRequest(BaseModel):
    jobTitle: str
    requirements: list[str]
    candidateSkills: list[str]


class EvaluateAnswersRequest(BaseModel):
    questionsWithAnswers: list[dict]


class GenerateReportRequest(BaseModel):
    resumeAnalysis: dict | None = None
    match: dict | None = None
    interview: dict | None = None
    candidateName: str = "Candidate"
    jobTitle: str = "Position"


# ─── Endpoints ─────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Heartbeat endpoint — confirms the service is running."""
    return {"status": "ok"}


@app.post("/extract-and-analyze")
async def extract_and_analyze(req: ExtractAndAnalyzeRequest):
    """
    Receive base64-encoded PDF, extract text, and return structured analysis.
    """
    from services.resume_service import extract_and_analyze as _extract

    try:
        result = await _extract(req.pdf_base64, req.filename)
        return {"success": True, "analysis": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("extract-and-analyze error: %s", e)
        raise HTTPException(status_code=500, detail="Failed to analyze resume")


@app.post("/compute-match")
async def compute_match(req: ComputeMatchRequest):
    """
    Compute semantic + skill-based match score between resume and job.
    """
    from services.matching_service import compute_match as _match

    try:
        result = await _match(
            resume_text=req.resumeText,
            resume_skills=req.resumeSkills,
            job_title=req.jobTitle,
            job_description=req.jobDescription,
            job_requirements=req.jobRequirements,
        )
        return {"success": True, "match": result}
    except Exception as e:
        logger.error("compute-match error: %s", e)
        raise HTTPException(status_code=500, detail="Failed to compute match")


@app.post("/assistant-query")
async def assistant_query(req: AssistantQueryRequest):
    """
    Answer a recruiter's question using RAG over their candidate data.
    """
    from services.rag_service import assistant_query as _query

    try:
        result = await _query(
            question=req.question,
            candidate_data=req.candidateData,
            job_data=req.jobData,
            conversation_history=req.conversationHistory,
        )
        return {"success": True, **result}
    except Exception as e:
        logger.error("assistant-query error: %s", e)
        raise HTTPException(status_code=500, detail="Failed to process query")


@app.post("/generate-interview")
async def generate_interview(req: GenerateInterviewRequest):
    """
    Generate 5 technical interview questions for a candidate-job pair.
    """
    from services.interview_service import generate_questions

    try:
        questions = await generate_questions(
            job_title=req.jobTitle,
            requirements=req.requirements,
            candidate_skills=req.candidateSkills,
        )
        return {"success": True, "questions": questions}
    except Exception as e:
        logger.error("generate-interview error: %s", e)
        raise HTTPException(status_code=500, detail="Failed to generate interview questions")


@app.post("/evaluate-answers")
async def evaluate_answers(req: EvaluateAnswersRequest):
    """
    Evaluate candidate answers against golden answers using semantic similarity.
    """
    from services.interview_service import evaluate_answers as _evaluate

    try:
        result = await _evaluate(req.questionsWithAnswers)
        return {"success": True, "evaluation": result}
    except Exception as e:
        logger.error("evaluate-answers error: %s", e)
        raise HTTPException(status_code=500, detail="Failed to evaluate answers")


@app.post("/generate-report")
async def generate_report(req: GenerateReportRequest):
    """
    Generate an explainable hiring report with weighted scores.
    """
    from services.llm_service import llm_service

    try:
        # Compute weighted score
        skill_score = 0
        semantic_score = 0
        interview_score = 0
        has_interview = False

        if req.match:
            skill_score = req.match.get("skillScore", 0)
            semantic_score = req.match.get("semanticScore", 0)

        if req.interview and req.interview.get("overallScore") is not None:
            interview_score = req.interview.get("overallScore", 0)
            has_interview = True

        if has_interview:
            overall = (skill_score * 0.35) + (semantic_score * 0.30) + (interview_score * 0.35)
        else:
            # Reweight when no interview
            overall = (skill_score * 0.55) + (semantic_score * 0.45)

        overall = round(overall, 1)

        # Gather data for LLM
        data_summary = f"""
Candidate: {req.candidateName}
Job: {req.jobTitle}

Resume Analysis:
- Skills: {', '.join(req.resumeAnalysis.get('skills', [])) if req.resumeAnalysis else 'N/A'}
- Experience: {req.resumeAnalysis.get('experience', 'N/A') if req.resumeAnalysis else 'N/A'}
- Summary: {req.resumeAnalysis.get('summary', 'N/A') if req.resumeAnalysis else 'N/A'}

Match Scores:
- Skill Match: {skill_score}%
- Semantic Match: {semantic_score}%
- Matched Skills: {', '.join(req.match.get('matchedSkills', [])) if req.match else 'N/A'}
- Missing Skills: {', '.join(req.match.get('missingSkills', [])) if req.match else 'N/A'}

Interview Score: {interview_score}% {'(completed)' if has_interview else '(not taken)'}
Overall Weighted Score: {overall}%"""

        prompt = f"""Based on this candidate data, write a brief hiring assessment.

CLEARLY SEPARATE your response into exactly this JSON format:
{{
  "strengths": ["strength1", "strength2", ...],
  "gaps": ["gap1", "gap2", ...],
  "aiRecommendation": "Your 2-3 sentence recommendation, clearly labeled as AI suggestion"
}}

Rules:
- "strengths" should be 3-5 specific, verified strengths from the data
- "gaps" should be 2-4 specific gaps or concerns from the data
- "aiRecommendation" should clearly state this is an AI suggestion, not a decision
- Base EVERYTHING on the data provided, never invent facts

Data:
{data_summary}"""

        report_data = await llm_service.generate_json(prompt)

        return {
            "success": True,
            "report": {
                "overallScore": overall,
                "breakdown": {
                    "skillScore": skill_score,
                    "semanticScore": semantic_score,
                    "interviewScore": interview_score if has_interview else None,
                },
                "strengths": report_data.get("strengths", []),
                "gaps": report_data.get("gaps", []),
                "aiRecommendation": report_data.get("aiRecommendation", ""),
            },
        }
    except Exception as e:
        logger.error("generate-report error: %s", e)
        raise HTTPException(status_code=500, detail="Failed to generate report")


# ─── Run ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)

