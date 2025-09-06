import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    exa_api_key = os.getenv("EXA_API_KEY")
    gemini_model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    gemini_image_model = os.getenv(
        "GEMINI_IMAGE_MODEL", "gemini-2.5-flash-image-preview"
    )
    max_search_results = int(os.getenv("MAX_SEARCH_RESULTS", "5"))
    api_host = os.getenv("API_HOST", "0.0.0.0")
    api_port = int(os.getenv("API_PORT", "8000"))
    tavily_api_key = os.getenv("TAVILY_API_KEY")


config = Config()
