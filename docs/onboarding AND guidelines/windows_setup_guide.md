# Windows Setup Guide for MAGK Excel Server

This guide provides step-by-step instructions for setting up the MAGK Excel Server development environment on Windows.

## Prerequisites

### 1. Python 3.10+
- Download from [python.org](https://www.python.org/downloads/)
- **Important**: During installation, check "Add Python to PATH"
- Verify installation by opening Command Prompt and running: `py --version`

### 2. Git (Optional but recommended)
- Download from [git-scm.com](https://git-scm.com/download/win)

## Quick Setup

### Method 1: Automated Setup (Recommended)
1. Open Command Prompt or PowerShell as Administrator (right-click → "Run as administrator")
2. Navigate to the project directory:
   ```cmd
   cd "C:\path\to\magk-excel\apps\server"
   ```
3. Run the setup script:
   ```cmd
   setup.bat
   ```
4. The script will:
   - Check Python version compatibility
   - Create a virtual environment
   - Install all dependencies
   - Validate the installation

### Method 2: Manual Setup
If the automated setup fails, follow these manual steps:

1. **Create virtual environment:**
   ```cmd
   py -m venv venv
   ```

2. **Activate virtual environment:**
   ```cmd
   venv\Scripts\activate
   ```

3. **Upgrade pip:**
   ```cmd
   python -m pip install --upgrade pip
   ```

4. **Install dependencies:**
   ```cmd
   pip install -r requirements.txt
   ```

## Running Tests

### Using the Test Script
```cmd
test.bat
```

### Manual Testing
```cmd
venv\Scripts\activate
python -m pytest tests\ -v
```

## Common Issues and Solutions

### Issue 1: "Python not found"
**Error**: `'py' is not recognized as an internal or external command`

**Solution**:
1. Reinstall Python from python.org
2. During installation, check "Add Python to PATH"
3. Restart Command Prompt
4. Test with `py --version`

### Issue 2: "Failed to create virtual environment"
**Error**: `Failed to create virtual environment`

**Solutions**:
1. Run Command Prompt as Administrator
2. Try using `python -m venv venv` instead of `py -m venv venv`
3. If using Windows Store Python, uninstall and use python.org version

### Issue 3: Virtual environment activation fails
**Error**: Scripts not executed or permission denied

**Solutions**:
1. Run Command Prompt as Administrator
2. Enable script execution in PowerShell:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
3. Use Command Prompt instead of PowerShell

### Issue 4: Package installation fails
**Error**: Timeout or connection errors during `pip install`

**Solutions**:
1. Check internet connection
2. Try with a different DNS (8.8.8.8, 1.1.1.1)
3. Use pip with timeout:
   ```cmd
   pip install -r requirements.txt --timeout 60
   ```
4. Install packages individually:
   ```cmd
   pip install chalice==1.31.0
   pip install selenium==4.16.0
   pip install pytest==8.0.0
   ```

### Issue 5: "Access denied" errors
**Solutions**:
1. Run Command Prompt as Administrator
2. Ensure no antivirus is blocking Python
3. Temporarily disable Windows Defender real-time protection during setup

## Environment Validation

After setup, validate your environment:

```cmd
# Activate virtual environment
venv\Scripts\activate

# Check Python version
python --version

# Check installed packages
python -c "import chalice; print('Chalice OK')"
python -c "import selenium; print('Selenium OK')"
python -c "import pytest; print('Pytest OK')"
```

## Development Workflow

1. **Activate environment** (each time you start development):
   ```cmd
   venv\Scripts\activate
   ```

2. **Run tests**:
   ```cmd
   test.bat
   ```

3. **Start development server**:
   ```cmd
   chalice local
   ```

4. **Deactivate environment** (when done):
   ```cmd
   deactivate
   ```

## Project Structure
```
apps/server/
├── setup.bat              # Windows setup script
├── test.bat               # Windows test runner
├── requirements.txt       # Python dependencies
├── app.py                 # Main Chalice application
├── chalicelib/            # Application modules
│   └── web_extractor.py   # Web extraction logic
├── tests/                 # Test files
├── venv/                  # Virtual environment (created by setup)
└── .chalice/              # Chalice configuration
```

## Getting Help

If you encounter issues not covered in this guide:

1. Check the error messages carefully
2. Ensure you're running Command Prompt as Administrator
3. Try the manual setup method
4. Check Windows version compatibility (Windows 10/11 recommended)
5. Create an issue in the project repository with:
   - Windows version
   - Python version
   - Full error message
   - Steps you've tried

## Next Steps

After successful setup:
1. Run `test.bat` to ensure everything works
2. Review the project documentation in `docs/`
3. Start development using the BMad methodology
4. Use `chalice local` to test the API locally