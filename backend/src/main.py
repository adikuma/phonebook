from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
import uvicorn

from .agents import company_agent, person_agent
from .schemas import CompanyProfile, PersonProfile

app = FastAPI(title="Sales Intelligence API")

# enable cors for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CompanyRequest(BaseModel):
    name: str


class PersonRequest(BaseModel):
    linkedin_url: HttpUrl


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


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
