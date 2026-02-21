# FRAMES System Setup & Developer Guide

## 1. Cloning the Repository

Since the code is currently on the `main` branch, use the following commands to clone:

```bash
# Clone the repository
git clone https://github.com/EannMon/FRAMESCAPSTONE.git

# Navigate into the project directory
cd FRAMESCAPSTONE
```

---

## 2. Backend Setup

The backend is built with **FastAPI** and uses **PostgreSQL**.

### 2.1. Prerequisites

- Python 3.10 or higher
- PostgreSQL (Aiven credentials provided below)

### 2.2. Installation

1.  Navigate to the backend directory:

    ```bash
    cd backend
    ```

2.  Create a virtual environment (recommended):

    ```bash
    python -m venv venv

    # Activate on Windows:
    .\venv\Scripts\activate

    # Activate on Mac/Linux:
    source venv/bin/activate
    ```

3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

### 2.3. Environment Configuration

Create a `.env` file in the `backend/` directory and add the following:

```ini
DATABASE_URL=see ur .env
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 2.4. Running the Server

```bash
uvicorn main:app --host 0.0.0.0 --port 5000 --reload
```

The API will be available at `http://localhost:5000`.
API Documentation: `http://localhost:5000/docs`.

---

## 3. Frontend Setup

The frontend is built with **React** (Vite). It uses **concurrently** to run both the frontend and backend servers with a single command.

### 3.1. Prerequisites

- Node.js 18 or higher
- npm

### 3.2. Installation

1.  Navigate to the frontend directory:

    ```bash
    cd frontend
    ```

2.  Install Node.js dependencies (includes `concurrently` for running both servers):
    ```bash
    npm install
    ```

### 3.3. Running the Development Servers

To start **both** the frontend and backend simultaneously:

```bash
npm run dev
```

This will launch:
- **Frontend** (Vite) on `http://localhost:3000`
- **Backend** (FastAPI/Uvicorn) on `http://localhost:5000`

Both servers run in the same terminal, with color-coded output:
- **Cyan** `[FRONTEND]` — Vite dev server logs
- **Yellow** `[BACKEND]` — Uvicorn/FastAPI logs

> **Note:** The backend virtual environment (`backend/venv`) must already be set up before running this command. See [Section 2](#2-backend-setup) for backend setup.

#### Running Servers Individually

If you need to run only one server:

```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend
```

---

## 4. DBeaver (Database) Setup

Use DBeaver to visually manage the PostgreSQL database hosted on Aiven.

### 4.1. Connection Details

| Field             | Value               |
| ----------------- | ------------------- |
| **Database Type** | PostgreSQL          |
| **Host**          | `check our discord` |
| **Port**          | `check our discord` |
| **Database**      | `check our discord` |
| **User**          | `check our discord` |
| **Password**      | `check our discord` |

### 4.2. SSL Configuration in DBeaver

1.  Open DBeaver and start a **New Database Connection**.
2.  Select **PostgreSQL**.
3.  Fill in the **Main** tab with the Host, Port, Database, User, and Password from above.
4.  Go to the **SSL** tab within the connection settings:
    - **Use SSL**: Check this box.
    - **SSL Mode**: Select `require`.
    - **CA Certificate**: If you have the `ca.pem` file, upload it here.
      _(Note: If you don't have the file handy, `require` mode often usually automatically accepts the server certificate, but for best security or if connection fails, download the CA cert from the Aiven console)._
5.  Click **Test Connection**.
6.  If successful, click **Finish**.

You should now see the `defaultdb` database and its tables (e.g., `users`, `classes`, `attendance_logs`) in the sidebar.

---

## 5. Raspberry Pi Kiosk Setup

The RPi4 runs the face recognition kiosk. **Full step-by-step guide:** see [`backend/rpi/README.md`](backend/rpi/README.md).

### 5.1. Hardware Required

| Component | Specification |
|-----------|---------------|
| Board | Raspberry Pi 4 Model B (4GB RAM) |
| OS | Raspberry Pi OS **Bookworm** 64-bit (aarch64) |
| Camera | RPi Camera V2 (8MP, Sony IMX219) |
| Cable | 150mm CSI flex cable |
| Display | 7" HDMI IPS (1024×600), USB touch |

### 5.2. SSH Into the Pi From Your Laptop

Once the Pi is on the same WiFi as your laptop and SSH is enabled:

```bash
# From your laptop terminal (PowerShell on Windows):
ssh emma@<PI_IP_ADDRESS>

# Example:
ssh emma@10.244.181.134
```

Find the Pi's IP by running `hostname -I` on the Pi's 7" screen. First-time connection asks to confirm — type `yes`.

> **GUI commands via SSH** must be prefixed with `DISPLAY=:0` to route windows to the 7" display:
> ```bash
> DISPLAY=:0 python rpi/test_laptop.py
> ```

### 5.3. Quick Setup Summary (Run on Pi via SSH)

```bash
# 1. Enable camera + SSH via raspi-config
sudo raspi-config

# 2. Install system packages (these MUST come from apt, NOT pip)
sudo apt update && sudo apt install -y \
  python3-picamera2 python3-opencv python3-venv \
  libatlas-base-dev libopenblas-dev libhdf5-dev

# 3. Create venv WITH system packages (critical for picamera2 + opencv)
python3 -m venv --system-site-packages ~/frames_env
source ~/frames_env/bin/activate

# 4. Install pip packages (order matters)
pip install numpy==1.26.4          # MUST be 1.26.4 — see warning below
pip install mediapipe requests
pip install onnxruntime insightface

# 5. Copy kiosk code from laptop
# (from laptop terminal, NOT from Pi)
scp -r backend/rpi/ emma@<PI_IP>:~/frames/rpi/

# 6. Create .env on Pi
echo "API_BASE_URL=http://<LAPTOP_IP>:5000" > ~/frames/.env

# 7. Run test (from SSH with DISPLAY=:0 for GUI output to 7" screen)
cd ~/frames
DISPLAY=:0 python rpi/test_laptop.py
```

### 5.4. Critical Dependency Warnings

| ⚠️ Rule | Why |
|---------|-----|
| **Never `pip install numpy`** (gets 2.x) | Breaks picamera2's simplejpeg C ABI — import crash |
| **Always `pip install numpy==1.26.4`** | Compatible with both scipy/insightface AND picamera2 |
| **Never `pip install opencv-python`** | Builds without GTK — `cv2.imshow()` crashes |
| **Use system OpenCV** from `python3-opencv` apt | Has GTK/Wayland support for display output |
| **venv must use `--system-site-packages`** | So pip packages can see apt packages (picamera2, opencv) |
| **Use `DISPLAY=:0`** when running via SSH | SSH has no display server — routes GUI to the 7" screen |

> For the full 10-phase guide with troubleshooting, see [`backend/rpi/README.md`](backend/rpi/README.md).

---

## Quick Reference: Commands

| Command | What It Does | Ports |
|---------|-------------|-------|
| `npm run dev` | Starts **both** frontend + backend | 3000 + 5000 |
| `npm run dev:frontend` | Starts frontend only (Vite) | 3000 |
| `npm run dev:backend` | Starts backend only (Uvicorn) | 5000 |
| `npm run build` | Builds frontend for production | — |

> All commands should be run from the `frontend/` directory.
| RPi Kiosk | `DISPLAY=:0 python rpi/main_kiosk.py` | — |
| RPi Test | `DISPLAY=:0 python rpi/test_laptop.py` | — |
