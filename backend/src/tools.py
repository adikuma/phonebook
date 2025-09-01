from typing import List, Dict, Any, Type, Optional
from pydantic import BaseModel
import asyncio
from exa_py import Exa
from tavily import TavilyClient
import re
from .config import config
from .schemas import NewsDigest
from google import genai

client = genai.Client(api_key=config.gemini_api_key)

exa = Exa(api_key=config.exa_api_key)
tavily = TavilyClient(api_key=config.tavily_api_key)


def clean_schema(schema_dict: Dict[str, Any]) -> Dict[str, Any]:
    if isinstance(schema_dict, dict):
        schema_dict = {
            k: v
            for k, v in schema_dict.items()
            if k not in ["additionalProperties", "default"]
        }
        for key, value in schema_dict.items():
            schema_dict[key] = clean_schema(value)
    elif isinstance(schema_dict, list):
        return [clean_schema(item) for item in schema_dict]
    return schema_dict


async def search_web(query: str, max_results: int = 5) -> List[Dict[str, Any]]:
    results: List[Dict[str, Any]] = []

    exa_task = asyncio.create_task(_search_exa(query, max_results))
    tavily_task = asyncio.create_task(
        _search_tavily(query, max_results, auto_parameters=True)
    )

    exa_results, tavily_results = await asyncio.gather(exa_task, tavily_task)

    seen_urls = set()
    for result in exa_results + tavily_results:
        url = result.get("url")
        if url and url not in seen_urls:
            seen_urls.add(url)
            results.append(result)

    return results[: max_results * 2]


async def _search_exa(query: str, max_results: int) -> List[Dict[str, Any]]:
    try:
        response = await asyncio.to_thread(
            exa.search_and_contents,
            query,
            use_autoprompt=True,
            num_results=max_results,
            type="auto",
        )

        results = []
        for r in getattr(response, "results", []):
            results.append(
                {
                    "url": getattr(r, "url", ""),
                    "title": getattr(r, "title", ""),
                    "content": getattr(r, "text", "")[:1000],
                }
            )
        return results
    except Exception as e:
        print(f"exa search error: {e}")
        return []


async def _search_tavily(
    query: str, max_results: int, auto_parameters: bool = False
) -> List[Dict[str, Any]]:
    try:
        response = await asyncio.to_thread(
            tavily.search,
            query,
            max_results=max_results,
            include_answer=False,
            auto_parameters=auto_parameters,
        )

        results = []
        for r in response.get("results", []):
            results.append(
                {
                    "url": r.get("url", ""),
                    "title": r.get("title", ""),
                    "content": r.get("content", "")[:1000],
                }
            )
        return results
    except Exception as e:
        print(f"tavily search error: {e}")
        return []


async def extract_linkedin_data(linkedin_url: str) -> Dict[str, Any]:
    username = _extract_linkedin_username(linkedin_url)
    if not username:
        return {"error": "Invalid LinkedIn URL"}

    search_queries = [
        f"site:linkedin.com/in/{username}",
        f'"{username}" linkedin profile',
        f'"{username}" posts articles linkedin',
    ]

    search_tasks = [search_web(q, max_results=3) for q in search_queries]
    all_results = await asyncio.gather(*search_tasks)
    flat_results = [r for sublist in all_results for r in sublist]

    results_str = _format_results(flat_results)

    class LinkedinSchema(BaseModel):
        name: str
        company: str
        role: str
        location: str
        bio: str
        posts_themes: str
        skills: str
        previous_companies: List[str]

    prompt = f"""
    Extract a LinkedIn profile summary from these search results.

    Return JSON with keys:
    name, company, role, location, bio, posts_themes, skills, previous_companies (array of strings).
    If unknown, use empty string or [].

    Search results:
    {results_str}
    """

    try:
        json_schema = clean_schema(LinkedinSchema.model_json_schema())

        resp = await asyncio.to_thread(
            client.models.generate_content,
            model=config.gemini_model,
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": json_schema,
            },
        )
        parsed: LinkedinSchema = LinkedinSchema.model_validate_json(resp.text)
    except Exception as e:
        print(f"genai extraction error: {e}")
        return {"error": "Failed to extract LinkedIn data"}

    result = parsed.model_dump()
    result["linkedin_url"] = linkedin_url
    result["username"] = username
    return result


