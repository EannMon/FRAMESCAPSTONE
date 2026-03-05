"""
Support Tickets Router - Endpoints for submitting and managing help desk tickets.
Supports file uploads (1 PDF or up to 3 JPGs as evidence).
"""
import os
import logging
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from db.database import get_db
from core.errors import api_error
from models.support_ticket import SupportTicket, TicketStatus
from models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()

# Max file sizes
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB per file
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png"}
ALLOWED_PDF_TYPES = {"application/pdf"}
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "tickets")


@router.post("/support-tickets")
async def create_support_ticket(
    user_id: int = Form(...),
    subject: str = Form(...),
    message: str = Form(...),
    files: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
):
    """
    Submit a support ticket with optional evidence files.
    Accepts up to 3 JPG images OR 1 PDF file.
    """
    if not subject.strip():
        raise api_error(400, "MISSING_SUBJECT", "Subject is required")
    if not message.strip():
        raise api_error(400, "MISSING_MESSAGE", "Message is required")

    # Validate user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise api_error(404, "USER_NOT_FOUND", "User not found")

    # Validate files
    saved_paths = []
    if files and len(files) > 0 and files[0].filename:
        # Determine file type category
        has_pdf = any(f.content_type in ALLOWED_PDF_TYPES for f in files if f.filename)
        has_images = any(f.content_type in ALLOWED_IMAGE_TYPES for f in files if f.filename)

        if has_pdf and has_images:
            raise api_error(400, "MIXED_FILE_TYPES", "Upload either images or a PDF, not both")

        if has_pdf and sum(1 for f in files if f.filename and f.content_type in ALLOWED_PDF_TYPES) > 1:
            raise api_error(400, "TOO_MANY_PDFS", "Only 1 PDF file is allowed")

        image_count = sum(1 for f in files if f.filename and f.content_type in ALLOWED_IMAGE_TYPES)
        if image_count > 3:
            raise api_error(400, "TOO_MANY_IMAGES", "Maximum 3 image files allowed")

        # Create upload directory
        ticket_dir = os.path.join(UPLOAD_DIR, str(user_id), str(uuid.uuid4().hex[:8]))
        os.makedirs(ticket_dir, exist_ok=True)

        for file in files:
            if not file.filename:
                continue

            # Validate type
            if file.content_type not in ALLOWED_IMAGE_TYPES and file.content_type not in ALLOWED_PDF_TYPES:
                raise api_error(400, "INVALID_FILE_TYPE", f"File type '{file.content_type}' is not allowed. Use JPG, PNG, or PDF.")

            # Validate size
            contents = await file.read()
            if len(contents) > MAX_FILE_SIZE:
                raise api_error(400, "FILE_TOO_LARGE", f"File '{file.filename}' exceeds 5MB limit")

            # Save file
            safe_name = f"{uuid.uuid4().hex[:8]}_{file.filename.replace(' ', '_')}"
            file_path = os.path.join(ticket_dir, safe_name)
            with open(file_path, "wb") as f:
                f.write(contents)

            # Store relative path from uploads dir
            saved_paths.append(os.path.relpath(file_path, os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")))

    # Create ticket
    ticket = SupportTicket(
        user_id=user_id,
        subject=subject.strip(),
        message=message.strip(),
        status=TicketStatus.OPEN,
        evidence_files=",".join(saved_paths) if saved_paths else None,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    logger.info("Support ticket created: id=%d user_id=%d subject='%s' files=%d", ticket.id, user_id, subject, len(saved_paths))

    return {
        "success": True,
        "ticket_id": ticket.id,
        "status": ticket.status.value if ticket.status else "OPEN",
        "message": "Support ticket submitted successfully",
    }


@router.get("/support-tickets")
def get_user_tickets(
    user_id: int = Query(...),
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    """Get all support tickets for a specific user, paginated."""
    limit = min(limit, 50)

    tickets = (
        db.query(SupportTicket)
        .filter(SupportTicket.user_id == user_id)
        .order_by(SupportTicket.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    total = db.query(func.count(SupportTicket.id)).filter(SupportTicket.user_id == user_id).scalar()

    return {
        "items": [
            {
                "id": t.id,
                "subject": t.subject,
                "message": t.message,
                "status": t.status.value if t.status else "OPEN",
                "evidence_files": t.evidence_files.split(",") if t.evidence_files else [],
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in tickets
        ],
        "total": total,
        "skip": skip,
        "limit": limit,
    }
