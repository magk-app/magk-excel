import pytest
from unittest.mock import patch, Mock
from chalice.test import Client
from app import app


@pytest.fixture
def test_client():
    """Create test client for Chalice app."""
    return Client(app)


class TestAppRoutes:
    """Test cases for main app routes."""
    
    def test_index_route(self, test_client):
        """Test the index route."""
        response = test_client.http.get('/')
        
        assert response.status_code == 200
        assert response.json_body == {'message': 'MAGK Excel Backend API'}
    
    def test_health_route(self, test_client):
        """Test the health check route."""
        response = test_client.http.get('/health')
        
        assert response.status_code == 200
        assert response.json_body == {
            'status': 'healthy', 
            'service': 'magk-excel-backend'
        }
    
    def test_execute_workflow_options(self, test_client):
        """Test CORS preflight request."""
        response = test_client.http.options('/execute-workflow')
        
        assert response.status_code == 200
        assert 'Access-Control-Allow-Origin' in response.headers
        assert response.headers['Access-Control-Allow-Origin'] == '*'


class TestExecuteWorkflow:
    """Test cases for execute-workflow endpoint."""
    
    def test_execute_workflow_missing_body(self, test_client):
        """Test request without body."""
        response = test_client.http.post('/execute-workflow')
        
        assert response.status_code == 400
        assert 'Request body is required' in response.json_body['Message']
    
    def test_execute_workflow_missing_fields(self, test_client):
        """Test request with missing required fields."""
        body = {'sourceType': 'web'}
        
        response = test_client.http.post('/execute-workflow', 
                                       headers={'Content-Type': 'application/json'},
                                       body=body)
        
        assert response.status_code == 400
        assert 'Missing required fields' in response.json_body['Message']
    
    def test_execute_workflow_unsupported_source_type(self, test_client):
        """Test request with unsupported source type."""
        body = {
            'sourceType': 'unsupported',
            'sourceUri': 'https://example.com',
            'dataIdentifier': 'test-table'
        }
        
        response = test_client.http.post('/execute-workflow',
                                       headers={'Content-Type': 'application/json'},
                                       body=body)
        
        assert response.status_code == 500
        assert 'Unsupported source type' in response.json_body['Message']
    
    def test_execute_workflow_pdf_not_implemented(self, test_client):
        """Test PDF source type (not yet implemented)."""
        body = {
            'sourceType': 'pdf',
            'sourceUri': 'https://example.com/test.pdf',
            'dataIdentifier': 'table1'
        }
        
        response = test_client.http.post('/execute-workflow',
                                       headers={'Content-Type': 'application/json'},  
                                       body=body)
        
        assert response.status_code == 500
        assert 'not yet implemented' in response.json_body['Message']
    
    @patch('app.extract_web_table')
    def test_execute_workflow_web_success(self, mock_extract, test_client):
        """Test successful web extraction."""
        # Mock the extraction function
        mock_extract.return_value = [
            ['Name', 'Age', 'City'],
            ['Alice', '25', 'New York'],
            ['Bob', '30', 'San Francisco']
        ]
        
        body = {
            'sourceType': 'web',
            'sourceUri': 'https://example.com',
            'dataIdentifier': 'test-table'
        }
        
        response = test_client.http.post('/execute-workflow',
                                       headers={'Content-Type': 'application/json'},
                                       body=body)
        
        assert response.status_code == 200
        response_data = response.json_body
        
        assert response_data['status'] == 'success'
        assert response_data['rowCount'] == 3
        assert response_data['columnCount'] == 3
        assert len(response_data['sampleData']) == 3
        assert 'outputUrl' in response_data
        
        mock_extract.assert_called_once_with('https://example.com', 'test-table')
    
    @patch('app.extract_web_table')
    def test_execute_workflow_web_no_data(self, mock_extract, test_client):
        """Test web extraction with no data returned."""
        mock_extract.return_value = []
        
        body = {
            'sourceType': 'web',
            'sourceUri': 'https://example.com',
            'dataIdentifier': 'nonexistent-table'
        }
        
        response = test_client.http.post('/execute-workflow',
                                       headers={'Content-Type': 'application/json'},
                                       body=body)
        
        assert response.status_code == 500
        assert 'No data extracted' in response.json_body['Message']
    
    @patch('app.extract_web_table')
    def test_execute_workflow_web_extraction_error(self, mock_extract, test_client):
        """Test web extraction with error."""
        mock_extract.side_effect = Exception("Extraction failed")
        
        body = {
            'sourceType': 'web',
            'sourceUri': 'https://example.com',
            'dataIdentifier': 'test-table'
        }
        
        response = test_client.http.post('/execute-workflow',
                                       headers={'Content-Type': 'application/json'},
                                       body=body)
        
        assert response.status_code == 500
        assert 'Internal server error' in response.json_body['Message']


class TestCORSHeaders:
    """Test CORS header functionality."""
    
    def test_cors_headers_added(self, test_client):
        """Test that CORS headers are added to responses."""
        response = test_client.http.get('/health')
        
        assert response.status_code == 200
        assert 'Access-Control-Allow-Origin' in response.headers
        assert response.headers['Access-Control-Allow-Origin'] == '*'