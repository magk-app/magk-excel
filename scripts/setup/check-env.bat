@echo off
:: Environment check script for MAGK Excel Server
setlocal enabledelayedexpansion

echo MAGK Excel Server - Environment Check
echo ==========================================
echo.

set "CHECK_ERRORS=0"

:: Check Python
echo Checking Python installation...
py --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found
    echo    Please install Python 3.10+ from python.org
    set "CHECK_ERRORS=1"
) else (
    for /f "tokens=2" %%i in ('py --version 2^>^&1') do set python_version=%%i
    echo SUCCESS: Python !python_version! found
    
    :: Check Python version
    py -c "import sys; exit(0 if sys.version_info >= (3, 10) else 1)" >nul 2>&1
    if errorlevel 1 (
        echo ERROR: Python !python_version! is too old (need 3.10+)
        set "CHECK_ERRORS=1"
    ) else (
        echo SUCCESS: Python version is compatible
    )
)
echo.

:: Check pip
echo Checking pip...
py -m pip --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: pip not available
    set "CHECK_ERRORS=1"
) else (
    echo SUCCESS: pip is available
)
echo.

:: Check internet connectivity
echo Checking internet connectivity...
ping -n 1 pypi.org >nul 2>&1
if errorlevel 1 (
    echo ERROR: Cannot reach PyPI (pypi.org)
    echo    Check your internet connection
    set "CHECK_ERRORS=1"
) else (
    echo SUCCESS: Internet connection OK
)
echo.

:: Check if running as Administrator
echo Checking administrator privileges...
net session >nul 2>&1
if errorlevel 1 (
    echo WARNING: Not running as Administrator
    echo    Consider running Command Prompt as Administrator for smoother setup
) else (
    echo SUCCESS: Running with administrator privileges
)
echo.

:: Check current directory
echo Checking current directory...
if exist "requirements.txt" (
    echo SUCCESS: Found requirements.txt - you're in the right directory
) else (
    echo ERROR: requirements.txt not found
    echo    Make sure you're in the apps/server directory
    set "CHECK_ERRORS=1"
)
echo.

:: Check existing virtual environment
echo Checking for existing virtual environment...
if exist "venv\Scripts\activate.bat" (
    echo SUCCESS: Virtual environment exists
    echo    You can run test.bat to check if it's working
) else (
    echo INFO: No virtual environment found (this is normal for first setup)
    echo    Run setup.bat to create one
)
echo.

:: Summary
echo ==========================================
if "%CHECK_ERRORS%"=="0" (
    echo SUCCESS: Environment check passed!
    echo    You're ready to run setup.bat
) else (
    echo ERROR: Environment check found issues
    echo    Please fix the problems above before running setup.bat
)
echo ==========================================
echo.

echo Press any key to continue...
pause >nul