def _extract_linkedin_username(url: str) -> str:
    patterns = [
        r"linkedin\.com/in/([^/?]+)",
        r"linkedin\.com/pub/([^/?]+)",
    ]

    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return ""


async def analyze_content(
    content: Any, target: str, name: str, schema: Type[BaseModel]
) -> BaseModel:
    if target == "company":
        preface = (
            "company overview, products/services, recent news, key executives, "
            "market position, sales opportunities"
        )
    else:
        preface = (
            "background, current role, work history, interests and posts, pain points, "
            "engagement opportunities"
        )

    schema_hint = schema.model_json_schema()

    prompt = f"""
    Analyze the provided information for {name} and produce JSON that conforms to
    the provided schema. Populate as many fields as possible. If a field is unknown,
    use a reasonable default (empty string, [], or null).

    Focus areas: {preface}

    JSON schema (for guidance):
    {schema_hint}

    Content to analyze:
    {_format_content(content)}
    """

    try:
        json_schema = clean_schema(schema.model_json_schema())

        resp = await asyncio.to_thread(
            client.models.generate_content,
            model=config.gemini_model,
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": json_schema,
            },
        )
        parsed: BaseModel = schema.model_validate_json(resp.text)
        return parsed
    except Exception as e:
        print(f"genai analyze error: {e}")
        raise ValueError("Failed to analyze content to schema")


def _format_results(results: List[Dict[str, Any]]) -> str:
    formatted = []
    for r in results[:10]:
        title = r.get("title", "")
        url = r.get("url", "")
        content = (r.get("content", "") or "")[:800]
        formatted.append(f"Title: {title}\nURL: {url}\nContent: {content}\n")
    return "\n---\n".join(formatted)


def _format_content(content: Any) -> str:
    if isinstance(content, list):
        return _format_results(content)
    elif isinstance(content, dict):
        if "linkedin" in content and "web" in content:
            return (
                f"LinkedIn Data:\n{content['linkedin']}\n\n"
                f"Web Results:\n{_format_results(content['web'])}"
            )
        try:
            import json as _json

            return _json.dumps(content, ensure_ascii=False)
        except Exception:
            return str(content)
    return str(content)


# news tools
async def news_search(
    topic: str,
    days: int = 7,
    source: Optional[str] = None,
    max_results: int = 8,
) -> List[Dict[str, Any]]:
    base = f"{topic} news past {days} days"
    queries = [base, f"latest updates {topic}", f"{topic} headlines"]

    if source:
        queries.append(f"site:{source} {topic} past {days} days")

    all_results: List[Dict[str, Any]] = []
    seen: set[str] = set()

    # sequential to respect rate limits
    per_q = max(3, max_results // max(1, len(queries)))
    for q in queries:
        try:
            rows = await search_web(q, max_results=per_q)
            for r in rows:
                u = r.get("url")
                if u and u not in seen:
                    seen.add(u)
                    all_results.append(r)
            await asyncio.sleep(0.25)
        except Exception as e:
            print(f"news_search error: {e}")

    return all_results[:max_results]


async def summarize_news(
    topic: str,
    mode: str,
    results: List[Dict[str, Any]],
) -> NewsDigest:
    mode_desc = {
        "briefing": "Concise daily briefing with 4-6 sentence overview and bullets.",
        "fun_fact": "Return 1-3 quirky, surprising facts with short context.",
        "single_source": "Summarize from a specific source if present; otherwise do a briefing.",
    }.get(mode, "Concise daily briefing with 4-6 sentence overview and bullets.")

    content = _format_results(results)

    from .schemas import NewsDigest as _NewsDigest

    json_schema = clean_schema(_NewsDigest.model_json_schema())

    prompt = f"""
    You are a news analyst. Topic: "{topic}".
    Mode: {mode} -> {mode_desc}

    From the web results below, select up to 8 strong articles,
    summarize each (1-2 sentences), extract 3-5 key points,
    and produce an overall summary + top takeaways.
    Include citations (the article URLs you relied on).
    If publish dates are obvious in the content, include them as strings.

    Results:
    {content}
    """

    resp = await asyncio.to_thread(
        client.models.generate_content,
        model=config.gemini_model,
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_schema": json_schema,
        },
    )
    parsed: _NewsDigest = _NewsDigest.model_validate_json(resp.text)
    parsed.topic = topic
    parsed.mode = mode
    return parsed
