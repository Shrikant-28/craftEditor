@echo off
setlocal
echo ========================================================
echo   Starting Aura Notes Windows Release Build
echo ========================================================

node scripts\release.js %*

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Build failed with exit code %ERRORLEVEL%.
    exit /b %ERRORLEVEL%
)

echo.
echo [SUCCESS] Windows Release Build Completed.
endlocal
