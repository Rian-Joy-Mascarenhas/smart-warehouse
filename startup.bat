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

REM Start Frontend FROM PROJECT ROOT (this is the key!)
echo Starting Frontend Server on port 8000...
start "Smart Warehouse Frontend" cmd /k "python -m http.server 8000"

REM Wait for servers to start
timeout /t 2 /nobreak

REM Open browser
echo Opening browser...
start http://localhost:8000/frontend/index.html

echo.
echo ============================================
echo   SERVERS RUNNING SUCCESSFULLY!
echo ============================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:8000/frontend/
echo Login:    http://localhost:8000/frontend/pages/login.html
echo.
echo To stop: Close the command windows that opened
echo.
pause