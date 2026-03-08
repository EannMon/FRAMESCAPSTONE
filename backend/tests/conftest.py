"""
Shared test fixtures for FRAMES backend tests.
Uses SQLite in-memory database — no live Aiven/PostgreSQL connection needed.
Each test gets a fresh, isolated database via function-scoped fixtures.
"""
import pytest
import bcrypt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from db.database import Base, get_db
from main import app

# In-memory SQLite — fast and isolated for unit tests
TEST_DATABASE_URL = "sqlite:///./test_frames.db"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _hash_password(password: str) -> str:
    """Hash a password using bcrypt (matches production hash_password function)."""
    return bcrypt.hashpw(password.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")


@pytest.fixture(scope="function")
def db_session():
    """
    Provide a fresh database session for each test.
    Tables are created before and dropped after each test to ensure isolation.
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
    FastAPI TestClient with the real database replaced by the test SQLite DB.
    Clears dependency overrides after each test.
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


# ─────────────────────────────────────────
# Shared entity fixtures
# ─────────────────────────────────────────

@pytest.fixture
def test_department(db_session):
    """Create a minimal test department."""
    from models.department import Department
    dept = Department(name="Computer Engineering Department", code="CED")
    db_session.add(dept)
    db_session.commit()
    db_session.refresh(dept)
    return dept


@pytest.fixture
def test_admin(db_session, test_department):
    """Create a verified ADMIN user for testing."""
    from models.user import User, UserRole, VerificationStatus
    user = User(
        tupm_id="TUPM-00-0000",
        email="admin@test.tupm.edu.ph",
        password_hash=_hash_password("testpassword"),
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
    """Create a verified FACULTY user for testing."""
    from models.user import User, UserRole, VerificationStatus
    user = User(
        employee_id="EMP-0001",
        email="faculty@test.tupm.edu.ph",
        password_hash=_hash_password("testpassword"),
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
    """Create a verified STUDENT user for testing."""
    from models.user import User, UserRole, VerificationStatus
    user = User(
        tupm_id="TUPM-21-1001",
        email="student@test.tupm.edu.ph",
        password_hash=_hash_password("testpassword"),
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
def faculty_auth_headers(client, test_faculty):
    """Return Authorization header with a valid faculty JWT token."""
    response = client.post("/api/auth/login", json={
        "identifier": "faculty@test.tupm.edu.ph",
        "password": "testpassword",
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def student_auth_headers(client, test_student):
    """Return Authorization header with a valid student JWT token."""
    response = client.post("/api/auth/login", json={
        "identifier": "student@test.tupm.edu.ph",
        "password": "testpassword",
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_auth_headers(client, test_admin):
    """Return Authorization header with a valid admin JWT token."""
    response = client.post("/api/auth/login", json={
        "identifier": "admin@test.tupm.edu.ph",
        "password": "testpassword",
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
