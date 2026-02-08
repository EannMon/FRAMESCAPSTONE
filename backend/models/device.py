"""
Device Model - Represents Raspberry Pi kiosk devices deployed in rooms
"""
from sqlalchemy import Column, Integer, String, Enum, DateTime
from sqlalchemy.orm import relationship
from db.database import Base
from datetime import datetime
import enum


class DeviceStatus(enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    MAINTENANCE = "MAINTENANCE"


class Device(Base):
    __tablename__ = "devices"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    room = Column(String(100))                      # e.g., "CL1", "Lab 201"
    ip_address = Column(String(45))                 # IPv4 or IPv6
    device_name = Column(String(100))               # e.g., "KIOSK-CL1"
    status = Column(Enum(DeviceStatus), default=DeviceStatus.ACTIVE)
    room_capacity = Column(Integer, default=40)     # Max occupancy for overcrowding alerts
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    last_heartbeat = Column(DateTime)               # Last time device reported
    
    # Relationships
    attendance_logs = relationship("AttendanceLog", back_populates="device")
    
    def __repr__(self):
        return f"<Device(id={self.id}, room='{self.room}', status={self.status.value})>"
