@echo off
echo ================================
echo Starting AI Placement Prep Assistant
echo ================================
echo.

echo Starting Backend Server...
start "Backend - FastAPI" cmd /k "cd backend && venv\Scripts\activate && python main.py"

timeout /t 3 /nobreak >nul

echo Starting Frontend Server...
start "Frontend - React" cmd /k "cd frontend && npm start"

echo.
echo ================================
echo Servers are starting...
echo ================================
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Close the terminal windows to stop servers.
echo.
