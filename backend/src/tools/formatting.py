from typing import Any, Dict, List
from urllib.parse import urlparse
import json


# builds compact string from web results for prompting
def format_results(results: List[Dict[str, Any]]) -> str:
    rows = []
    for r in results[:10]:
        title = r.get("title", "")
        url = r.get("url", "")
        content = (r.get("content", "") or "")[:800]
        rows.append(f"Title: {title}\nURL: {url}\nContent: {content}\n")
    return "\n---\n".join(rows)


def format_content(content: Any) -> str:
    if isinstance(content, list):
        return format_results(content)
    if isinstance(content, dict):
        try:
            return json.dumps(content, ensure_ascii=False)
        except Exception:
            return str(content)
    return str(content)


# extracts hostname
def domain(url: str) -> str:
    try:
        h = urlparse(url).hostname or ""
        return h.replace("www.", "")
    except Exception:
        return ""
