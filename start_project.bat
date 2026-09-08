@echo off
title Spotify AI Memory System

cd /d "%~dp0"

echo ==========================================
echo    Spotify AI Memory System
echo ==========================================
echo.

echo Starting Backend...
start "Spotify Backend" cmd /k "call venv\Scripts\activate.bat && uvicorn backend.main:app --reload"

timeout /t 5 /nobreak >nul

echo Starting Frontend...
start "Spotify Frontend" cmd /k "cd frontend && npm run dev"

timeout /t 5 /nobreak >nul

echo Opening frontend...
start http://localhost:5173

echo.
echo ==========================================
echo Backend  : http://127.0.0.1:8000
echo Frontend : http://localhost:5173
echo ==========================================
echo.
pause