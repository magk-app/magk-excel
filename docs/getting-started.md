# Getting Started with MAGK Excel

MAGK Excel is a desktop automation platform that enables users to define data extraction workflows using natural language. This guide will help you set up the development environment and start working with the project.

## Prerequisites

### System Requirements
- **Windows 10/11** or **Linux/macOS**
- **Python 3.10+** - Download from [python.org](https://www.python.org/downloads/)
- **Git** - Download from [git-scm.com](https://git-scm.com/download/win) (recommended)
- **Internet connection** for package downloads

### Windows-Specific Requirements
- **Important**: During Python installation, check "Add Python to PATH"
- **Administrator privileges** for Command Prompt (recommended)
- Verify Python installation: `py --version`

### Linux/macOS-Specific Requirements
- **Docker** (for LocalStack S3 emulation)
- **Chrome browser** (for web scraping)
- **AWS CLI** (optional, for deployment)
- Python available as `python3` command

## Quick Setup

### Automated Setup (Recommended)

The fastest way to get started is using the automated setup scripts:

#### Windows
1. **Open Command Prompt as Administrator** (right-click → "Run as administrator")
2. **Navigate to the server directory:**
   ```cmd
   cd "C:\path\to\magk-excel\apps\server"
   ```
3. **Run the setup script:**
   ```cmd
   ..\..\scripts\setup\setup.bat
   ```

#### Linux/macOS
1. **Navigate to the server directory:**
   ```bash
   cd /path/to/magk-excel/apps/server
   ```
2. **Run the setup script:**
   ```bash
   ../../scripts/setup/setup.sh
   ```

The automated setup will:
- ✅ Validate Python version compatibility (3.10+)
- ✅ Create a virtual environment in `apps/server/venv/`
- ✅ Install all dependencies from `requirements.txt`
- ✅ Validate installation of key packages (pytest, chalice, selenium, boto3)

## Manual Setup

If the automated setup fails, follow these manual steps:

### 1. Create Virtual Environment
```bash
# Navigate to server directory
cd apps/server

# Create virtual environment
python -m venv venv  # Linux/macOS
py -m venv venv      # Windows
```

### 2. Activate Virtual Environment
```bash
# Linux/macOS
source venv/bin/activate

# Windows
venv\Scripts\activate
```

### 3. Install Dependencies
```bash
# Upgrade pip
python -m pip install --upgrade pip

# Install project dependencies
pip install -r requirements.txt
```

## Development Environment

### Environment Configuration

1. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Configure environment variables** (in `.env`):
   ```bash
   # AWS Configuration (use fake values for local development)
   AWS_DEFAULT_REGION=us-east-1
   AWS_ACCESS_KEY_ID=fake
   AWS_SECRET_ACCESS_KEY=fake
   
   # S3 Configuration
   S3_BUCKET_NAME=magk-excel-local
   USE_LOCAL_S3=true
   
   # Chrome Configuration
   USE_LOCAL_CHROME=true
   
   # Logging
   LOG_LEVEL=DEBUG
   ```

### LocalStack Setup (Linux/macOS)

For local AWS service emulation:

```bash
# Start LocalStack container
docker run -d --rm -p 4566:4566 --name localstack localstack/localstack

# Create local S3 bucket
aws --endpoint-url=http://localhost:4566 s3 mb s3://magk-excel-local
```

## Running the Application

### Start Development Server

#### Windows
```cmd
cd apps\server
..\..\scripts\development\run_local.bat
```

#### Linux/macOS
```bash
cd apps/server
../../scripts/development/run_local.sh
```

The development server will start on **http://localhost:8000**

### Available API Endpoints

Once running, you can test these endpoints:

- **Health Check**: `GET http://localhost:8000/health`
- **Execute Workflow**: `POST http://localhost:8000/execute-workflow`
- **Welcome**: `GET http://localhost:8000/`

### Test API Connection

```bash
# Test health endpoint
curl http://localhost:8000/health

# Test workflow endpoint (example)
curl -X POST http://localhost:8000/execute-workflow \
  -H "Content-Type: application/json" \
  -d '{"sourceType": "web", "sourceUri": "https://example.com", "dataIdentifier": "table"}'
```

## Verification

### Environment Validation

Run these commands to verify your setup:

```bash
# Activate virtual environment (if not already active)
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows

# Check Python version
python --version

# Check installed packages
python -c "import chalice; print('✅ Chalice OK')"
python -c "import selenium; print('✅ Selenium OK')"
python -c "import pytest; print('✅ Pytest OK')"
python -c "import boto3; print('✅ Boto3 OK')"
```

### Run Tests

#### Windows
```cmd
cd apps\server
..\..\scripts\testing\test.bat
```

#### Linux/macOS
```bash
cd apps/server
pytest tests/ -v
```

### Successful Setup Indicators

✅ **All setup scripts complete without errors**  
✅ **Virtual environment activated successfully**  
✅ **All Python packages import without errors**  
✅ **Development server starts on http://localhost:8000**  
✅ **Health endpoint returns 200 OK**  
✅ **All tests pass**

## Troubleshooting

### Common Setup Issues

#### Issue 1: "Python not found"
**Error**: `'py' is not recognized as an internal or external command`

**Solutions**:
1. Reinstall Python from python.org
2. During installation, check "Add Python to PATH"
3. Restart Command Prompt
4. Test with `py --version`

#### Issue 2: "Failed to create virtual environment"
**Solutions**:
1. Run Command Prompt as Administrator (Windows)
2. Try using `python -m venv venv` instead of `py -m venv venv`
3. If using Windows Store Python, uninstall and use python.org version

#### Issue 3: Virtual environment activation fails
**Solutions**:
1. Run Command Prompt as Administrator
2. Enable script execution in PowerShell:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
3. Use Command Prompt instead of PowerShell

#### Issue 4: Package installation fails
**Solutions**:
1. Check internet connection
2. Try with timeout: `pip install -r requirements.txt --timeout 60`
3. Install packages individually:
   ```bash
   pip install chalice==1.31.0
   pip install selenium==4.16.0
   pip install pytest==8.0.0
   ```

#### Issue 5: Chrome/ChromeDriver issues (Linux/macOS)
**Solutions**:
1. Install Chrome browser
2. Install compatible ChromeDriver version
3. Update Chrome binary path in environment variables

#### Issue 6: LocalStack connection issues
**Solutions**:
1. Ensure Docker is running
2. Check port 4566 is available
3. Restart LocalStack container:
   ```bash
   docker restart localstack
   ```

#### Issue 7: Port already in use
**Solutions**:
1. Kill process using port 8000:
   ```bash
   # Find process
   lsof -i :8000  # Linux/macOS
   netstat -ano | findstr :8000  # Windows
   
   # Kill process
   kill -9 <PID>  # Linux/macOS
   taskkill /PID <PID> /F  # Windows
   ```

### Diagnostic Commands

```bash
# Check Python version
python --version

# Check Chrome version (Linux/macOS)
google-chrome --version

# Check ChromeDriver version
chromedriver --version

# Test LocalStack S3
aws --endpoint-url=http://localhost:4566 s3 ls

# View Chalice configuration
chalice describe

# Check virtual environment
which python  # Should show venv path when activated
```

### Getting Help

If you encounter issues not covered in this guide:

1. **Check error messages carefully**
2. **Ensure you're running Command Prompt as Administrator (Windows)**
3. **Try the manual setup method**
4. **Check system compatibility** (Windows 10/11, Python 3.10+)
5. **Create an issue** in the project repository with:
   - Operating system and version
   - Python version
   - Full error message
   - Steps you've tried

## Next Steps

After successful setup:

### 1. Development Workflow
```bash
# Daily development routine
cd apps/server

# Activate environment
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows

# Start development server
../../scripts/development/run_local.sh  # Linux/macOS
..\..\scripts\development\run_local.bat # Windows

# Make changes to code...
# Server auto-reloads on file changes

# Run tests
pytest tests/ -v

# Deactivate when done
deactivate
```

### 2. Learn the Architecture
- Review `/docs/architecture/` for technical details
- Check `/docs/prd/` for product requirements
- Explore `/apps/server/chalicelib/` for backend modules

### 3. Development with BMad Methodology
- Stories are located in `docs/stories/*.story.md`
- Use specialized agent commands:
  - `/BMad:agents:dev` - Activate Developer agent
  - `*develop-story` - Implement a story
  - `*help` - Show available commands

### 4. Testing and Deployment
```bash
# Run full test suite
pytest tests/ -v --cov=chalicelib

# Deploy to AWS (requires AWS credentials)
chalice deploy --stage dev

# Deploy to production
chalice deploy --stage prod
```

### 5. Project Structure Overview
```
magk-excel/
├── apps/
│   ├── client/           # Desktop client (PyQt)
│   └── server/           # Serverless backend (Chalice)
│       ├── app.py        # Main application
│       ├── chalicelib/   # Backend modules
│       ├── tests/        # Test files
│       └── venv/         # Virtual environment
├── docs/                 # Documentation
├── scripts/              # Setup and development scripts
│   ├── setup/           # Environment setup
│   ├── development/     # Development tools
│   └── testing/         # Test runners
└── .bmad-core/          # BMad methodology files
```

## Additional Resources

- **Architecture Documentation**: `/docs/architecture/`
- **Product Requirements**: `/docs/prd/`
- **Development Stories**: `/docs/stories/`
- **API Documentation**: Check `/apps/server/app.py` for endpoints
- **Testing Guide**: `/scripts/testing/README.md`

---

**Welcome to MAGK Excel development!** 🚀

For questions or issues, refer to the project documentation or create an issue in the repository.