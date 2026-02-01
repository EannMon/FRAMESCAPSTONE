# Core Module

This folder is reserved for core application utilities and configuration.

## Suggested Contents

| File | Purpose |
|------|---------|
| `config.py` | Application settings (env vars, constants) |
| `security.py` | JWT tokens, authentication helpers |
| `logging.py` | Centralized logging configuration |
| `exceptions.py` | Custom exception classes |
| `dependencies.py` | Shared FastAPI dependencies |

## Example: config.py

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    class Config:
        env_file = ".env"

settings = Settings()
```

## Example: security.py

```python
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=30))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")
```
