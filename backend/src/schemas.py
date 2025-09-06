from pydantic import BaseModel, HttpUrl, Field
from typing import List, Optional
from datetime import datetime


class Executive(BaseModel):
    name: str
    title: str


class Experience(BaseModel):
    company: str
    role: str


class CompanyProfile(BaseModel):
    name: str
    description: str = Field(description="company overview and mission")
    industry: Optional[str] = None
    headquarters: Optional[str] = None
    website: Optional[HttpUrl] = None
    employee_count: Optional[str] = None
    founded_year: Optional[int] = None
    products_services: List[str] = Field(default_factory=list)
    target_markets: List[str] = Field(default_factory=list)
    competitors: List[str] = Field(default_factory=list)
    key_executives: List[Executive] = Field(default_factory=list)
    recent_news: List[str] = Field(default_factory=list)
    recent_funding: Optional[str] = None
    pain_points: List[str] = Field(default_factory=list)
    opportunities: List[str] = Field(default_factory=list)
    talking_points: List[str] = Field(default_factory=list)
    last_updated: datetime = Field(default_factory=datetime.now)
    confidence_score: float = Field(ge=0.0, le=1.0, default=0.8)


class PersonProfile(BaseModel):
    name: str
    linkedin_url: HttpUrl
    headline: Optional[str] = None
    location: Optional[str] = None
    current_company: Optional[str] = None
    current_role: Optional[str] = None
    role_duration: Optional[str] = None
    responsibilities: List[str] = Field(default_factory=list)
    previous_companies: List[Experience] = Field(default_factory=list)
    education: List[str] = Field(default_factory=list)
    total_experience: Optional[str] = None
    post_topics: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    communication_style: Optional[str] = None
    decision_making_factors: List[str] = Field(default_factory=list)
    potential_needs: List[str] = Field(default_factory=list)
    engagement_tips: List[str] = Field(default_factory=list)
    common_connections: List[str] = Field(default_factory=list)
    conversation_starters: List[str] = Field(default_factory=list)
    last_updated: datetime = Field(default_factory=datetime.now)
    profile_completeness: float = Field(ge=0.0, le=1.0, default=0.7)


class NewsItem(BaseModel):
    title: str
    url: HttpUrl
    source: Optional[str] = None
    published_at: Optional[str] = None
    summary: Optional[str] = None
    key_points: List[str] = Field(default_factory=list)


class NewsDigest(BaseModel):
    topic: str
    mode: str = Field(default="briefing", description="briefing|fun_fact|single_source")
    generated_at: datetime = Field(default_factory=datetime.now)
    overall_summary: str = ""
    top_takeaways: List[str] = Field(default_factory=list)
    articles: List[NewsItem] = Field(default_factory=list)
    sentiment: Optional[str] = Field(
        default=None, description="positive|neutral|negative"
    )
    citations: List[str] = Field(default_factory=list)


class ImageRequest(BaseModel):
    prompt: str
    n: int = Field(default=1, ge=1, le=4)
    marketing_preset: Optional[str] = None


class ImageResult(BaseModel):
    data_url: str
    mime_type: str = "image/png"


class ImageResponse(BaseModel):
    model: str
    images: List[ImageResult] = Field(default_factory=list)


class PolicyRebate(BaseModel):
    name: str
    amount_per_kwac_rm: Optional[float] = None
    cap_rm: Optional[float] = None
    since: Optional[str] = None


class PolicyLinks(BaseModel):
    quota_dashboard: Optional[HttpUrl] = None
    about: Optional[HttpUrl] = None
    payment: Optional[HttpUrl] = None


class PolicyMY(BaseModel):
    rakyat_quota_mw: Optional[float] = None
    gomen_quota_mw: Optional[float] = None
    nova_quota_mw: Optional[float] = None
    offset: Optional[str] = None
    rebate: Optional[PolicyRebate] = None
    links: PolicyLinks = PolicyLinks()


class PolicyScheme(BaseModel):
    id: str
    audience: Optional[str] = None
    payout: Optional[str] = None


class PolicySG(BaseModel):
    has_quota: bool = False
    schemes: List[PolicyScheme] = Field(default_factory=list)
    links: PolicyLinks = PolicyLinks()


class PolicySnapshot(BaseModel):
    updated_at: datetime = Field(default_factory=datetime.now)
    my: PolicyMY
    sg: PolicySG
    citations: List[str] = Field(default_factory=list)
