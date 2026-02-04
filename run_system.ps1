Write-Host "Starting FRAMES System..." -ForegroundColor Green

# Start Backend
Write-Host "Launching Backend..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; if (Test-Path .venv) { Write-Host 'Activating venv...'; .\venv\Scripts\activate } else { Write-Warning 'No .venv folder found in backend!' }; Write-Host 'Starting Uvicorn Server...'; uvicorn main:app --host 0.0.0.0 --port 5000 --reload"

# Start Frontend
Write-Host "Launching Frontend..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; Write-Host 'Starting Vite Dev Server...'; npm run dev"

Write-Host "Done! Check the two new PowerShell windows." -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:5000"
Write-Host "Frontend UI: http://localhost:5173 (or similar)"
