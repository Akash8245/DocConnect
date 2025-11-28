@echo off
REM DocConnect Automatic Start Script for Windows
echo Starting DocConnect application...

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: npm is not installed. Please install Node.js and npm first.
    exit /b 1
)

REM Navigate to project root directory (assuming the script is in client folder)
cd /d "%~dp0\.."
set ROOT_DIR=%CD%

REM Install dependencies if node_modules doesn't exist
echo Checking and installing dependencies...
if not exist "%ROOT_DIR%\server\node_modules\" (
    echo Installing server dependencies...
    cd /d "%ROOT_DIR%\server"
    call npm install
)

if not exist "%ROOT_DIR%\client\node_modules\" (
    echo Installing client dependencies...
    cd /d "%ROOT_DIR%\client"
    call npm install
)

REM Start the server in a new window
echo Starting server...
cd /d "%ROOT_DIR%\server"
start "DocConnect Server" cmd /c "npm run dev"

REM Wait for the server to start
echo Waiting for server to start...
timeout /t 5 /nobreak >nul

REM Start the client
echo Starting client...
cd /d "%ROOT_DIR%\client"
call npm run dev

echo DocConnect application stopped. 