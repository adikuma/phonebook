from typing import Any, Type
import asyncio
from ..schemas import NewsDigest
from .utils import clean_schema
from .clients import genai_client
from .formatting import format_results, format_content
from ..config import config


# analyzes raw content into a typed Pydantic schema via Gemini
async def analyze_content(content: Any, target: str, name: str, schema: Type) -> Any:
    focus = (
        "company overview, products/services, recent news, key executives, market position, sales opportunities"
        if target == "company"
        else "background, current role, work history, interests and posts, pain points, engagement opportunities"
    )
    prompt = f"Analyze the information about {name} and return JSON matching the schema. Fill as much as possible; use sensible defaults if unknown.\nFocus: {focus}\nSchema:\n{schema.model_json_schema()}\n\nContent:\n{format_content(content)}"
    resp = await asyncio.to_thread(
        genai_client.models.generate_content,
        model=config.gemini_model,
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_schema": clean_schema(schema.model_json_schema()),
        },
    )
    return schema.model_validate_json(resp.text)


# turns a set of articles into a compact NewsDigest
# three modes: briefing, fun_fact, single_source
async def summarize_news(topic: str, mode: str, results: list) -> NewsDigest:
    # modes
    modes = {
        "briefing": "Return a concise daily briefing: 4–6 sentences + compact bullets.",
        "fun_fact": "Return 1–3 quirky facts with short context.",
        "single_source": "Summarize from a single source if clearly present; otherwise a briefing.",
    }
    # prompt
    prompt = f"You are a precise news analyst.\nTopic: {topic}\nMode: {mode} -> {modes.get(mode, 'briefing')}\nRules: facts, dates, numbers; <=2 sentences per article; 3–5 key points; max 8 items; include citations.\n\nWeb results:\n{format_results(results)}"
    # generate the content (structured output)
    # new digest needs: topic, mode, generated_at, overall summary, top_takeaways, articles and sentiment
    resp = await asyncio.to_thread(
        genai_client.models.generate_content,
        model=config.gemini_model,
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_schema": clean_schema(NewsDigest.model_json_schema()),
        },
    )
    # validate the response
    digest: NewsDigest = NewsDigest.model_validate_json(resp.text)
    digest.topic = topic
    digest.mode = mode
    return digest
