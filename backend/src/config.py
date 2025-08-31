import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # api keys
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    tavily_api_key = os.getenv("TAVILY_API_KEY")
    exa_api_key = os.getenv("EXA_API_KEY")
    linkedin_email = os.getenv("LINKEDIN_EMAIL")
    linkedin_password = os.getenv("LINKEDIN_PASSWORD")

    # model settings
    gemini_model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

    # search settings
    max_search_results = int(os.getenv("MAX_SEARCH_RESULTS", "5"))

    # api settings
    api_host = os.getenv("API_HOST", "0.0.0.0")
    api_port = int(os.getenv("API_PORT", "8000"))


config = Config()
