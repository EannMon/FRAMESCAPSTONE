# Changelog & Known Issues

## Recent Fixes (January 31, 2026)

### Backend
-   **Password Hashing**: Implemented input truncation (max 72 bytes) for `bcrypt` hashing in `api/routers/faculty.py` and `api/routers/auth.py` to prevent `ValueError`.
-   **Dependencies**: Removed conflicting `passlib` dependency from `requirements.txt` as `bcrypt` is now used directly.
-   **API Status Codes**: Updated `/upload-schedule` endpoint to explicitly return `201 Created` to match standard REST practices and frontend expectations.

### Frontend
-   **Data Mapping**: Updated `MyClassesPage.jsx` to map backend response fields correctly:
    -   `schedule_id` -> `id`
    -   `course_code` -> `subject_code`
    -   `title` -> `subject_title`
    -   `room_name` -> `room`
-   **Error Handling**: Improved success check in `handleUpload` to accept both `200 OK` and `201 Created` status codes, preventing false "Failed" error messages.

## Known Issues

1.  **Success Message Visibility**: warning
    -   Top priority: Upon successful upload of a schedule, the "Course Created Successfully" message may not be displaying prominently or as expected, even though the operation succeeds.
