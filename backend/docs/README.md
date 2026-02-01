# API Documentation

This folder is for API documentation and OpenAPI specifications.

## Suggested Contents

| File | Purpose |
|------|---------|
| `openapi.yaml` | Full OpenAPI 3.0 specification |
| `postman_collection.json` | Postman collection for testing |
| `api_changelog.md` | API version history |

## Auto-Generated Docs

FastAPI automatically generates documentation at:

| URL | Description |
|-----|-------------|
| `http://localhost:5000/docs` | Swagger UI (interactive) |
| `http://localhost:5000/redoc` | ReDoc (clean documentation) |
| `http://localhost:5000/openapi.json` | Raw OpenAPI JSON |

## Exporting OpenAPI

To export the OpenAPI schema:

```python
# In main.py or a script
from main import app
import json

with open("docs/openapi.json", "w") as f:
    json.dump(app.openapi(), f, indent=2)
```
