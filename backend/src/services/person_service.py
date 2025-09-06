from ..tools.linkedin import extract_linkedin_data
from ..tools import search_web
from ..tools.llm import analyze_content
from ..schemas import PersonProfile
from ..core.workflow import run_steps


# finding a person from their linkedin url
async def research_person(linkedin_url: str) -> PersonProfile:
    async def step_extract(_):
        return await extract_linkedin_data(linkedin_url)

    async def step_search(ctx):
        li = ctx["extract"]
        person = li.get("name", "")
        company = li.get("company", "")
        queries = [
            f"{person} {company}",
            f"{person} speaking conferences",
            f"{person} articles posts",
            f"{person} education background",
            f"{person} work experience resume",
            f"{person} skills and expertise",
            f"{person} linkedin posts 2025",
        ]
        if company:
            queries.append(f"{person} {company} role")
        rows = []
        for q in queries:
            rows.extend(await search_web(q, max_results=4))
        return {"linkedin": li, "web": rows}

    async def step_analyze(ctx):
        data = ctx["search"]
        return await analyze_content(
            content=data,
            target="person",
            name=data["linkedin"].get("name", "Unknown"),
            schema=PersonProfile,
        )

    ctx = await run_steps(
        [("extract", step_extract), ("search", step_search), ("analyze", step_analyze)]
    )
    return ctx["analyze"]
