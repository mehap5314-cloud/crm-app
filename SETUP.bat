@echo off
echo ========================================
echo   CRM System - Setup Guide
echo ========================================
echo.
echo STEP 1: Create Google Cloud Project
echo   - Go to https://console.cloud.google.com
echo   - Create a new project or select existing
echo   - Enable Google Sheets API
echo   - Enable Google+ API (for OAuth)
echo.
echo STEP 2: Create OAuth 2.0 Credentials
echo   - APIs ^& Services ^> Credentials
echo   - Create OAuth client ID (Web application)
echo   - Add redirect URI: http://localhost:3000/api/auth/callback/google
echo   - Save GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
echo.
echo STEP 3: Create Service Account
echo   - APIs ^& Services ^> Credentials
echo   - Create Service Account
echo   - Download JSON key file
echo   - Base64 encode the JSON key file:
echo     certutil -encodehex -f key.json output.txt
echo   - OR PowerShell:
echo     [Convert]::ToBase64String([IO.File]::ReadAllBytes("key.json"))
echo.
echo STEP 4: Share your Google Sheet
echo   - Open your sheet
echo   - Share with the service account email (Editor)
echo   - Copy Sheet ID from URL
echo.
echo STEP 5: Create .env.local
echo   - Copy .env.example to .env.local
echo   - Fill in all values
echo   - Generate NEXTAUTH_SECRET: openssl rand -base64 32
echo.
echo STEP 6: Run the app
echo   npm run dev
echo.
echo ========================================
pause
