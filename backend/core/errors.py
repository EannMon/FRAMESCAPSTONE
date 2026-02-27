from fastapi import HTTPException

def api_error(status_code: int, code: str, message: str, details=None):
    """Create a standardized API error response."""
    return HTTPException(
        status_code=status_code,
        detail={
            "success": False,
            "error": {
                "code": code,
                "message": message,
                "details": details,
            }
        }
    )
