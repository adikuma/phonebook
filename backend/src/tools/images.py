from typing import Any, Dict, List
import asyncio
import base64
from google.genai import types
from .clients import genai_client
from ..config import config


# extracts inline image parts from a Gemini response
# gemini models dont provide urls for images so we need to extract them from the response
def inline_images(resp: Any, n: int) -> List[Dict[str, str]]:
    out: List[Dict[str, str]] = []
    # get the candidates from the response
    for cand in getattr(resp, "candidates", []) or []:
        content = getattr(cand, "content", None)
        if not content:
            continue
        # get the parts from the content
        for p in getattr(content, "parts", []):
            inline = getattr(p, "inline_data", None)
            if inline and getattr(inline, "data", None):
                # get the data from the inline data
                data = inline.data
                mime = getattr(inline, "mime_type", None) or "image/png"
                # encode the data if it's not a base64 string
                if not isinstance(data, str):
                    data = base64.b64encode(data).decode("ascii")
                out.append(
                    # return the data url and mime type
                    {"data_url": f"data:{mime};base64,{data}", "mime_type": mime}
                )
                if len(out) >= n:
                    return out
    return out


# generates n marketing images via Gemini with Imagen fallback
async def generate_images(prompt: str, n: int = 1) -> Dict[str, Any]:
    model = config.gemini_image_model
    try:
        resp = await asyncio.to_thread(
            genai_client.models.generate_content, model=model, contents=[prompt]
        )
        imgs = inline_images(resp, n=max(1, n))
        if imgs:
            return {"model": model, "images": imgs}
    except Exception:
        pass
    # raise error if image generation fails
    raise ValueError("Image generation failed")


# edits an image with optional mask via Gemini
async def image_edit(
    prompt: str,
    image_bytes: bytes,
    image_mime: str,
    n: int = 1,
) -> Dict[str, Any]:
    try:
        # configure the parts
        # maps the raw bytes to a Gemini part for the model
        parts: List[Any] = [
            types.Part.from_bytes(data=image_bytes, mime_type=image_mime)
        ]
        if prompt.strip():
            # add the prompt
            parts.append(prompt.strip())
        resp = await asyncio.to_thread(
            genai_client.models.generate_content,
            model=config.gemini_image_model,
            contents=parts,
        )
        # get the images from the response
        imgs = inline_images(resp, n=max(1, n))
        if imgs:
            return {"model": config.gemini_image_model, "images": imgs}
    except Exception:
        pass
    raise ValueError("Image edit failed")
