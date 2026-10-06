# Pramāṇa AI - Local Development Startup Script (PowerShell)
Write-Host "=== Starting Pramāṇa AI Development Services ===" -ForegroundColor Cyan

# Check Node version
$nodeVersion = node -v
Write-Host "Using Node: $nodeVersion" -ForegroundColor Green

# Start Backend
Write-Host "Starting Backend on port 5000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

# Start Frontend
Write-Host "Starting Frontend on port 5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Services started! Frontend: http://localhost:5173 | Backend: http://localhost:5000/api/health" -ForegroundColor Green
