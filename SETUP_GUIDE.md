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

The frontend is built with **React** (Vite).

### 3.1. Installation

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```

2.  Install Node.js dependencies:
    ```bash
    npm install
    ```

### 3.2. Running the Client

```bash
npm run dev
```
The application will be accessible at `http://localhost:3000` (or whatever port Vite assigns).

---

## 4. DBeaver (Database) Setup

Use DBeaver to visually manage the PostgreSQL database hosted on Aiven.

### 4.1. Connection Details

| Field | Value |
|-------|-------|
| **Database Type** | PostgreSQL |
| **Host** | `check our discord` |
| **Port** | `check our discord` |
| **Database** | `check our discord` |
| **User** | `check our discord` |
| **Password** | `check our discord` |

### 4.2. SSL Configuration in DBeaver

1.  Open DBeaver and start a **New Database Connection**.
2.  Select **PostgreSQL**.
3.  Fill in the **Main** tab with the Host, Port, Database, User, and Password from above.
4.  Go to the **SSL** tab within the connection settings:
    -   **Use SSL**: Check this box.
    -   **SSL Mode**: Select `require`.
    -   **CA Certificate**: If you have the `ca.pem` file, upload it here. 
        *(Note: If you don't have the file handy, `require` mode often usually automatically accepts the server certificate, but for best security or if connection fails, download the CA cert from the Aiven console).*
5.  Click **Test Connection**.
6.  If successful, click **Finish**.

You should now see the `defaultdb` database and its tables (e.g., `users`, `classes`, `attendance_logs`) in the sidebar.

---

## Quick Reference: Commands

| Component | Command | Port |
|-----------|---------|------|
| Backend |`uvicorn main:app --reload --port 5000`| 5000 |
| Frontend | `npm run dev` | 3000 |
