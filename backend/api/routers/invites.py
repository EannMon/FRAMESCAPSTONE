from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from db.database import get_db
from models.user import User, UserRole
from models.department import Department
from models.user_invite import UserInvite
from schemas.invite import InviteSendRequest, InviteInfo, InviteValidateResponse
from core.auth import create_faculty_invite_token, verify_faculty_invite_token
from services.email_service import send_invite_email
import os

router = APIRouter(prefix="/api/invites", tags=["invites"])

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

@router.post("/send", response_model=dict)
def send_invites(
    request: InviteSendRequest,
    db: Session = Depends(get_db)
):
    """
    Send faculty invitations via email.
    """
    # Verify department exists
    dept = db.query(Department).filter(Department.id == request.department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    results = {"sent": [], "failed": []}

    for email in request.emails:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            results["failed"].append({"email": email, "reason": "User already exists"})
            continue

        # Create token
        token = create_faculty_invite_token(email, request.department_id)
        
        # Save invite to DB
        from datetime import datetime, timezone, timedelta
        invite = UserInvite(
            email=email,
            token=token,
            department_id=request.department_id,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=48)
        )
        db.add(invite)
        
        # Send email
        invite_link = f"{FRONTEND_URL}/register-faculty?token={token}"
        if send_invite_email(email, invite_link, dept.name):
            results["sent"].append(email)
        else:
            results["failed"].append({"email": email, "reason": "Email service failed"})
    
    db.commit()
    return {"message": f"Processed {len(request.emails)} invites", "results": results}

@router.get("", response_model=List[dict])
def get_invites(department_id: int, db: Session = Depends(get_db)):
    """
    Fetch all active and past faculty invitations for a department.
    """
    invites = db.query(UserInvite).filter(UserInvite.department_id == department_id).order_by(UserInvite.created_at.desc()).all()
    
    result = []
    
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    
    for invite in invites:
        # Determine current status
        if invite.used:
            status = "Registered"
        elif invite.expires_at < now:
            status = "Expired"
        else:
            status = "Pending"
            
        result.append({
            "id": invite.id,
            "email": invite.email,
            "role": invite.role,
            "status": status,
            "created_at": invite.created_at.isoformat() if invite.created_at else None,
            "expires_at": invite.expires_at.isoformat() if invite.expires_at else None,
            "used": invite.used
        })
        
    return result

@router.get("/validate", response_model=InviteValidateResponse)
def validate_invite(token: str, db: Session = Depends(get_db)):
    """
    Validate an invite token and return associated info.
    """
    try:
        payload = verify_faculty_invite_token(token)
        email = payload.get("email")
        dept_id = payload.get("dept")
        
        # Check if invite exists in DB and is not used
        invite = db.query(UserInvite).filter(
            UserInvite.token == token,
            UserInvite.used == False
        ).first()
        
        if not invite:
            return InviteValidateResponse(
                email="",
                department_id=0,
                department_name="",
                valid=False,
                message="Invite not found or already used"
            )

        # Get department name
        dept = db.query(Department).filter(Department.id == dept_id).first()
        dept_name = dept.name if dept else "Unknown"

        return InviteValidateResponse(
            email=email,
            department_id=dept_id,
            department_name=dept_name,
            valid=True
        )

    except HTTPException as e:
        return InviteValidateResponse(
            email="",
            department_id=0,
            department_name="",
            valid=False,
            message=e.detail
        )
    except Exception as e:
        return InviteValidateResponse(
            email="",
            department_id=0,
            department_name="",
            valid=False,
            message="Invalid token"
        )
