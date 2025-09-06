from typing import List, Dict, Any, Optional
import asyncio
from .search import search_web


# fetches diverse recent news results for a topic
async def news_search(
    topic: str, days: int = 7, source: Optional[str] = None, max_results: int = 8
) -> List[Dict[str, Any]]:
    base = f"{topic} news past {days} days"
    queries = [base, f"latest updates {topic}", f"{topic} headlines"]
    if source:
        queries.append(f"site:{source} {topic} past {days} days")
    per_q = max(3, max_results // max(1, len(queries)))
    seen, out = set(), []
    for q in queries:
        try:
            rows = await search_web(q, max_results=per_q)
            for r in rows:
                u = r.get("url")
                if u and u not in seen:
                    seen.add(u)
                    out.append(r)
            await asyncio.sleep(0.25)
        except Exception:
            pass
    return out[:max_results]
