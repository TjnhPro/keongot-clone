@echo off
echo Starting Kẹo Ngọt Nhỏ Xinh Local Server...
echo.
echo Please wait while the server starts...
echo.
echo Once started, open your browser and go to: http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.

REM Try Python 3 first
python -m http.server 8000 2>nul
if %errorlevel% neq 0 (
    echo Python 3 not found, trying Python 2...
    python -m SimpleHTTPServer 8000 2>nul
    if %errorlevel% neq 0 (
        echo Neither Python 3 nor Python 2 found.
        echo Please install Python or use another method to run a local server.
        echo See README-SERVER.md for more options.
        pause
    )
)
