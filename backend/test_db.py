import sys
try:
  from db.database import SessionLocal
  from models.user import User
  db = SessionLocal()
  user = db.query(User).first()
  print(user.email if user else 'No user')
except Exception as e:
  import traceback
  traceback.print_exc()

