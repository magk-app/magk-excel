"""
Manual test for API functionality without using TestClient
"""
import requests
import json
import time
from threading import Thread
import uvicorn
from app import app

def start_server():
    """Start the FastAPI server in background."""
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")

def test_api_endpoints():
    """Test the API endpoints manually."""
    base_url = "http://127.0.0.1:8000"
    
    # Wait for server to start
    print("Waiting for server to start...")
    time.sleep(2)
    
    try:
        # Test health endpoint
        print("\n1. Testing health endpoint...")
        response = requests.get(f"{base_url}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        # Test root endpoint
        print("\n2. Testing root endpoint...")
        response = requests.get(f"{base_url}/")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        # Test extract-tables with invalid data
        print("\n3. Testing extract-tables validation...")
        response = requests.post(f"{base_url}/extract-tables", json={})
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        # Test extract-tables with empty PDF source
        print("\n4. Testing extract-tables with empty PDF source...")
        response = requests.post(f"{base_url}/extract-tables", json={"pdf_source": ""})
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        # Test extract-specific-table validation
        print("\n5. Testing extract-specific-table validation...")
        response = requests.post(f"{base_url}/extract-specific-table", json={"pdf_source": "test.pdf"})
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        print("\n✅ All basic API tests completed successfully!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure it's running.")
    except Exception as e:
        print(f"❌ Test error: {e}")

if __name__ == "__main__":
    print("Starting manual API test...")
    
    # Start server in background thread
    server_thread = Thread(target=start_server, daemon=True)
    server_thread.start()
    
    # Run tests
    test_api_endpoints()
    
    print("\nTest completed. Press Ctrl+C to stop the server.")