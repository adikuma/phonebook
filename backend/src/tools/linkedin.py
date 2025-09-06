# backend/src/tools/linkedin.py
from typing import Dict, List, Any
import re
import asyncio
from ..config import config
from pydantic import BaseModel
from .utils import clean_schema
from .clients import genai_client, exa_client


# builds a structured LinkedIn profile from Exa page text + Gemini
async def extract_linkedin_data(linkedin_url: str) -> Dict[str, Any]:
    # 1) fetch page text via Exa
    try:
        resp = await asyncio.to_thread(
            exa_client.search_and_contents,
            linkedin_url,
            use_autoprompt=True,
            num_results=1,
            type="auto",
            text=True,
        )
        results = getattr(resp, "results", []) or []
        if not results:
            return {"error": "No LinkedIn content found via Exa"}
        r = results[0]
        page_text = getattr(r, "text", "") or ""
        canonical_url = getattr(r, "url", "") or getattr(r, "id", "") or linkedin_url
        title = getattr(r, "title", "") or ""
    except Exception as e:
        return {"error": f"Exa fetch failed: {e}"}

    # 2) structured output from the linkedin profile
    class LinkedinSchema(BaseModel):
        name: str
        company: str
        role: str
        location: str
        bio: str
        skills: List[str]
        previous_companies: List[str]
        conversation_starters: List[str]
        discussion_topics: List[str]

    # 3) gemini prompt
    prompt = (
        "Extract a concise LinkedIn profile from the following page content.\n"
        "Return JSON with EXACT keys:\n"
        "name, company, role, location, bio,\n"
        "skills (array of strings), previous_companies (array of strings),\n"
        "conversation_starters (array of short, personalized openers grounded in their work/posts),\n"
        "discussion_topics (array of specific subject areas relevant to them).\n"
        "If unknown: use empty string for scalars or [] for arrays. Avoid generic fluff. Do not invent facts.\n\n"
        f"Title: {title}\nURL: {canonical_url}\n\n"
        f"Content:\n{page_text}"
    )

    try:
        json_schema = clean_schema(LinkedinSchema.model_json_schema())
        llm_resp = await asyncio.to_thread(
            genai_client.models.generate_content,
            model=config.gemini_model,
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": json_schema,
            },
        )
        parsed: LinkedinSchema = LinkedinSchema.model_validate_json(llm_resp.text)
        out = parsed.model_dump()
    except Exception as e:
        return {"error": f"LLM extraction failed: {e}"}

    # 4) add extra metadata
    out["linkedin_url"] = canonical_url
    m = re.search(r"linkedin\.com/(?:in|pub)/([^/?#]+)", canonical_url)
    out["username"] = m.group(1) if m else ""
    return out
