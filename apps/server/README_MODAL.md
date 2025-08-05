# MAGK Excel Modal Deployment

This directory contains the Modal.com deployment for the MAGK Excel FastAPI application.

## Files

- `modal_app.py` - Main Modal application with FastAPI endpoints
- `deploy_modal.py` - Deployment helper script
- `modal_requirements.txt` - Python dependencies (automatically handled by Modal)
- `README_MODAL.md` - This documentation

## Quick Start

### 1. Install Modal CLI

```bash
pip install modal
```

### 2. Authenticate with Modal

```bash
modal setup
```

Follow the prompts to authenticate with your Modal account.

### 3. Create Secrets

Create AWS credentials secret for Bedrock access:

```bash
modal secret create aws-credentials
```

Add your AWS credentials:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY` 
- `AWS_DEFAULT_REGION` (optional)

### 4. Deploy to Modal

```bash
python deploy_modal.py deploy
```

Or deploy directly:

```bash
modal deploy modal_app.py
```

### 5. Test Locally (Optional)

```bash
python deploy_modal.py serve
```

Or serve directly:

```bash
modal serve modal_app.py
```

## API Endpoints

Once deployed, your Modal app will provide these endpoints:

### GET /
- **Description**: API documentation and endpoint information
- **Response**: JSON with available endpoints and usage examples

### GET /health
- **Description**: Health check endpoint
- **Response**: Service status and deployment info

### POST /extract-tables
- **Description**: Extract all tables from a PDF or tables matching a prompt
- **Request Body**:
  ```json
  {
    "pdf_source": "https://abc.xyz/assets/51/e1/bf43f01041f6a8882a29d7e89cae/goog-10-q-q1-2025.pdf",
    "prompt": "revenue data table" // optional
  }
  ```
- **Response**: List of extracted tables with metadata

### POST /extract-specific-table
- **Description**: Extract a specific table using natural language prompt
- **Request Body**:
  ```json
  {
    "pdf_source": "https://abc.xyz/assets/51/e1/bf43f01041f6a8882a29d7e89cae/goog-10-q-q1-2025.pdf",
    "prompt": "extract balance sheet data" // required
  }
  ```
- **Response**: Single table matching the prompt

## Example Usage

### Using curl

```bash
# Health check
curl -X GET "https://your-app-id--magk-excel-api-health.modal.run"

# Extract tables
curl -X POST "https://your-app-id--magk-excel-api-extract-tables.modal.run" \
  -H "Content-Type: application/json" \
  -d '{
    "pdf_source": "https://abc.xyz/assets/51/e1/bf43f01041f6a8882a29d7e89cae/goog-10-q-q1-2025.pdf",
    "prompt": "quarterly revenue table"
  }'
```

### Using Python requests

```python
import requests

# Extract specific table
response = requests.post(
    "https://your-app-id--magk-excel-api-extract-specific-table.modal.run",
    json={
        "pdf_source": "https://abc.xyz/assets/51/e1/bf43f01041f6a8882a29d7e89cae/goog-10-q-q1-2025.pdf",
        "prompt": "extract expense breakdown table"
    }
)

data = response.json()
print(data)
```

## Configuration

### Environment Variables

Modal secrets are used for configuration:

- `aws-credentials`: AWS credentials for Bedrock access
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_DEFAULT_REGION`

### Resource Allocation

Current configuration:
- **CPU**: 2.0 cores
- **Memory**: 4096 MB  
- **Timeout**: 600 seconds (10 minutes)

Modify these in `modal_app.py` if needed:

```python
@app.function(
    image=image,
    cpu=2.0,           # Adjust CPU allocation
    memory=4096,       # Adjust memory (MB)
    timeout=600,       # Adjust timeout (seconds)
)
```

## Cost Optimization

- Functions scale to zero when not in use
- Pay only for actual execution time
- Cold starts may occur on first request
- Consider keeping functions warm for production use

## Monitoring

Modal provides built-in monitoring:
- View logs in Modal dashboard
- Monitor function execution times
- Track resource usage and costs

## Troubleshooting

### Common Issues

1. **Authentication Error**
   ```bash
   modal setup
   ```

2. **Secret Not Found**
   ```bash
   modal secret create aws-credentials
   ```

3. **Import Errors**
   - Check that all dependencies are in the Modal image
   - Verify Python version compatibility

4. **Timeout Issues**
   - Increase timeout in function decorator
   - Optimize PDF processing logic

### Logs

View logs in real-time:
```bash
modal logs magk-excel-api
```

## Development

### Local Testing

Use Modal's local development server:

```bash
modal serve modal_app.py
```

This provides local endpoints for testing before deployment.

### Making Changes

1. Edit `modal_app.py`
2. Test locally with `modal serve modal_app.py`
3. Deploy with `modal deploy modal_app.py`

### Adding Dependencies

Add Python packages to the image definition:

```python
image = (
    modal.Image.debian_slim(python_version="3.10")
    .pip_install(
        "your-new-package",
        # ... other packages
    )
)
```