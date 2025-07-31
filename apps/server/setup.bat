@echo off
:: Setup script for MAGK Excel Server Development Environment (Windows)
setlocal enabledelayedexpansion

echo Setting up MAGK Excel Server development environment...
echo.

:: Initialize error flag
set "SETUP_ERRORS=0"

:: Check Python version using 'py' command
echo Checking Python installation...
py --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.10+ from python.org
    echo    Download from: https://www.python.org/downloads/
    set "SETUP_ERRORS=1"
    goto :show_results
)

:: Get Python version for display
for /f "tokens=2" %%i in ('py --version 2^>^&1') do set python_version=%%i
echo    Found Python %python_version%

:: Check if Python version is 3.10+ (fixed logic)
echo    Verifying Python version compatibility...
py -c "import sys; exit(0 if sys.version_info >= (3, 10) else 1)"
if errorlevel 1 (
    echo ERROR: Python %python_version% is too old - requires Python 3.10 or higher
    set "SETUP_ERRORS=1"
    goto :show_results
)
echo    SUCCESS: Python %python_version% is compatible
echo.

:: Create virtual environment
echo Setting up virtual environment...

:: Clean up any existing problematic venv first
if exist "venv" (
    echo    Removing existing virtual environment for clean setup...
    rmdir /s /q venv >nul 2>&1
)

echo    Creating new virtual environment...
py -m venv venv
if errorlevel 1 (
    echo ERROR: Failed to create virtual environment
    echo    Make sure Python venv module is available
    set "SETUP_ERRORS=1"
    goto :show_results
)

:: Verify Windows-compatible virtual environment structure
if exist "venv\Scripts\activate.bat" (
    set "VENV_ACTIVATE=venv\Scripts\activate.bat"
    echo    SUCCESS: Virtual environment created with Windows structure
) else (
    echo ERROR: Virtual environment created but Windows activation script not found
    echo    Expected: venv\Scripts\activate.bat
    set "SETUP_ERRORS=1"
    goto :show_results
)
echo.

:: Activate virtual environment and continue setup
echo Activating virtual environment...
if not exist "%VENV_ACTIVATE%" (
    echo ERROR: Activation script not found at: %VENV_ACTIVATE%
    set "SETUP_ERRORS=1"
    goto :show_results
)

call "%VENV_ACTIVATE%"
if errorlevel 1 (
    echo ERROR: Failed to activate virtual environment
    echo    Activation command: %VENV_ACTIVATE%
    set "SETUP_ERRORS=1"
    goto :show_results
)
echo    SUCCESS: Virtual environment activated
echo.

:: Upgrade pip
echo Upgrading pip to latest version...
python -m pip install --upgrade pip --quiet
if errorlevel 1 (
    echo WARNING: Could not upgrade pip, but continuing...
) else (
    echo SUCCESS: Pip upgraded successfully
)
echo.

:: Install dependencies
echo Installing project dependencies...
echo    This may take a few minutes...
python -m pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo ERROR: Failed to install some dependencies
    echo    Trying with verbose output to see details...
    python -m pip install -r requirements.txt
    set "SETUP_ERRORS=1"
    goto :show_results
)
echo SUCCESS: All dependencies installed successfully
echo.

:: Run basic validation
echo Validating installation...
python -c "import sys; print('   Python: ' + sys.version.split()[0])"

echo    Checking required packages:

:: Test pytest availability
python -c "import pytest" >nul 2>&1
if errorlevel 1 (
    echo    ERROR: pytest not available
    set "SETUP_ERRORS=1"
) else (
    echo    SUCCESS: pytest available
)

:: Test chalice availability
python -c "import chalice" >nul 2>&1
if errorlevel 1 (
    echo    ERROR: chalice not available
    set "SETUP_ERRORS=1"
) else (
    echo    SUCCESS: chalice available
)

:: Test selenium availability
python -c "import selenium" >nul 2>&1
if errorlevel 1 (
    echo    ERROR: selenium not available
    set "SETUP_ERRORS=1"
) else (
    echo    SUCCESS: selenium available
)

:: Test boto3 availability
python -c "import boto3" >nul 2>&1
if errorlevel 1 (
    echo    ERROR: boto3 not available
    set "SETUP_ERRORS=1"
) else (
    echo    SUCCESS: boto3 available
)

:show_results
echo.
echo =========================================
if "%SETUP_ERRORS%"=="0" (
    echo SUCCESS: Setup completed successfully!
    echo.
    echo Next steps:
    echo   1. Activate environment: call %VENV_ACTIVATE%
    echo   2. Run tests: python -m pytest
    echo   3. Start dev server: chalice local
    echo.
    echo Current session has virtual environment activated.
) else (
    echo FAILURE: Setup completed with errors!
    echo.
    echo Please check the error messages above and:
    echo   1. Ensure Python 3.10+ is properly installed with 'py' command
    echo   2. Check your internet connection for package downloads
    echo   3. Remove the venv folder and try running setup.bat again
    echo.
    echo For help, check the project documentation.
)
echo =========================================
echo.
echo Setup script completed.