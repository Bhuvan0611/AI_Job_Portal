"""
Resume service — PDF text extraction + AI-powered structured analysis.

Uses pdfplumber for PDF→text (same pattern as AI-HR-Platform/chatbot.py)
and Gemini for structured JSON extraction from resume text.
"""

import base64
import io
import logging

import pdfplumber

from services.llm_service import llm_service
from utils.text_processing import clean_text

logger = logging.getLogger(__name__)


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Extract text from PDF bytes using pdfplumber.

    Args:
        pdf_bytes: Raw PDF file bytes.

    Returns:
        Extracted text from all pages, concatenated.
    """
    text = ""
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
    except Exception as e:
        logger.error("Error reading PDF: %s", e)
        raise ValueError(f"Could not extract text from PDF: {e}")

    if not text.strip():
        raise ValueError("PDF appears to be empty or contains only images (no extractable text).")

    return text.strip()


async def extract_and_analyze(pdf_base64: str, filename: str = "resume.pdf") -> dict:
    """
    Full pipeline: decode base64 PDF → extract text → clean → LLM analysis.

    Args:
        pdf_base64: Base64-encoded PDF bytes.
        filename: Original filename (for logging).

    Returns:
        dict with keys: skills, education, experience, projects,
        certifications, suggestedRoles, missingSkills, summary, rawText
    """
    logger.info("Processing resume: %s", filename)

    # 1. Decode base64 → PDF bytes
    try:
        pdf_bytes = base64.b64decode(pdf_base64)
    except Exception as e:
        raise ValueError(f"Invalid base64 PDF data: {e}")

    # 2. Extract text from PDF
    raw_text = extract_text_from_pdf(pdf_bytes)
    logger.info("Extracted %d characters from %s", len(raw_text), filename)

    # 3. Clean text for LLM processing
    cleaned_text = clean_text(raw_text)

    # 4. Send to Gemini for structured analysis
    system_prompt = """You are an expert resume analyzer. Your job is to extract 
structured data from resume text. Be thorough but only include information 
that is actually present in the resume. Do not invent or assume data."""

    user_prompt = f"""Analyze this resume and extract structured data.
Return ONLY valid JSON with this exact schema:
{{
  "skills": ["skill1", "skill2", ...],
  "education": ["degree1 - institution - year", ...],
  "experience": [
    {{"role": "Job Title", "company": "Company Name", "duration": "Start - End"}},
    ...
  ],
  "projects": [
    {{"name": "Project Name", "description": "Brief description"}},
    ...
  ],
  "certifications": ["cert1", ...],
  "suggestedRoles": ["role1", "role2", ...],
  "missingSkills": ["skill1", "skill2", ...],
  "summary": "A 2-3 sentence professional summary of this candidate"
}}

Rules:
- "skills" should include technical skills, tools, frameworks, and languages found in the resume
- "suggestedRoles" should be 3-5 job roles this candidate is best suited for
- "missingSkills" should be skills commonly expected for their suggested roles but not found in the resume
- If a section has no data, use an empty array []
- Keep descriptions concise

Resume Text:
{cleaned_text}"""

    try:
        analysis = await llm_service.generate_json(user_prompt, system_prompt)
    except ValueError as e:
        logger.error("Failed to get structured analysis from LLM: %s", e)
        # Return a minimal analysis if LLM fails
        analysis = {
            "skills": [],
            "education": [],
            "experience": [],
            "projects": [],
            "certifications": [],
            "suggestedRoles": [],
            "missingSkills": [],
            "summary": "Analysis could not be completed. Please try again.",
        }

    # 5. Ensure all expected keys exist
    default_keys = {
        "skills": [], "education": [], "experience": [], "projects": [],
        "certifications": [], "suggestedRoles": [], "missingSkills": [],
        "summary": "",
    }
    for key, default in default_keys.items():
        if key not in analysis:
            analysis[key] = default

    # 6. Add raw text to the response
    analysis["rawText"] = raw_text

    return analysis
