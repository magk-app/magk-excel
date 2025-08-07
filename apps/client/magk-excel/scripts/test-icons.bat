@echo off
echo Testing MAGK Excel Icon Setup
echo =============================

echo.
echo 1. Checking icon files...
if exist "public\icons\icon.ico" (
    echo    ✓ Windows icon found
) else (
    echo    ✗ Windows icon missing
)

if exist "public\icons\icon.png" (
    echo    ✓ Linux icon found
) else (
    echo    ✗ Linux icon missing
)

if exist "public\icons\favicon-32x32.png" (
    echo    ✓ Web favicon found
) else (
    echo    ✗ Web favicon missing
)

echo.
echo 2. Testing web favicon...
echo    Starting dev server to test favicon...
start /B npm run dev
timeout /t 5 /nobreak >nul
echo    ✓ Dev server started (check browser tab icon)

echo.
echo 3. Testing Electron build with icons...
echo    Building Windows version...
call npm run build:win
if %ERRORLEVEL% EQU 0 (
    echo    ✓ Windows build successful
) else (
    echo    ✗ Windows build failed
)

echo.
echo Icon setup test complete!
echo Check the release folder for the built application.
pause
