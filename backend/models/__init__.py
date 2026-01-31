# Models package - Import all models for easy access
from models.department import Department
from models.program import Program
from models.user import User, UserRole, VerificationStatus
from models.facial_profile import FacialProfile
from models.subject import Subject
from models.class_ import Class
from models.enrollment import Enrollment
from models.device import Device, DeviceStatus
from models.attendance_log import AttendanceLog, AttendanceAction, VerifiedBy

__all__ = [
    "Department",
    "Program", 
    "User",
    "UserRole",
    "VerificationStatus",
    "FacialProfile",
    "Subject",
    "Class",
    "Enrollment",
    "Device",
    "DeviceStatus",
    "AttendanceLog",
    "AttendanceAction",
    "VerifiedBy",
]
