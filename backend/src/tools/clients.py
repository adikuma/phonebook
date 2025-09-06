from google import genai
from exa_py import Exa
from tavily import TavilyClient
from ..config import config

genai_client = genai.Client(api_key=config.gemini_api_key)
exa_client = Exa(api_key=config.exa_api_key)
tavily_client = TavilyClient(api_key=config.tavily_api_key)
