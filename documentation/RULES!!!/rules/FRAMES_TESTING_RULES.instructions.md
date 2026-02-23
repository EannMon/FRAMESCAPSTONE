# FRAMES Testing Standards & Conventions

## Purpose

The existing rules say "incorporate unit tests" and provide a deployment checklist, but define NO test conventions — no file structure, no database setup, no mocking strategy, no coverage targets.

This file defines the **complete testing architecture** for FRAMES.

This supplements `codingRules.md` §7 and `FRAMES_DEPLOYMENT_CONSTRAINTS.md` §7.

---

# 1️⃣ Test Organization

## 1.1 Directory Structure

```
backend/
    tests/
        __init__.py
        conftest.py                    # Shared fixtures (test DB, test users, etc.)
        test_auth.py                   # Auth endpoints: login, register, refresh
        test_student_routes.py         # Student router endpoints
        test_faculty_routes.py         # Faculty router endpoints  
        test_admin_routes.py           # Admin router endpoints
        test_kiosk_routes.py           # Kiosk/attendance endpoints
        test_attendance_service.py     # Attendance state machine logic
        test_schedule_service.py       # Schedule resolution logic
        test_models.py                 # Model constraints, defaults, relationships
        test_face_recognition.py       # Face detection/recognition with mocked models

frontend/
    src/
        __tests__/                     # Or colocated with components
            StudentDashboard.test.jsx
            FacultySchedule.test.jsx
            LoginPage.test.jsx
            api.test.js                # API client interceptor tests
```

## 1.2 File Naming

| Language | Convention | Example |
|----------|-----------|---------|
| Python | `test_<module>.py` | `test_faculty_routes.py` |
| JavaScript | `<Component>.test.jsx` or `<module>.test.js` | `StudentDashboard.test.jsx` |

### FORBIDDEN

```
# ❌ BANNED names
tests.py           # Too vague
test1.py           # Non-descriptive
my_test_file.py    # Not clear what it tests
```

---

# 2️⃣ Backend Test Database Setup

## 2.1 SQLite In-Memory for Unit Tests

Unit tests MUST NOT hit the real PostgreSQL database. Use SQLite in-memory:

```python
# backend/tests/conftest.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from db.database import Base, get_db
from main import app

# In-memory SQLite for tests — fast, isolated, disposable
TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """
    Create a fresh database for each test function.
    Tables are created before and dropped after each test.
    """
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """
    FastAPI test client with database dependency override.
    Each test gets a clean database.
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
```

## 2.2 Why `scope="function"` (Not `session`)

Each test gets a **fresh database** to prevent:
- Test pollution (data from test A affecting test B)
- Order-dependent test results
- Debugging nightmares from shared state

---

# 3️⃣ Test Fixtures — Reusable Test Data

## 3.1 Core Fixtures

```python
# backend/tests/conftest.py (continued)
from models.user import User, UserRole, VerificationStatus
from models.department import Department
from models.subject import Subject
from models.class_ import Class
from models.enrollment import Enrollment


@pytest.fixture
def test_department(db_session):
    """Create a test department."""
    dept = Department(name="Computer Engineering", code="CPE")
    db_session.add(dept)
    db_session.commit()
    db_session.refresh(dept)
    return dept


@pytest.fixture
def test_admin(db_session, test_department):
    """Create an admin user for testing."""
    from core.security import hash_password  # Use actual hash function
    user = User(
        tupm_id="TUPM-00-0000",
        email="admin@test.com",
        hashed_password=hash_password("testpassword"),
        first_name="Test",
        last_name="Admin",
        role=UserRole.ADMIN,
        department_id=test_department.id,
        verification_status=VerificationStatus.VERIFIED,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_faculty(db_session, test_department):
    """Create a faculty user for testing."""
    from core.security import hash_password
    user = User(
        tupm_id="TUPM-00-0001",
        email="faculty@test.com",
        hashed_password=hash_password("testpassword"),
        first_name="Test",
        last_name="Faculty",
        role=UserRole.FACULTY,
        department_id=test_department.id,
        verification_status=VerificationStatus.VERIFIED,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_student(db_session, test_department):
    """Create a student user for testing."""
    from core.security import hash_password
    user = User(
        tupm_id="TUPM-00-0002",
        email="student@test.com",
        hashed_password=hash_password("testpassword"),
        first_name="Test",
        last_name="Student",
        role=UserRole.STUDENT,
        department_id=test_department.id,
        verification_status=VerificationStatus.VERIFIED,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_class_with_enrollment(db_session, test_faculty, test_student, test_department):
    """Create a class with a subject and enroll the test student."""
    subject = Subject(
        code="CPE101",
        name="Intro to Computer Engineering",
        department_id=test_department.id,
    )
    db_session.add(subject)
    db_session.flush()
    
    cls = Class(
        subject_id=subject.id,
        faculty_id=test_faculty.id,
        section="A",
        room="MH-301",
        day_of_week="Monday",
        start_time="08:00",
        end_time="09:30",
        semester="1st",
        academic_year="2024-2025",
    )
    db_session.add(cls)
    db_session.flush()
    
    enrollment = Enrollment(
        student_id=test_student.id,
        class_id=cls.id,
    )
    db_session.add(enrollment)
    db_session.commit()
    
    return cls


@pytest.fixture
def auth_headers(client, test_faculty):
    """Get auth headers for the test faculty user."""
    response = client.post("/api/auth/login", json={
        "email": "faculty@test.com",
        "password": "testpassword",
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
```

