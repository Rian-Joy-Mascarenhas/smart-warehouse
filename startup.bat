@echo off
color 0A
cls

echo.
echo ============================================
echo   SMART WAREHOUSE STARTUP
echo ============================================
echo.

REM Navigate to project root
cd /d "%~dp0"

REM Start Backend
echo Starting Backend Server on port 5000...
start "Smart Warehouse Backend" cmd /k "cd backend && python app.py"

REM Wait for backend to start
timeout /t 3 /nobreak

REM Start Frontend from frontend directory
echo Starting Frontend Server on port 8000...
start "Smart Warehouse Frontend" cmd /k "cd frontend && python -m http.server 8000"

REM Wait for servers to start
timeout /t 2 /nobreak

REM Open browser to home page
echo Opening browser...
timeout /t 1
start http://localhost:8000/index.html

echo.
echo ============================================
echo   SERVERS RUNNING SUCCESSFULLY!
echo ============================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:8000
echo Home:     http://localhost:8000/index.html
echo Login:    http://localhost:8000/pages/login.html
echo Register: http://localhost:8000/pages/register.html
echo Dashboard: http://localhost:8000/pages/dashboard.html
echo.
echo To stop: Close the command windows that opened
echo.
pause