# Lambda Deployment Fixes

## Problem Summary
The original deployment failed because the deployment package was 98.9 MB, exceeding Lambda's 50 MB limit. This was caused by heavy dependencies like Selenium, Playwright, and PyMuPDF.

## Solutions Implemented

### 1. Optimized Dependencies (`requirements.txt`)
- **Removed**: Selenium, Playwright, PyMuPDF (heavy binary dependencies)
- **Replaced with**: requests + BeautifulSoup4 (lightweight alternatives)
- **Kept**: Core dependencies (chalice, boto3, openpyxl, etc.)
- **Commented out**: Development-only dependencies (pytest, flake8, etc.)

### 2. Lambda-Specific Requirements (`.chalice/requirements.txt`)
- Created minimal requirements file for Lambda deployment
- Only includes essential runtime dependencies
- Reduces package size significantly

### 3. Disabled Automatic Layer (`.chalice/config.json`)
- Set `automatic_layer: false` to prevent Chalice from creating large layers
- Reduced memory and timeout settings for better Lambda compatibility
- Dev: 512MB memory, 60s timeout
- Prod: 1024MB memory, 120s timeout

### 4. Lambda-Compatible Web Extractor (`chalicelib/lambda_web_extractor.py`)
- Replaced Selenium-based extractor with requests + BeautifulSoup
- Maintains same API interface for compatibility
- Includes retry logic and error handling
- Sanitizes data to prevent XSS and formula injection

### 5. Updated Simple Web Scraper (`chalicelib/simple_webscrape.py`)
- Converted from Selenium to requests + BeautifulSoup
- Maintains same functionality with lighter footprint
- Better error handling and retry logic

### 6. Deployment Script (`deploy.bat`)
- Automated deployment process
- Cleans up previous artifacts
- Installs Lambda-specific dependencies
- Checks package size before deployment
- Provides clear error messages

### 7. Package Size Checker (`test_deployment_size.py`)
- Validates deployment package size before deployment
- Prevents deployment attempts that would fail
- Provides clear feedback on package size

## Usage

### Quick Deployment
```bash
# Run the automated deployment script
deploy.bat
```

### Manual Deployment
```bash
# 1. Clean up previous artifacts
rmdir /s /q .chalice\deployed
rmdir /s /q .chalice\vendor
rmdir /s /q __pycache__
rmdir /s /q chalicelib\__pycache__

# 2. Activate virtual environment
venv\Scripts\activate.bat

# 3. Install Lambda dependencies
pip install -r .chalice\requirements.txt

# 4. Check package size
python test_deployment_size.py

# 5. Deploy
chalice deploy --stage dev
```

### Testing Package Size
```bash
python test_deployment_size.py
```

## Expected Results

### Before Fixes
- Package size: ~98.9 MB
- Deployment: ❌ Failed (RequestEntityTooLargeException)
- Dependencies: Heavy (Selenium, Playwright, PyMuPDF)

### After Fixes
- Package size: ~5-15 MB (estimated)
- Deployment: ✅ Should succeed
- Dependencies: Lightweight (requests, BeautifulSoup4)

## Trade-offs

### What We Lost
- **Selenium**: Browser automation capabilities
- **Playwright**: Advanced web scraping features
- **PyMuPDF**: Advanced PDF processing

### What We Gained
- **Lambda Compatibility**: Can deploy to AWS Lambda
- **Faster Startup**: Lighter dependencies
- **Lower Costs**: Smaller memory footprint
- **Better Reliability**: Fewer binary dependencies

### Limitations
- **Static Content Only**: Can't handle JavaScript-heavy sites
- **Basic PDF Support**: Limited to pdfplumber capabilities
- **No Browser Automation**: Can't interact with dynamic content

## Future Improvements

### For Advanced Web Scraping
- Use AWS Lambda Layers for heavy dependencies
- Implement serverless browser solutions (Puppeteer Lambda)
- Use external services (ScrapingBee, ScraperAPI)

### For PDF Processing
- Use AWS Textract for advanced PDF extraction
- Implement Lambda Layers for PyMuPDF
- Use external PDF processing services

## Troubleshooting

### Package Still Too Large
1. Check for unnecessary files in `chalicelib/`
2. Review `.chalice/requirements.txt`
3. Remove any remaining heavy dependencies
4. Use `test_deployment_size.py` to identify large files

### Import Errors
1. Ensure all imports use Lambda-compatible modules
2. Check that `lambda_web_extractor.py` is being used
3. Verify all dependencies are in `.chalice/requirements.txt`

### Deployment Errors
1. Check AWS credentials and permissions
2. Verify Chalice configuration
3. Ensure virtual environment is activated
4. Check for syntax errors in Python files

## Files Modified

- `requirements.txt` - Optimized dependencies
- `.chalice/config.json` - Lambda configuration
- `.chalice/requirements.txt` - Lambda-specific dependencies
- `chalicelib/simple_webscrape.py` - Converted to requests + BeautifulSoup
- `chalicelib/lambda_web_extractor.py` - New Lambda-compatible extractor
- `app.py` - Updated import to use Lambda extractor
- `deploy.bat` - Automated deployment script
- `test_deployment_size.py` - Package size checker
- `DEPLOYMENT_FIXES.md` - This documentation 