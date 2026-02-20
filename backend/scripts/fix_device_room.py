"""Quick fix: update device room to match classes table."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import SessionLocal
from models.device import Device

db = SessionLocal()
device = db.query(Device).filter(Device.id == 1).first()
if device:
    print(f'Current room: "{device.room}"')
    device.room = "Room 306"
    db.commit()
    db.refresh(device)
    print(f'Updated room: "{device.room}"')
else:
    print("Device not found")
db.close()
