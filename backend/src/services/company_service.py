from ..tools import search_web
from ..tools.llm import analyze_content
from ..schemas import CompanyProfile
from ..core.workflow import run_steps


# NOTE move to agent mode in the future
# take a company name (generate search queries and run them through search_web)
# then analyze the results using analyze_content
# return the results as a CompanyProfile
async def research_company(name: str) -> CompanyProfile:
    async def step_search(_):
        queries = [
            f"{name} company overview profile",
            f"{name} latest news",
            f"{name} products services",
            f"{name} leadership team executives",
            f"{name} funding revenue",
        ]
        rows = []
        for q in queries:
            rows.extend(await search_web(q, max_results=5))
        return rows

    async def step_analyze(ctx):
        return await analyze_content(
            content=ctx["search"], target="company", name=name, schema=CompanyProfile
        )

    ctx = await run_steps([("search", step_search), ("analyze", step_analyze)])
    return ctx["analyze"]
