from ..tools.news import news_search
from ..tools.llm import summarize_news
from ..schemas import NewsDigest
from ..core.workflow import run_steps


# take a topic and return a news digest of the results
# the mode can be briefing, fun_fact (this is for the future use cases), or single_source
async def research_news(
    topic: str, mode: str = "briefing", days: int = 7, source: str | None = None
) -> NewsDigest:
    async def step_search(_):
        return await news_search(topic=topic, days=days, source=source, max_results=8)

    async def step_summarize(ctx):
        return await summarize_news(topic=topic, mode=mode, results=ctx["search"])

    ctx = await run_steps([("search", step_search), ("summarize", step_summarize)])
    return ctx["summarize"]