---

# 4️⃣ What to Test Per Layer

## 4.1 Router Tests (Integration)

Test **HTTP contract**: status codes, response shape, auth enforcement.

```python
# backend/tests/test_faculty_routes.py

class TestFacultySchedule:
    """Tests for GET /api/faculty/schedule"""
    
    def test_returns_schedule_for_authenticated_faculty(
        self, client, auth_headers, test_class_with_enrollment
    ):
        """Faculty can see their schedule."""
        response = client.get("/api/faculty/schedule", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert "subject_name" in data[0]
    
    def test_rejects_unauthenticated_request(self, client):
        """Unauthenticated request returns 401/403."""
        response = client.get("/api/faculty/schedule")
        assert response.status_code in (401, 403)
    
    def test_student_cannot_access_faculty_endpoint(
        self, client, test_student
    ):
        """Student role cannot access faculty-only endpoint."""
        # Login as student, get token
        login_resp = client.post("/api/auth/login", json={
            "email": "student@test.com",
            "password": "testpassword",
        })
        token = login_resp.json()["access_token"]
        
        response = client.get(
            "/api/faculty/schedule",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 403
    
    def test_empty_schedule_returns_empty_list(
        self, client, auth_headers
    ):
        """Faculty with no classes gets empty list, not error."""
        # test_faculty exists but has no classes in this test
        response = client.get("/api/faculty/schedule", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []
```

## 4.2 Service Tests (Unit)

Test **business logic**: calculations, state transitions, edge cases.

```python
# backend/tests/test_attendance_service.py

class TestAttendanceStateMachine:
    """Test the ENTRY → BREAK_OUT → BREAK_IN → EXIT state machine."""
    
    def test_first_scan_is_entry(self, db_session, test_student, test_class_with_enrollment):
        """First scan of the day creates an ENTRY log."""
        result = attendance_service.log_attendance(
            db_session, test_student.id, test_class_with_enrollment.id, device_id=1
        )
        assert result.action == AttendanceAction.ENTRY
    
    def test_second_scan_after_entry_is_break_out(
        self, db_session, test_student, test_class_with_enrollment
    ):
        """Second scan transitions from ENTRY to BREAK_OUT."""
        attendance_service.log_attendance(
            db_session, test_student.id, test_class_with_enrollment.id, device_id=1
        )
        result = attendance_service.log_attendance(
            db_session, test_student.id, test_class_with_enrollment.id, device_id=1
        )
        assert result.action == AttendanceAction.BREAK_OUT
    
    def test_full_cycle(self, db_session, test_student, test_class_with_enrollment):
        """Complete state machine: ENTRY → BREAK_OUT → BREAK_IN → EXIT."""
        actions = []
        for _ in range(4):
            result = attendance_service.log_attendance(
                db_session, test_student.id, test_class_with_enrollment.id, device_id=1
            )
            actions.append(result.action)
        
        assert actions == [
            AttendanceAction.ENTRY,
            AttendanceAction.BREAK_OUT,
            AttendanceAction.BREAK_IN,
            AttendanceAction.EXIT,
        ]
    
    def test_late_entry_flagged(self, db_session, test_student, test_class_with_enrollment):
        """Entry after grace period is flagged as late."""
        # Set class start_time to 1 hour ago to simulate lateness
        ...
```

