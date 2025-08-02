"""
Basic test script for the FastAPI PDF extraction endpoints.
Tests API structure and response models without requiring AWS credentials.
"""

from fastapi.testclient import TestClient
from app import app

# Create test client
client = TestClient(app)

def test_health_endpoint():
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "magk-excel-pdf-extractor"
    print("✓ Health endpoint test passed")

def test_root_endpoint():
    """Test the root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["status"] == "healthy"
    print("✓ Root endpoint test passed")

def test_extract_tables_request_validation():
    """Test request validation for extract-tables endpoint."""
    # Test missing PDF source
    response = client.post("/extract-tables", json={})
    assert response.status_code == 422  # Validation error
    print("✓ Request validation test passed")
    
    # Test empty PDF source
    response = client.post("/extract-tables", json={"pdf_source": ""})
    assert response.status_code == 400
    data = response.json()
    assert data["status"] == "error"
    assert "required" in data["error"].lower()
    print("✓ Empty PDF source validation test passed")

def test_extract_specific_table_prompt_validation():
    """Test prompt validation for extract-specific-table endpoint."""
    # Test missing prompt
    response = client.post("/extract-specific-table", json={"pdf_source": "test.pdf"})
    assert response.status_code == 400
    data = response.json()
    assert data["status"] == "error"
    assert "prompt is required" in data["error"].lower()
    print("✓ Prompt validation test passed")

if __name__ == "__main__":
    print("Running basic FastAPI tests...")
    print()
    
    try:
        test_health_endpoint()
        test_root_endpoint()
        test_extract_tables_request_validation()
        test_extract_specific_table_prompt_validation()
        
        print()
        print("🎉 All basic tests passed!")
        print()
        print("To run the server: python app.py")
        print("API docs will be available at: http://localhost:8000/docs")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")