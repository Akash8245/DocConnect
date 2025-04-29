@echo off
echo DocConnect Startup Script
echo ==============================================

:: Get the local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set IP=%%a
    goto :foundIP
)
:foundIP
set IP=%IP:~1%
echo Your IP address: %IP%
echo.

:: Kill any existing processes on ports 5001 and 5174
echo Stopping any existing servers...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /c:":5001" ^| findstr /c:"LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /c:":5174" ^| findstr /c:"LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo.

:: Start the backend server
echo Starting backend server...
start "DocConnect Backend" cmd /c "cd server && npm run dev"
echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul
echo.

:: Start the frontend server with host flag
echo Starting frontend server...
start "DocConnect Frontend" cmd /c "cd client && npx vite --host 0.0.0.0"
echo Waiting for frontend to initialize...
timeout /t 10 /nobreak >nul
echo.

echo ==============================================
echo DocConnect is now running!
echo.
echo Backend: http://localhost:5001
echo Frontend (Local): http://localhost:5174
echo Frontend (Network): http://%IP%:5174
echo.
echo Video Call URL (use this for testing): http://%IP%:5174/vc
echo.
echo QUICK TESTING INSTRUCTIONS:
echo 1. Open Chrome and Firefox (or two different browsers)
echo 2. In Browser #1: http://%IP%:5174/vc
echo 3. In Browser #2: http://%IP%:5174/vc
echo 4. They should connect automatically 
echo 5. If not, click "Force Connect" button in one of the browsers
echo.
echo Press any key to stop all servers and exit.
pause >nul

:: Kill servers when exiting
echo Stopping servers...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /c:":5001" ^| findstr /c:"LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /c:":5174" ^| findstr /c:"LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo All servers stopped. Goodbye!
timeout /t 3 >nul 