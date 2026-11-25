@echo off
chcp 65001 >nul
title CRM Server (LAN)
cd /d "%~dp0"

echo ============================================
echo   CRM System - Starting Local Server
echo ============================================
echo.

REM First run? build the app
if not exist ".next\BUILD_ID" (
  echo Building the app (first time only, please wait)...
  call npm run build
  if errorlevel 1 (
    echo Build failed. Fix errors above then run again.
    pause
    exit /b 1
  )
)

echo Server is starting on port 3000 ...
echo.
echo Employees open the CRM from their browser at:
ipconfig | findstr IPv4
echo (one of those IPs, for example: http://192.168.1.10:3000)
echo.
echo Your own access: http://localhost:3000
echo.
echo DO NOT close this window while the CRM is open.
echo ============================================
echo.

call npm run start
