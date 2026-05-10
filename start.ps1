param(
    [switch]$Help
)

if ($Help) {
    Write-Host "Smart Warehouse Startup Script`n"
    Write-Host "Usage: .\start.ps1`n"
    exit
}

$projectRoot = Get-Location
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Smart Warehouse - Startup Script" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Project Root: $projectRoot`n"

# Check Python
$pythonCheck = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Python is not installed!" -ForegroundColor Red
    Write-Host "Install from: https://www.python.org/" -ForegroundColor Yellow
    pause
    exit 1
}
Write-Host "[✓] Python found: $pythonCheck" -ForegroundColor Green

# Check files exist
$backendPath = Join-Path $projectRoot "backend\app.py"
$frontendPath = Join-Path $projectRoot "frontend\index.html"

if (-not (Test-Path $backendPath)) {
    Write-Host "[✗] Backend not found at: $backendPath" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "[✓] Backend found: $backendPath" -ForegroundColor Green

if (-not (Test-Path $frontendPath)) {
    Write-Host "[✗] Frontend not found at: $frontendPath" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "[✓] Frontend found: $frontendPath" -ForegroundColor Green

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "Starting Services..." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan

# Start Backend
Write-Host "`n[1/2] Starting Backend Server on port 5000..." -ForegroundColor Yellow
$backendDir = Join-Path $projectRoot "backend"
$backendJob = Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d $backendDir && python app.py" -PassThru -WindowStyle Normal
Write-Host "      Backend PID: $($backendJob.Id)" -ForegroundColor Gray
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "[2/2] Starting Frontend Server on port 8000..." -ForegroundColor Yellow
$frontendDir = Join-Path $projectRoot "frontend"
$frontendJob = Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d $frontendDir && python -m http.server 8000" -PassThru -WindowStyle Normal
Write-Host "      Frontend PID: $($frontendJob.Id)" -ForegroundColor Gray
Start-Sleep -Seconds 2

# Display URLs
Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "✓ Smart Warehouse is Running!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "`nAccess URLs:" -ForegroundColor Yellow
Write-Host "  Home:        http://localhost:8000/index.html" -ForegroundColor White
Write-Host "  Login:       http://localhost:8000/pages/login.html" -ForegroundColor White
Write-Host "  Register:    http://localhost:8000/pages/register.html" -ForegroundColor White
Write-Host "  Dashboard:   http://localhost:8000/pages/dashboard.html" -ForegroundColor White
Write-Host "  Backend API: http://localhost:5000/api/health" -ForegroundColor White

# Open browser
Write-Host "`nOpening browser..." -ForegroundColor Yellow
Start-Sleep -Seconds 1
Start-Process "http://localhost:8000/pages/login.html"

Write-Host "`n" -ForegroundColor Gray
Write-Host "To stop services: Close the command windows or press Ctrl+C" -ForegroundColor Gray
Write-Host "`nPress any key to continue..." -ForegroundColor Gray
Read-Host
