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

    # business details
    products_services: List[str] = Field(
        default_factory=list, description="main products and services"
    )
    target_markets: List[str] = Field(
        default_factory=list, description="target customer segments"
    )
    competitors: List[str] = Field(default_factory=list)

    # leadership
    key_executives: List[Executive] = Field(
        default_factory=list, description="name and title pairs"
    )

    # recent activity
    recent_news: List[str] = Field(
        default_factory=list, description="recent news and announcements"
    )
    recent_funding: Optional[str] = None

    # sales intelligence
    pain_points: List[str] = Field(
        default_factory=list, description="potential pain points or needs"
    )
    opportunities: List[str] = Field(
        default_factory=list, description="sales engagement opportunities"
    )
    talking_points: List[str] = Field(
        default_factory=list, description="conversation starters"
    )

    # metadata
    last_updated: datetime = Field(default_factory=datetime.now)
    confidence_score: float = Field(ge=0.0, le=1.0, default=0.8)


class PersonProfile(BaseModel):
    name: str
    linkedin_url: HttpUrl
    headline: Optional[str] = None
    location: Optional[str] = None

    # current position
    current_company: Optional[str] = None
    current_role: Optional[str] = None
    role_duration: Optional[str] = None
    responsibilities: List[str] = Field(default_factory=list)

    # background
    previous_companies: List[Experience] = Field(
        default_factory=list, description="company and role pairs"
    )
    education: List[str] = Field(default_factory=list)
    total_experience: Optional[str] = None

    # interests and activity
    post_topics: List[str] = Field(
        default_factory=list, description="topics they post about"
    )
    interests: List[str] = Field(
        default_factory=list, description="professional interests"
    )
    skills: List[str] = Field(default_factory=list)

    # engagement insights
    communication_style: Optional[str] = None
    decision_making_factors: List[str] = Field(default_factory=list)
    potential_needs: List[str] = Field(
        default_factory=list, description="potential pain points or needs"
    )

    # sales intelligence
    engagement_tips: List[str] = Field(
        default_factory=list, description="how to best engage"
    )
    common_connections: List[str] = Field(default_factory=list)
    conversation_starters: List[str] = Field(default_factory=list)

    # metadata
    last_updated: datetime = Field(default_factory=datetime.now)
    profile_completeness: float = Field(ge=0.0, le=1.0, default=0.7)
