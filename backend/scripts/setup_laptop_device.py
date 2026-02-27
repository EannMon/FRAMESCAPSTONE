"""
Setup Laptop Device Script
Registers (or updates) the current laptop as a kiosk device in room 306.
Run once before using test_laptop.py or main_kiosk.py on your laptop.

Usage:
    cd backend
    python scripts/setup_laptop_device.py
    python scripts/setup_laptop_device.py --room "Lab 201"   # Override room
"""
import sys
import os
import socket
import argparse

# Add parent directory for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import SessionLocal
from models.device import Device, DeviceStatus


def get_local_ip() -> str:
    """Get local IP address of this machine."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.connect(("8.8.8.8", 80))
        ip = sock.getsockname()[0]
        sock.close()
        return ip
    except Exception:
        return "127.0.0.1"


def setup_device(room: str = "306", device_name: str = None) -> int:
    """
    Register or update laptop as a kiosk device for the given room.

    Args:
        room: Room name/number to assign (default: "306")
        device_name: Friendly device name (auto-generated if None)

    Returns:
        Device ID from database
    """
    if device_name is None:
        hostname = socket.gethostname()
        device_name = f"LAPTOP-{hostname}-{room}"

    ip_address = get_local_ip()

    print("\n" + "=" * 60)
    print("   FRAMES - Laptop Device Setup")
    print("=" * 60)

    db = SessionLocal()

    try:
        # Check if a device already exists with this name
        existing = db.query(Device).filter(Device.device_name == device_name).first()

        if existing:
            # Update existing device
            existing.room = room
            existing.ip_address = ip_address
            existing.status = DeviceStatus.ACTIVE
            db.commit()
            db.refresh(existing)

            print(f"\n✅ Updated existing device:")
            print(f"   Device ID:   {existing.id}")
            print(f"   Device Name: {existing.device_name}")
            print(f"   Room:        {existing.room}")
            print(f"   IP:          {existing.ip_address}")
            print(f"   Status:      {existing.status.value}")
            print(f"\n   Set environment: DEVICE_ID={existing.id}")
            return existing.id

        # Also check if any device is already assigned to this room
        room_device = db.query(Device).filter(Device.room == room).first()

        if room_device:
            # Update the room device to this laptop
            room_device.ip_address = ip_address
            room_device.device_name = device_name
            room_device.status = DeviceStatus.ACTIVE
            db.commit()
            db.refresh(room_device)

            print(f"\n✅ Updated device for room {room}:")
            print(f"   Device ID:   {room_device.id}")
            print(f"   Device Name: {room_device.device_name}")
            print(f"   Room:        {room_device.room}")
            print(f"   IP:          {room_device.ip_address}")
            print(f"   Status:      {room_device.status.value}")
            print(f"\n   Set environment: DEVICE_ID={room_device.id}")
            return room_device.id

        # Create new device
        new_device = Device(
            room=room,
            ip_address=ip_address,
            device_name=device_name,
            status=DeviceStatus.ACTIVE,
            room_capacity=40
        )

        db.add(new_device)
        db.commit()
        db.refresh(new_device)

        print(f"\n✅ Created new device:")
        print(f"   Device ID:   {new_device.id}")
        print(f"   Device Name: {new_device.device_name}")
        print(f"   Room:        {new_device.room}")
        print(f"   IP:          {new_device.ip_address}")
        print(f"   Status:      {new_device.status.value}")
        print(f"\n   Set environment: DEVICE_ID={new_device.id}")
        return new_device.id

    except Exception as e:
        db.rollback()
        print(f"\n❌ Failed to setup device: {e}")
        import traceback
        traceback.print_exc()
        return 0

    finally:
        db.close()
        print("=" * 60)


def main():
    parser = argparse.ArgumentParser(description="Register laptop as a kiosk device")
    parser.add_argument("--room", default="306", help="Room to assign (default: 306)")
    parser.add_argument("--name", default=None, help="Device name (auto-generated if omitted)")
    args = parser.parse_args()

    device_id = setup_device(room=args.room, device_name=args.name)

    if device_id:
        print(f"\n💡 To run the kiosk with this device:")
        print(f"   $env:DEVICE_ID=\"{device_id}\"; $env:DEVICE_ROOM=\"{args.room}\"; python rpi/main_kiosk.py")
        print(f"   OR")
        print(f"   python rpi/main_kiosk.py --device-id {device_id}")


if __name__ == "__main__":
    main()
