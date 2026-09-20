@echo off
setlocal

set DB_PATH=C:\Users\User\AppData\Roaming\photoman-dev\photoman.db
set PORT=1234
set URL=http://localhost:%PORT%

netstat -ano | findstr ":%PORT% " | findstr "LISTENING" >nul
if %ERRORLEVEL% EQU 0 (
    start "" "%URL%"
    exit /b 0
)

npx sqlite3-admin "%DB_PATH%"