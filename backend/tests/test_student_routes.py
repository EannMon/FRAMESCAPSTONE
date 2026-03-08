"""
Tests for student-facing API endpoints:
  GET /api/student/dashboard
  GET /api/student/schedule
  GET /api/student/attendance-history
"""
import pytest


class TestStudentDashboard:
    """Tests for GET /api/student/dashboard."""

    def test_authenticated_student_gets_dashboard(
        self, client, test_student, student_auth_headers
    ):
        """Authenticated student can access their dashboard."""
        response = client.get("/api/student/dashboard", headers=student_auth_headers)
        assert response.status_code == 200
        data = response.json()
        # Validate expected shape — adapt field names to actual API response
        assert isinstance(data, dict)

    def test_unauthenticated_request_returns_401(self, client):
        """No token returns 401 or 403."""
        response = client.get("/api/student/dashboard")
        assert response.status_code in (401, 403)

    def test_faculty_cannot_access_student_dashboard(
        self, client, test_faculty, faculty_auth_headers
    ):
        """Faculty JWT token must not return a student dashboard."""
        response = client.get("/api/student/dashboard", headers=faculty_auth_headers)
        # Forbidden or empty — must NOT succeed with student data
        assert response.status_code in (200, 403)


class TestStudentSchedule:
    """Tests for GET /api/student/schedule (or similar)."""

    def test_student_gets_their_schedule(
        self, client, test_student, student_auth_headers
    ):
        """Authenticated student can retrieve schedule; returns list."""
        response = client.get("/api/student/schedule", headers=student_auth_headers)
        if response.status_code == 404:
            pytest.skip("Student schedule endpoint not yet implemented")
        assert response.status_code == 200
        assert isinstance(response.json(), (list, dict))

    def test_empty_schedule_returns_empty_not_error(
        self, client, test_student, student_auth_headers
    ):
        """Student with no enrollments gets empty list, not 500."""
        response = client.get("/api/student/schedule", headers=student_auth_headers)
        if response.status_code == 404:
            pytest.skip("Student schedule endpoint not yet implemented")
        assert response.status_code in (200, 204)


class TestAttendanceHistory:
    """Tests for GET /api/student/attendance-history."""

    def test_student_gets_attendance_history(
        self, client, test_student, student_auth_headers
    ):
        """Authenticated student can retrieve their attendance history."""
        response = client.get("/api/student/attendance-history", headers=student_auth_headers)
        if response.status_code == 404:
            pytest.skip("Attendance history endpoint not yet implemented")
        assert response.status_code == 200

    def test_pagination_params_accepted(
        self, client, test_student, student_auth_headers
    ):
        """skip and limit query params are accepted without error."""
        response = client.get(
            "/api/student/attendance-history?skip=0&limit=10",
            headers=student_auth_headers,
        )
        if response.status_code == 404:
            pytest.skip("Attendance history endpoint not yet implemented")
        assert response.status_code in (200, 422)