## 4.3 Model Tests (Unit)

Test **database constraints**: nullable, defaults, unique constraints, relationships.

```python
# backend/tests/test_models.py
from sqlalchemy.exc import IntegrityError

class TestUserModel:
    def test_email_must_be_unique(self, db_session, test_department):
        """Duplicate email raises IntegrityError."""
        user1 = User(email="duplicate@test.com", ...)
        user2 = User(email="duplicate@test.com", ...)
        db_session.add(user1)
        db_session.commit()
        db_session.add(user2)
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_default_verification_status_is_pending(self, db_session, test_department):
        """New users default to PENDING verification."""
        user = User(email="new@test.com", ...)
        db_session.add(user)
        db_session.commit()
        assert user.verification_status == VerificationStatus.PENDING
    
    def test_cascade_delete_removes_enrollment(
        self, db_session, test_student, test_class_with_enrollment
    ):
        """Deleting a class cascades to enrollments."""
        db_session.delete(test_class_with_enrollment)
        db_session.commit()
        enrollments = db_session.query(Enrollment).filter(
            Enrollment.class_id == test_class_with_enrollment.id
        ).all()
        assert len(enrollments) == 0
```

---

# 5️⃣ Mocking Strategy

## 5.1 What to Mock

| Component | Mock? | Why |
|-----------|-------|-----|
| Database | **Override with test DB** (not mock) | SQLAlchemy queries must run for real to catch N+1, type errors |
| InsightFace model | **Mock** | 600MB model, slow load, not needed for API tests |
| MediaPipe | **Mock** | Not needed outside kiosk tests |
| External APIs (email, etc.) | **Mock** | Not available in CI, unreliable |
| File system (PDF uploads) | **Use temp files** | `tempfile.NamedTemporaryFile` |
| JWT/Auth | **Use real tokens from test login** | Auth flow is critical and must be tested end-to-end |

## 5.2 InsightFace Mock Pattern

```python
# For kiosk/recognition tests
import numpy as np
from unittest.mock import MagicMock

@pytest.fixture
def mock_face_model():
    """Mock InsightFace model that returns fake 512-d embeddings."""
    model = MagicMock()
    
    # Simulate face detection returning 1 face with random embedding
    mock_face = MagicMock()
    mock_face.embedding = np.random.randn(512).astype(np.float32)
    mock_face.bbox = np.array([100, 100, 200, 200])
    mock_face.det_score = 0.95
    
    model.get.return_value = [mock_face]
    return model
```

## 5.3 FORBIDDEN: Mocking the Database Session

```python
# ❌ BANNED — mock DB hides real query bugs
db = MagicMock()
db.query.return_value.filter.return_value.all.return_value = [fake_user]

# ✅ REQUIRED — use real DB with test fixtures
# The conftest.py test database already handles this
```

---

# 6️⃣ Coverage Targets

## 6.1 Minimum Coverage

| Layer | Target | Priority |
|-------|--------|----------|
| Services (business logic) | 80% | 🔴 High — state machine, calculations |
| Routers (endpoints) | 70% | 🔴 High — HTTP contract |
| Models (constraints) | 60% | 🟡 Medium — defaults, cascades |
| Frontend components | 50% | 🟡 Medium — critical flows |
| Kiosk pipeline | 40% | 🟢 Lower — hardware-dependent |

## 6.2 What NOT to Test

- SQLAlchemy internals (trust the ORM)
- Third-party library behavior (trust the library)
- Simple getters/setters with no logic
- Static configuration files
- Migration scripts (test by running them)

---

# 7️⃣ Running Tests

## 7.1 Commands

```bash
# Run all backend tests
cd backend
python -m pytest tests/ -v

# Run specific test file
python -m pytest tests/test_faculty_routes.py -v

# Run specific test class
python -m pytest tests/test_attendance_service.py::TestAttendanceStateMachine -v

# Run with coverage report
python -m pytest tests/ --cov=. --cov-report=term-missing

# Run with short summary
python -m pytest tests/ -v --tb=short
```

## 7.2 Required Dependencies

```
# Add to requirements.txt
pytest>=7.0
pytest-cov>=4.0
httpx>=0.24.0          # Required by TestClient with async
```

