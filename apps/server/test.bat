@echo off
:: Windows test runner for MAGK Excel Server
setlocal enabledelayedexpansion

echo 🧪 Running MAGK Excel Server Tests...
echo.

:: Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo ❌ Virtual environment not found!
    echo    Please run setup.bat first to create the environment.
    echo.
    echo Press any key to continue...
    pause >nul
    exit /b 1
)

:: Activate virtual environment
echo 🔄 Activating virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ❌ Failed to activate virtual environment
    echo    Please check if the virtual environment is properly set up
    echo.
    echo Press any key to continue...
    pause >nul
    exit /b 1
)
echo ✅ Virtual environment activated
echo.

:: Check if pytest is available and run appropriate tests
echo 🔍 Checking test framework availability...
python -c "import pytest" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  pytest not available, running basic validation tests...
    echo.
    if exist "run_basic_tests.py" (
        python run_basic_tests.py
    ) else (
        echo ❌ Basic test file not found (run_basic_tests.py)
        echo    Running minimal validation instead...
        python -c "print('✅ Python environment working'); import sys; print('Python version:', sys.version.split()[0])"
    )
) else (
    echo ✅ pytest available - running full test suite...
    echo.
    
    :: Check if tests directory exists
    if not exist "tests\" (
        echo ❌ Tests directory not found!
        echo    Expected to find tests\ directory
        echo.
        echo Press any key to continue...
        pause >nul
        exit /b 1
    )
    
    :: Run pytest with verbose output
    python -m pytest tests\ -v --tb=short --color=yes
    set "TEST_RESULT=!errorlevel!"
    
    echo.
    echo =========================================
    if "!TEST_RESULT!"=="0" (
        echo 🎉 All tests passed successfully!
    ) else (
        echo ❌ Some tests failed (exit code: !TEST_RESULT!)
        echo    Check the output above for details
    )
    echo =========================================
)

echo.
echo 🎉 Test run complete!
echo.
echo Press any key to continue...
pause >nul