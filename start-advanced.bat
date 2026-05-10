@echo off
REM Smart Warehouse - Advanced Startup Script
REM This script starts both servers and handles setup

setlocal enabledelayedexpansion

echo.
echo ============================================
echo   Smart Warehouse - Advanced Startup
echo ============================================
echo.

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found!
    echo Install from: https://www.python.org/
    pause
    exit /b 1
)

REM Check if backend requirements are installed
echo [SETUP] Checking dependencies...
python -c "import flask" >nul 2>&1
if errorlevel 1 (
    echo [SETUP] Installing backend dependencies...
    cd backend
    pip install -r requirements.txt
    cd ..
)

echo [SETUP] Dependencies OK
echo.

REM Kill any existing services on ports 5000 and 8000
echo [CLEANUP] Checking for processes on ports 5000 and 8000...
taskkill /F /IM python.exe >nul 2>&1

echo.
echo ============================================
echo   Starting Services...
echo ============================================
echo.

REM Start backend
echo [1/2] Starting Backend (Flask) on port 5000...
start "Smart Warehouse - Backend" cmd /k "cd backend && python app.py"

REM Wait for backend to initialize
echo         Waiting for backend to start...
timeout /t 3 /nobreak

REM Start frontend
echo [2/2] Starting Frontend (HTTP) on port 8000...
start "Smart Warehouse - Frontend" cmd /k "cd frontend && python -m http.server 8000"

REM Wait for frontend to initialize
echo         Waiting for frontend to start...
timeout /t 2 /nobreak

echo.
echo ============================================
echo   ✓ Smart Warehouse is Running!
echo ============================================
echo.
echo Services:
echo   [✓] Backend API:  http://localhost:5000/api
echo   [✓] Frontend:     http://localhost:8000
echo   [✓] Login Page:   http://localhost:8000/pages/login.html
echo.
echo Opening login page in browser...
echo.

REM Open in browser
start http://localhost:8000/pages/login.html

echo Browser opened!
echo.
echo To stop:
echo   - Close the command windows, or
echo   - Press Ctrl+C in each window
echo.
echo Logs:
echo   Backend: Check the Backend window
echo   Frontend: Check the Frontend window
echo.
pause
