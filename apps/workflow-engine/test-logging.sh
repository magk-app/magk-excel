#!/bin/bash
# Test script to verify logging and error handling

echo "Testing Workflow Engine Logging & Error Handling"
echo "================================================"

# Test health endpoint
echo -e "\n1. Testing health endpoint:"
curl -s http://localhost:8080/health | jq .

# Test root endpoint
echo -e "\n2. Testing root endpoint:"
curl -s http://localhost:8080/ | jq .

# Test validation error
echo -e "\n3. Testing validation error:"
curl -s "http://localhost:8080/test-error?type=validation" | jq . 2>/dev/null || curl -s "http://localhost:8080/test-error?type=validation"

# Test workflow error
echo -e "\n4. Testing workflow error:"
curl -s "http://localhost:8080/test-error?type=workflow" | jq . 2>/dev/null || curl -s "http://localhost:8080/test-error?type=workflow"

# Test generic error
echo -e "\n5. Testing generic error:"
curl -s "http://localhost:8080/test-error" | jq . 2>/dev/null || curl -s "http://localhost:8080/test-error"

# Test 404 error
echo -e "\n6. Testing 404 error:"
curl -s http://localhost:8080/nonexistent | jq .

echo -e "\n✅ Check your server logs to see structured logging output!"