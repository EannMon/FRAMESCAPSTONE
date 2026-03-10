from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class InviteSendRequest(BaseModel):
    emails: List[EmailStr]
    department_id: int

class InviteValidateResponse(BaseModel):
    email: str
    department_id: int
    department_name: str
    valid: bool
    message: Optional[str] = None

class InviteInfo(BaseModel):
    id: int
    email: str
    department_id: int
    used: bool
    created_at: datetime
    expires_at: datetime

    class Config:
        from_attributes = True
