# Backend

phonebook backend: provides api endpoints to research companies and persons, returning structured profiles.

## Architecture

```
FastAPI (main.py)
    ├── /company endpoint
    │   └── CompanyAgent (agents.py)
    │       ├── search node → parallel web searches
    │       └── analyze node → gemini structures data
    │
    └── /person endpoint
        └── PersonAgent (agents.py)
            ├── extract node → linkedin data extraction
            ├── search node → additional web searches
            └── analyze node → gemini structures profile
```

## Setup**Install dependencies**

```bash
pip install fastapi uvicorn langgraph exa-py tavily-python google-generativeai python-dotenv httpx aiohttp
```

2. **Set environment variables**

```bash
# create .env file
GEMINI_API_KEY=your_key
TAVILY_API_KEY=your_key
EXA_API_KEY=your_key
```

3. **Run the server**

```bash
python main.py
# or
uvicorn main:app --reload
```

## API Endpoints

### Company Research

```bash
POST /company
{
  "name": "DBS Bank"
}
```

Returns comprehensive company profile with:

* overview and description
* products and services
* recent news
* key executives

### Person Research

```bash
POST /person
{
  "linkedin_url": "https://www.linkedin.com/in/username"
}
```

Returns detailed person profile with:

* current role and company
* work history
* post topics and interests
* skills and expertise
* engagement tips
* potential needs
