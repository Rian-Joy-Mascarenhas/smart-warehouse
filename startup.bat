@echo off
echo Starting Smart Warehouse System...
echo.
echo Opening 2 terminals for:
echo 1. Backend (Flask)
echo 2. Frontend (HTTP Server)
echo.
echo Note: MongoDB is running in the cloud (Atlas)
echo.

REM Terminal 1 - Backend
start cmd /k "cd backend && venv\Scripts\activate && python app.py"

REM Terminal 2 - Frontend
start cmd /k "cd frontend && python -m http.server 8000"

echo.
echo Services started!
echo.
echo Access the website at: http://localhost:8000/index.html
echo API Documentation: http://localhost:5000/api/docs
echo.
pause