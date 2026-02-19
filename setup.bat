@echo off
echo ================================
echo AI Placement Prep Assistant Setup
echo ================================
echo.

:: Check Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python not found! Please install Python 3.8+ from python.org
    pause
    exit /b 1
)
echo [OK] Python found

:: Check Node
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found! Please install Node.js from nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js found
echo.

:: Setup Backend
echo ================================
echo Setting up BACKEND...
echo ================================
cd backend

echo Creating virtual environment...
python -m venv venv
if %errorlevel% neq 0 (
    echo [ERROR] Failed to create virtual environment
    pause
    exit /b 1
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing Python dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo Setting up environment file...
if not exist .env (
    copy .env.example .env
    echo [IMPORTANT] Please edit backend\.env and add your OpenAI API key!
    echo Get your key from: https://platform.openai.com/api-keys
)

cd ..
echo.

:: Setup Frontend
echo ================================
echo Setting up FRONTEND...
echo ================================
cd frontend

echo Installing Node dependencies...
npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install npm packages
    pause
    exit /b 1
)

cd ..
echo.

:: Success
echo ================================
echo Setup Complete! 
echo ================================
echo.
echo NEXT STEPS:
echo 1. Edit backend\.env and add your OpenAI API key
echo 2. Run start_servers.bat to start the application
echo.
echo Or manually:
echo   Terminal 1: cd backend ^&^& venv\Scripts\activate ^&^& python main.py
echo   Terminal 2: cd frontend ^&^& npm start
echo.
pause
