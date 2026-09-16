"""
Swappable LLM service layer.

Currently wraps Google Gemini via the `google-genai` SDK.
To switch providers (e.g. OpenAI), change ONLY this file.
All other services call llm_service.generate() — none know about Gemini.
"""

import os
import json
import re
import logging

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class LLMService:
    """Thin wrapper around the LLM provider."""

    def __init__(self):
        from google import genai

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY not set. Add it to ai-service/.env"
            )

        self.client = genai.Client(api_key=api_key)
        self.model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        logger.info("LLMService initialized with model=%s", self.model)

    async def generate(self, prompt: str, system_prompt: str | None = None) -> str:
        """
        Send a prompt to the LLM and return the text response.

        Args:
            prompt: The user/main prompt.
            system_prompt: Optional system-level instruction.

        Returns:
            The model's text response.
        """
        try:
            contents = []
            if system_prompt:
                contents.append({"role": "user", "parts": [{"text": system_prompt}]})
                contents.append({"role": "model", "parts": [{"text": "Understood. I will follow these instructions."}]})
            contents.append({"role": "user", "parts": [{"text": prompt}]})

            response = self.client.models.generate_content(
                model=self.model,
                contents=contents,
            )
            return response.text or ""
        except Exception as e:
            logger.error("LLM generate error: %s", e)
            raise

    async def generate_json(self, prompt: str, system_prompt: str | None = None) -> dict:
        """
        Send a prompt and parse the response as JSON.

        The LLM is instructed to return ONLY valid JSON.
        We extract JSON from the response even if it's wrapped in markdown fences.

        Args:
            prompt: The user/main prompt (should request JSON output).
            system_prompt: Optional system-level instruction.

        Returns:
            Parsed dict/list from the JSON response.

        Raises:
            ValueError: If the response cannot be parsed as JSON after retry.
        """
        full_prompt = prompt + "\n\nIMPORTANT: Return ONLY valid JSON. No markdown fences, no explanation."

        raw = await self.generate(full_prompt, system_prompt)

        # Try direct parse first
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            pass

        # Extract JSON from markdown code fences
        json_match = re.search(r"```(?:json)?\s*\n?([\s\S]*?)\n?```", raw)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except json.JSONDecodeError:
                pass

        # Try to find JSON object/array pattern
        for pattern in [r"(\{[\s\S]*\})", r"(\[[\s\S]*\])"]:
            match = re.search(pattern, raw)
            if match:
                try:
                    return json.loads(match.group(1))
                except json.JSONDecodeError:
                    continue

        # Last resort: retry once
        logger.warning("First JSON parse failed, retrying...")
        raw_retry = await self.generate(
            full_prompt + "\n\nYour previous response was not valid JSON. Please return ONLY the JSON object/array.",
            system_prompt,
        )
        try:
            return json.loads(raw_retry)
        except json.JSONDecodeError:
            # Try extraction again
            json_match = re.search(r"```(?:json)?\s*\n?([\s\S]*?)\n?```", raw_retry)
            if json_match:
                try:
                    return json.loads(json_match.group(1))
                except json.JSONDecodeError:
                    pass
            for pattern in [r"(\{[\s\S]*\})", r"(\[[\s\S]*\])"]:
                match = re.search(pattern, raw_retry)
                if match:
                    try:
                        return json.loads(match.group(1))
                    except json.JSONDecodeError:
                        continue

        raise ValueError(
            f"Could not parse LLM response as JSON after retry. Raw: {raw_retry[:500]}"
        )


# Singleton instance — import and use directly
llm_service = LLMService()
