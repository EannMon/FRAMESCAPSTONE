# Raspberry Pi Kiosk Sync Troubleshooting Guide

This guide details the steps taken to resolve synchronization issues between the laptop backend and the Raspberry Pi kiosk server, specifically addressing the `fatal: not a git repository` error and the [EnrolledUserInfo](file:///c:/Users/iska/.gemini/antigravity/scratch/FRAMESCAPSTONE/backend/api/routers/kiosk.py#96-104) Pydantic validation error.

## 1. Laptop Setup & Git Synchronization
Before the Raspberry Pi could receive updates, the local laptop needed to push any cached files or pending updates to GitHub.

**Commands executed on the laptop:**
```bash
# Add any locally modified files to staging
git add .

# Commit changes with a message describing what was done
git commit -m "Update cache files, add RPi setup docs and test scripts"

# Push changes to the remote branch on GitHub
git push origin feature-backend-update
```

## 2. Fixing the "Not a Git Repository" error on Raspberry Pi
The error `fatal: not a git repository` occurs when the project files on the Raspberry Pi were copied manually (e.g., via ZIP or USB) rather than being cloned using `git clone`. Because the folder wasn't set up as a Git repository, it couldn't "pull" updates from the remote.

To fix this, the folder needed to be initialized and linked to the GitHub repository:

**Commands executed on the Raspberry Pi (in Terminal 1):**
```bash
# Navigate to the correct folder
cd ~/frames

# Initialize the folder as a Git repository
git init

# Link it to the remote GitHub repository
git remote add origin https://github.com/EannMon/FRAMESCAPSTONE.git

# Fetch the latest branch information from GitHub
git fetch origin

# Force the folder to exactly match the target branch (this preserves the 'venv' folder if it is in .gitignore)
git reset --hard origin/feature-backend-update
```

## 3. Fixing the Backend Pydantic ValidationError
The backend server (and `kiosk_server.py`) crashed during testing with a `ValidationError for EnrolledUserInfo`. It expected every student or faculty to have an `email` string, but some older or test database records had a `NULL` (None) email.

**Fix Applied:**
Modified [backend/api/routers/kiosk.py](file:///c:/Users/iska/.gemini/antigravity/scratch/FRAMESCAPSTONE/backend/api/routers/kiosk.py) to make the email optional using Python's `Optional[str]`:
```python
class EnrolledUserInfo(BaseModel):
    """Info about a user enrolled in a class."""
    user_id: int
    name: str
    email: Optional[str] = None # <-- Make email optional to handle NULL values
    tupm_id: str
    role: str
    section: Optional[str] = None
```

After modifying the file, I added, committed, and pushed these exact changes again using the same Git commands shown in **Step 1**, so that the Raspberry Pi could pull a working backend.

## 4. Running the System
Once the code was updated both locally and on the Raspberry Pi, the kiosk could be started with the correct environment variables.

**Commands executed on the Raspberry Pi:**

**Terminal 1 (Start Server):**
```bash
cd ~/frames
source venv/bin/activate
export BACKEND_URL=http://10.221.24.164:5000
export USE_PICAMERA2=0
export CAMERA_INDEX=0
python rpi/kiosk_server.py
```

**Terminal 2 (Open UI):**
```bash
DISPLAY=:0 chromium-browser --kiosk --disable-gpu --no-sandbox --disable-features=WebRTC http://10.221.24.164:3000/kiosk > /dev/null &
```

> **Note on Database Database Data:** The database contents (via DBeaver) were skipped in this flush, meaning the old schema or values might still persist on the laptop server depending on connection configurations. This guide strictly documents codebase synchronization.
