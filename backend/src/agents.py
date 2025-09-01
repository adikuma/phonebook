from langgraph.graph import StateGraph, END
from typing import TypedDict, List, Dict, Any, Optional
from .schemas import CompanyProfile, PersonProfile, NewsDigest
from .tools import search_web, extract_linkedin_data, analyze_content
from .tools import news_search, summarize_news
import asyncio


class CompanyState(TypedDict):
    company_name: str
    search_results: List[Dict[str, Any]]
    profile: CompanyProfile


class PersonState(TypedDict):
    linkedin_url: str
    linkedin_data: Dict[str, Any]
    search_results: List[Dict[str, Any]]
    profile: PersonProfile


# company agent
class CompanyAgent:
    def __init__(self):
        self.graph = self._build_graph()
        self.app = self.graph.compile()

    def _build_graph(self):
        graph = StateGraph(CompanyState)
        graph.add_node("search", self._search_company)
        graph.add_node("analyze", self._analyze_company)
        graph.set_entry_point("search")
        graph.add_edge("search", "analyze")
        graph.add_edge("analyze", END)
        return graph

    async def _search_company(self, state: CompanyState) -> CompanyState:
        company = state["company_name"]
        searches = [
            search_web(f"{company} company overview profile"),
            search_web(f"{company} latest news"),
            search_web(f"{company} products services"),
            search_web(f"{company} leadership team executives"),
            search_web(f"{company} funding revenue"),
        ]
        all_results = []
        for s in searches:
            result = await s
            all_results.extend(result)
            await asyncio.sleep(0.25)
        state["search_results"] = all_results
        return state

    async def _analyze_company(self, state: CompanyState) -> CompanyState:
        profile = await analyze_content(
            content=state["search_results"],
            target="company",
            name=state["company_name"],
            schema=CompanyProfile,
        )
        state["profile"] = profile
        return state

    async def research(self, company_name: str) -> CompanyProfile:
        result = await self.app.ainvoke({"company_name": company_name})
        return result["profile"]


# person agent
class PersonAgent:
    def __init__(self):
        self.graph = self._build_graph()
        self.app = self.graph.compile()

    def _build_graph(self):
        graph = StateGraph(PersonState)
        graph.add_node("extract", self._extract_linkedin)
        graph.add_node("search", self._search_person)
        graph.add_node("analyze", self._analyze_person)
        graph.set_entry_point("extract")
        graph.add_edge("extract", "search")
        graph.add_edge("search", "analyze")
        graph.add_edge("analyze", END)
        return graph

    async def _extract_linkedin(self, state: PersonState) -> PersonState:
        linkedin_data = await extract_linkedin_data(state["linkedin_url"])
        state["linkedin_data"] = linkedin_data
        return state

    async def _search_person(self, state: PersonState) -> PersonState:
        person_name = state["linkedin_data"].get("name", "")
        company = state["linkedin_data"].get("company", "")

        searches = [
            search_web(f"{person_name} {company}"),
            search_web(f"{person_name} speaking conferences"),
            search_web(f"{person_name} articles posts"),
            search_web(f"{person_name} education background"),
            search_web(f"{person_name} work experience resume"),
            search_web(f"{person_name} skills and expertise"),
            search_web(f"{person_name} linkedin posts 2025"),
        ]
        if company:
            searches.append(search_web(f"{person_name} {company} role"))

        all_results = []
        for s in searches:
            result = await s
            all_results.extend(result)
            await asyncio.sleep(0.25)

        state["search_results"] = all_results
        return state

    async def _analyze_person(self, state: PersonState) -> PersonState:
        combined = {"linkedin": state["linkedin_data"], "web": state["search_results"]}
        profile = await analyze_content(
            content=combined,
            target="person",
            name=state["linkedin_data"].get("name", "Unknown"),
            schema=PersonProfile,
        )
        state["profile"] = profile
        return state

    async def research(self, linkedin_url: str) -> PersonProfile:
        result = await self.app.ainvoke({"linkedin_url": linkedin_url})
        return result["profile"]


# news agent
class NewsState(TypedDict, total=False):
    topic: str
    mode: str
    source: Optional[str]
    days: int
    search_results: List[Dict[str, Any]]
    digest: NewsDigest


class NewsAgent:
    def __init__(self):
        self.graph = self._build_graph()
        self.app = self.graph.compile()

    def _build_graph(self):
        graph = StateGraph(NewsState)
        graph.add_node("search", self._search_news)
        graph.add_node("synthesize", self._synthesize)
        graph.set_entry_point("search")
        graph.add_edge("search", "synthesize")
        graph.add_edge("synthesize", END)
        return graph

    async def _search_news(self, state: NewsState) -> NewsState:
        topic = state["topic"]
        mode = state.get("mode", "briefing")
        source = state.get("source")
        days = state.get("days", 7)

        results = await news_search(topic=topic, days=days, source=source)
        # if single_source mode but no source, just keep results
        state["mode"] = mode
        state["search_results"] = results
        return state

    async def _synthesize(self, state: NewsState) -> NewsState:
        topic = state["topic"]
        mode = state.get("mode", "briefing")
        digest = await summarize_news(
            topic=topic, mode=mode, results=state["search_results"]
        )
        state["digest"] = digest
        return state

    async def research(
        self,
        topic: str,
        mode: str = "briefing",
        days: int = 7,
        source: Optional[str] = None,
    ) -> NewsDigest:
        out = await self.app.ainvoke(
            {"topic": topic, "mode": mode, "days": days, "source": source}
        )
        return out["digest"]


# initialize agents
company_agent = CompanyAgent()
person_agent = PersonAgent()
news_agent = NewsAgent()
