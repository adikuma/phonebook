from typing import List, Dict, Any
import asyncio
from .clients import exa_client, tavily_client


# unified web search across Exa + Tavily with de-duplication
# get results from Exa and Tavily and return a list of dictionaries with the url, title, and content
async def search_web(query: str, max_results: int = 5) -> List[Dict[str, Any]]:
    exa_task = asyncio.create_task(search_exa(query, max_results))
    tavily_task = asyncio.create_task(search_tavily(query, max_results))
    exa_results, tavily_results = await asyncio.gather(exa_task, tavily_task)
    seen, out = set(), []
    for r in exa_results + tavily_results:
        u = r.get("url")
        # de-duplicate
        if u and u not in seen:
            seen.add(u)
            out.append(r)
    return out[: max_results * 2]


# both wrappers return a list of dictionaries with the url, title, and content
# using both clients to get richer results


# Exa wrapper
async def search_exa(query: str, max_results: int) -> List[Dict[str, Any]]:
    try:
        resp = await asyncio.to_thread(
            exa_client.search_and_contents,
            query,
            use_autoprompt=True,
            num_results=max_results,
            type="auto",
        )
        return [
            {
                "url": getattr(r, "url", ""),
                "title": getattr(r, "title", ""),
                "content": getattr(r, "text", "")[:1000],
            }
            for r in getattr(resp, "results", [])
        ]
    except Exception:
        return []


# Tavily wrapper
async def search_tavily(query: str, max_results: int) -> List[Dict[str, Any]]:
    try:
        resp = await asyncio.to_thread(
            tavily_client.search,
            query,
            max_results=max_results,
            include_answer=False,
            auto_parameters=True,
        )
        results = resp.get("results", [])
        return [
            {
                "url": r.get("url", ""),
                "title": r.get("title", ""),
                "content": (r.get("content", "") or "")[:1000],
            }
            for r in results
        ]
    except Exception:
        return []
