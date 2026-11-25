@echo off
chcp 65001 >nul
title CRM Dev Mode
cd /d "%~dp0"
echo Starting CRM in development mode (hot reload)...
echo Server: http://localhost:3000 — or http://YOUR-IP:3000 for LAN
call npm run dev
