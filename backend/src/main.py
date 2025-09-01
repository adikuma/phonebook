from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
from pydantic import BaseModel, HttpUrl
import uvicorn
import asyncio
from fastapi.middleware.cors import CORSMiddleware
from .agents import company_agent, person_agent, news_agent
from .schemas import CompanyProfile, PersonProfile, NewsDigest

load_dotenv()


app = FastAPI(title="Phonebook API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://phonebook-mocha-eight.vercel.app",
        "http://localhost:3000",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CompanyRequest(BaseModel):
    name: str


class PersonRequest(BaseModel):
    linkedin_url: HttpUrl


class NewsRequest(BaseModel):
    topic: str
    mode: str | None = "briefing"  # briefing | fun_fact | single_source
    days: int | None = 7
    source: str | None = None


@app.post("/company", response_model=CompanyProfile)
async def research_company(request: CompanyRequest):
    try:
        result = await company_agent.research(request.name)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/person", response_model=PersonProfile)
async def research_person(request: PersonRequest):
    try:
        result = await person_agent.research(str(request.linkedin_url))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/news", response_model=NewsDigest)
async def news_digest(request: NewsRequest):
    try:
        digest = await news_agent.research(
            topic=request.topic,
            mode=request.mode or "briefing",
            days=request.days or 7,
            source=request.source,
        )
        return digest
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/news/dashboard")
async def news_dashboard():
    try:
        ai, solar = await asyncio.gather(
            news_agent.research("AI agents", mode="briefing", days=7),
            news_agent.research("solar energy in Singapore", mode="briefing", days=7),
        )
        return {"ai_agents": ai, "solar_sg": solar}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
