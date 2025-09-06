from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, HttpUrl
from ..schemas import (
    CompanyProfile,
    PersonProfile,
    NewsDigest,
    ImageResponse,
    ImageResult,
    ImageRequest,
)
from ..services.company_service import research_company
from ..services.person_service import research_person
from ..services.news_service import research_news
from ..services.images_service import gen_images, edit_image

router = APIRouter()


class CompanyRequest(BaseModel):
    name: str


class PersonRequest(BaseModel):
    linkedin_url: HttpUrl


class NewsRequest(BaseModel):
    topic: str
    mode: str | None = "briefing"
    days: int | None = 7
    source: str | None = None


@router.post("/company", response_model=CompanyProfile)
async def company_endpoint(req: CompanyRequest):
    try:
        return await research_company(req.name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/person", response_model=PersonProfile)
async def person_endpoint(req: PersonRequest):
    try:
        return await research_person(str(req.linkedin_url))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/news", response_model=NewsDigest)
async def news_endpoint(req: NewsRequest):
    try:
        return await research_news(
            topic=req.topic,
            mode=req.mode or "briefing",
            days=req.days or 7,
            source=req.source,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/image", response_model=ImageResponse)
async def image_endpoint(req: ImageRequest):
    try:
        out = await gen_images(
            req.prompt
            if not req.marketing_preset
            else f"{req.prompt}\n\nDesign notes: {req.marketing_preset}",
            n=req.n,
        )
        return ImageResponse(
            model=out["model"], images=[ImageResult(**img) for img in out["images"]]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/image/edit", response_model=ImageResponse)
async def image_edit_endpoint(
    prompt: str = Form(""),
    n: int = Form(1),
    image: UploadFile = File(...),
):
    try:
        img_bytes = await image.read()
        img_mime = image.content_type or "image/png"
        out = await edit_image(
            prompt=prompt,
            image_bytes=img_bytes,
            image_mime=img_mime,
            n=n,
        )
        return ImageResponse(
            model=out["model"], images=[ImageResult(**img) for img in out["images"]]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
