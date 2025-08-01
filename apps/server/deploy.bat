@echo off
echo ========================================
echo MAGK Excel Backend - Lambda Deployment
echo ========================================

echo.
echo [1/5] Cleaning up previous deployment artifacts...
if exist ".chalice\deployed" rmdir /s /q ".chalice\deployed"
if exist ".chalice\vendor" rmdir /s /q ".chalice\vendor"
if exist "__pycache__" rmdir /s /q "__pycache__"
if exist "chalicelib\__pycache__" rmdir /s /q "chalicelib\__pycache__"

echo.
echo [2/5] Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo [3/5] Installing Lambda-specific dependencies...
pip install -r .chalice\requirements.txt

echo.
echo [4/5] Checking deployment package size...
python test_deployment_size.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Deployment package is too large for Lambda!
    echo Please review dependencies and try again.
    pause
    exit /b 1
)

echo.
echo [5/5] Deploying to AWS Lambda...
chalice deploy --stage dev

echo.
echo ========================================
echo Deployment completed!
echo ========================================
pause 