@echo off
REM Smart Warehouse - Startup Script (Fixed Version)
REM This script starts both backend and frontend servers with proper paths

setlocal enabledelayedexpansion

echo.
echo ============================================
echo   Smart Warehouse - Starting Services
echo ============================================
echo.

REM Get the absolute path where this script is located
for /f "delims=" %%A in ('cd') do set SCRIPT_DIR=%%A
echo Project Directory: %SCRIPT_DIR%
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

echo [1/3] Checking files...
if not exist "%SCRIPT_DIR%\backend\app.py" (
    echo ERROR: Backend app.py not found at %SCRIPT_DIR%\backend\
    pause
    exit /b 1
)

if not exist "%SCRIPT_DIR%\frontend\index.html" (
    echo ERROR: Frontend files not found at %SCRIPT_DIR%\frontend\
    pause
    exit /b 1
)

echo [OK] All files found
echo.

echo [2/3] Starting Backend Server...
echo.
start "Smart Warehouse Backend" cmd /k "cd /d "%SCRIPT_DIR%\backend" && python app.py"
echo Backend started - waiting 3 seconds...
timeout /t 3 /nobreak
echo.

echo [3/3] Starting Frontend Server...
echo.
start "Smart Warehouse Frontend" cmd /k "cd /d "%SCRIPT_DIR%\frontend" && python -m http.server 8000"
echo Frontend started - waiting 2 seconds...
timeout /t 2 /nobreak
echo.

echo.
echo ============================================
echo   ✓ Services Started Successfully!
echo ============================================
echo.
echo IMPORTANT - Use these URLs:
echo.
echo   Home:         http://localhost:8000/index.html
echo   Login Page:   http://localhost:8000/pages/login.html
echo   Register:     http://localhost:8000/pages/register.html
echo   Dashboard:    http://localhost:8000/pages/dashboard.html
echo   Backend API:  http://localhost:5000/api
echo.
echo Opening browser...
timeout /t 1
start http://localhost:8000/index.html
echo.
echo.
echo To STOP services - Close both command windows that opened
echo Or press Ctrl+C in each window
echo.
pause
