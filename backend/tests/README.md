# Tests

This folder is for pytest unit and integration tests.

## Suggested Structure

```
tests/
├── __init__.py
├── conftest.py          # Shared fixtures
├── test_auth.py         # Authentication tests
├── test_users.py        # User CRUD tests
├── test_faculty.py      # Faculty endpoint tests
├── test_student.py      # Student endpoint tests
└── test_pdf_parser.py   # PDF parsing tests
```

## Running Tests

```bash
# Install pytest
pip install pytest pytest-asyncio httpx

# Run all tests
pytest

# Run with coverage
pytest --cov=api --cov=services --cov-report=html

# Run specific test file
pytest tests/test_auth.py -v
```

## Example: conftest.py

```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from db.database import get_db, Base

# Test database (SQLite for speed)
SQLALCHEMY_TEST_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_TEST_URL)
TestSession = sessionmaker(bind=engine)

@pytest.fixture(scope="module")
def client():
    Base.metadata.create_all(bind=engine)
    
    def override_get_db():
        db = TestSession()
        try:
            yield db
        finally:
            db.close()
    
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    Base.metadata.drop_all(bind=engine)
```

## Example: test_auth.py

```python
def test_login_success(client):
    response = client.post("/api/auth/login", json={
        "email": "test@tup.edu.ph",
        "password": "testpass"
    })
    assert response.status_code == 200
    assert "user" in response.json()

def test_login_invalid_password(client):
    response = client.post("/api/auth/login", json={
        "email": "test@tup.edu.ph",
        "password": "wrongpass"
    })
    assert response.status_code == 401
```