## 7.3 Pre-Commit Testing Rule

Before committing changes, developers MUST run:

```bash
python -m pytest tests/ -v --tb=short
```

All tests MUST pass. Failing tests block the commit.

---

# 8️⃣ Frontend Testing

## 8.1 Setup (Vitest + React Testing Library)

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**`vite.config.js`** addition:
```javascript
export default defineConfig({
  // ... existing config
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
});
```

**`src/test/setup.js`**:
```javascript
import '@testing-library/jest-dom';
```

## 8.2 Component Test Pattern

```jsx
// src/__tests__/LoginPage.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';

// Mock the API module
vi.mock('../services/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('LoginPage', () => {
  it('renders email and password fields', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
  
  it('shows error on invalid credentials', async () => {
    const api = await import('../services/api');
    api.default.post.mockRejectedValueOnce({
      response: { status: 401, data: { detail: 'Invalid credentials' } }
    });
    
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    
    await userEvent.type(screen.getByLabelText(/email/i), 'wrong@test.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/invalid/i)).toBeInTheDocument();
    });
  });
  
  it('disables submit button during loading', async () => {
    // Test that double-submit prevention works
    const api = await import('../services/api');
    api.default.post.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );
    
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    
    await userEvent.type(screen.getByLabelText(/email/i), 'test@test.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));
    
    expect(screen.getByRole('button', { name: /log in/i })).toBeDisabled();
  });
});
```

## 8.3 What to Test in Frontend

| What | Test For | Priority |
|------|----------|----------|
| Login flow | Valid/invalid credentials, loading state, error display | 🔴 High |
| Protected routes | Redirect to login when unauthenticated | 🔴 High |
| Dashboard data | Loading skeleton, error state, empty state | 🟡 Medium |
| Forms | Validation messages, submit prevention, success feedback | 🟡 Medium |
| Auth context | Login sets user, logout clears user, token refresh | 🔴 High |

---

# 9️⃣ Test Anti-Patterns — FORBIDDEN

## 9.1 Tests That Test Nothing

```python
# ❌ BANNED — no assertions
def test_get_dashboard(client, auth_headers):
    response = client.get("/api/student/dashboard", headers=auth_headers)
    # No assert — this test always passes

# ✅ REQUIRED — meaningful assertions
def test_get_dashboard(client, auth_headers):
    response = client.get("/api/student/dashboard", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "attendance_rate" in data
    assert 0 <= data["attendance_rate"] <= 100
```

## 9.2 Tests That Depend on Order

```python
# ❌ BANNED — test_b relies on data created in test_a
def test_a_create_user(client):
    client.post("/api/auth/register", json={...})

def test_b_login_user(client):
    # This fails if test_a didn't run first!
    response = client.post("/api/auth/login", json={...})
```

Each test MUST be **independently runnable**. Use fixtures, not previous tests, for setup.

## 9.3 Hardcoded IDs

```python
# ❌ BANNED — ID 1 may not exist
response = client.get("/api/student/dashboard/1")

# ✅ REQUIRED — use fixture-created data
response = client.get(
    f"/api/student/dashboard/{test_student.id}",
    headers=auth_headers
)
```

## 9.4 Sleeping for Async

```python
# ❌ BANNED — flaky, slow
import time
time.sleep(2)
assert result_is_ready()

# ✅ REQUIRED — use polling or events
from tenacity import retry, stop_after_delay
@retry(stop=stop_after_delay(5))
def wait_for_result():
    assert result_is_ready()
```

---

# 🔟 Testing Checklist

Before marking a feature as complete:

- [ ] Router test: status code + response shape for happy path
- [ ] Router test: authentication required (401 without token)
- [ ] Router test: role enforcement (403 for wrong role)
- [ ] Router test: invalid input returns 400/422
- [ ] Service test: business logic edge cases covered
- [ ] Service test: empty data returns safe default (empty list, not error)
- [ ] Model test: unique constraints enforced
- [ ] Model test: cascade deletes work correctly
- [ ] All tests runnable independently (no shared state)
- [ ] No `time.sleep()` in tests
- [ ] No mocked database sessions
- [ ] No hardcoded IDs
- [ ] `python -m pytest tests/ -v` passes with zero failures

---

**This document is mandatory for FRAMES testing. Untested code is undeployable code.**
