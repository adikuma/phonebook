from typing import Any


# removes unsupported/noisy JSON Schema keys for LLM structured output
def clean_schema(schema: Any) -> Any:
    if isinstance(schema, dict):
        return {
            k: clean_schema(v)
            for k, v in schema.items()
            if k not in {"additionalProperties", "default"}
        }
    if isinstance(schema, list):
        return [clean_schema(x) for x in schema]
    return schema
