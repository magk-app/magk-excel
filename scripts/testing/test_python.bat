@echo off
:: Test script for Python version detection
setlocal enabledelayedexpansion

echo Testing Python version detection...
echo.

echo Your Python version:
py --version
if errorlevel 1 (
    echo ERROR: Python not found
    goto :end
)

echo.
echo Python version info:
py -c "import sys; print('Version info: ' + str(sys.version_info)); print('Is 3.10+: ' + str(sys.version_info >= (3, 10)))"

echo.
echo Exit code test (0 = success, 1 = failure):
py -c "import sys; exit(0 if sys.version_info >= (3, 10) else 1)"
if errorlevel 1 (
    echo RESULT: Version check FAILED - Python version is too old
) else (
    echo RESULT: Version check PASSED - Python version is compatible
)

echo.
echo Virtual environment structure check:
if exist "venv\Scripts\activate.bat" (
    echo FOUND: Windows-style venv (venv\Scripts\activate.bat)
    echo STATUS: Ready for Windows batch activation
) else if exist "venv/bin/activate" (
    echo FOUND: Linux-style venv (venv/bin/activate)
    echo WARNING: This will cause activation failures in Windows batch files
    echo SOLUTION: Delete venv folder and run setup.bat to recreate
) else if exist "venv" (
    echo FOUND: venv directory exists but structure unknown
    echo ACTION: Check contents manually or recreate with setup.bat
) else (
    echo NOT FOUND: No virtual environment detected
    echo ACTION: Run setup.bat to create virtual environment
)

echo.
echo Testing 'py' command variations:
echo 1. py --version:
py --version 2>nul || echo   ERROR: py --version failed
echo 2. py -3 --version:
py -3 --version 2>nul || echo   ERROR: py -3 --version failed  
echo 3. py -3.10 --version:
py -3.10 --version 2>nul || echo   ERROR: py -3.10 --version failed

:end
echo.
echo Test completed.