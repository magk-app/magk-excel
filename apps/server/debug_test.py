"""
Debug test to figure out TestClient issue
"""

import sys
print("Python version:", sys.version)

try:
    from fastapi import FastAPI
    print("✓ FastAPI imported")
    
    from fastapi.testclient import TestClient  
    print("✓ TestClient imported")
    
    from app import app
    print("✓ App imported")
    
    print("App type:", type(app))
    print("App:", app)
    
    print("Trying to create TestClient...")
    client = TestClient(app)
    print("✓ TestClient created successfully!")
    
    response = client.get("/")
    print("✓ Test request successful:", response.status_code)
    
except Exception as e:
    print("❌ Error:", e)
    import traceback
    traceback.print_exc()