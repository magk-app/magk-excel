git """
Unit tests for AWS Bedrock Client Module

Tests the BedrockClient class and get_bedrock_client function
for AWS Bedrock integration and AI-powered features.
"""

import pytest
import json
from unittest.mock import Mock, patch, MagicMock
from botocore.exceptions import ClientError, NoCredentialsError
from chalicelib.bedrock_client import BedrockClient, get_bedrock_client


class TestBedrockClient:
    """Test cases for BedrockClient class."""
    
    def test_init_success(self):
        """Test successful initialization of BedrockClient."""
        with patch('chalicelib.bedrock_client.boto3.client') as mock_boto3_client:
            mock_client = Mock()
            mock_boto3_client.return_value = mock_client
            
            bedrock_client = BedrockClient('us-east-1')
            
            assert bedrock_client.region_name == 'us-east-1'
            assert bedrock_client.client == mock_client
            mock_boto3_client.assert_called_once_with(
                'bedrock-runtime',
                region_name='us-east-1'
            )
    
    def test_init_no_credentials(self):
        """Test initialization fails when AWS credentials are missing."""
        with patch('chalicelib.bedrock_client.boto3.client') as mock_boto3_client:
            mock_boto3_client.side_effect = NoCredentialsError()
            
            with pytest.raises(NoCredentialsError):
                BedrockClient('us-east-1')
    
    def test_init_exception(self):
        """Test initialization fails with other exceptions."""
        with patch('chalicelib.bedrock_client.boto3.client') as mock_boto3_client:
            mock_boto3_client.side_effect = Exception("Test error")
            
            with pytest.raises(Exception, match="Test error"):
                BedrockClient('us-east-1')
    
    def test_invoke_claude_success(self):
        """Test successful Claude model invocation."""
        bedrock_client = BedrockClient('us-east-1')
        
        # Mock response
        mock_response = Mock()
        mock_response['body'].read.return_value = json.dumps({
            'content': [{'text': 'Test response from Claude'}]
        }).encode()
        
        bedrock_client.client.invoke_model.return_value = mock_response
        
        result = bedrock_client.invoke_claude("Test prompt")
        
        assert result == 'Test response from Claude'
        bedrock_client.client.invoke_model.assert_called_once()
        
        # Verify the request body structure
        call_args = bedrock_client.client.invoke_model.call_args
        assert call_args[1]['modelId'] == 'anthropic.claude-3-sonnet-20240229-v1:0'
        
        request_body = json.loads(call_args[1]['body'])
        assert request_body['anthropic_version'] == 'bedrock-2023-05-31'
        assert request_body['max_tokens'] == 4096
        assert request_body['messages'][0]['role'] == 'user'
        assert request_body['messages'][0]['content'] == 'Test prompt'
    
    def test_invoke_claude_client_error(self):
        """Test Claude invocation fails with ClientError."""
        bedrock_client = BedrockClient('us-east-1')
        
        bedrock_client.client.invoke_model.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access denied'}},
            'InvokeModel'
        )
        
        result = bedrock_client.invoke_claude("Test prompt")
        
        assert result is None
    
    def test_invoke_claude_exception(self):
        """Test Claude invocation fails with other exceptions."""
        bedrock_client = BedrockClient('us-east-1')
        
        bedrock_client.client.invoke_model.side_effect = Exception("Test error")
        
        result = bedrock_client.invoke_claude("Test prompt")
        
        assert result is None
    
    def test_invoke_titan_success(self):
        """Test successful Titan model invocation."""
        bedrock_client = BedrockClient('us-east-1')
        
        # Mock response
        mock_response = Mock()
        mock_response['body'].read.return_value = json.dumps({
            'results': [{'outputText': 'Test response from Titan'}]
        }).encode()
        
        bedrock_client.client.invoke_model.return_value = mock_response
        
        result = bedrock_client.invoke_titan("Test prompt")
        
        assert result == 'Test response from Titan'
        bedrock_client.client.invoke_model.assert_called_once()
        
        # Verify the request body structure
        call_args = bedrock_client.client.invoke_model.call_args
        assert call_args[1]['modelId'] == 'amazon.titan-text-express-v1'
        
        request_body = json.loads(call_args[1]['body'])
        assert request_body['inputText'] == 'Test prompt'
        assert request_body['textGenerationConfig']['maxTokenCount'] == 4096
        assert request_body['textGenerationConfig']['temperature'] == 0.7
        assert request_body['textGenerationConfig']['topP'] == 0.9
    
    def test_invoke_titan_client_error(self):
        """Test Titan invocation fails with ClientError."""
        bedrock_client = BedrockClient('us-east-1')
        
        bedrock_client.client.invoke_model.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access denied'}},
            'InvokeModel'
        )
        
        result = bedrock_client.invoke_titan("Test prompt")
        
        assert result is None
    
    def test_analyze_workflow_context_success(self):
        """Test successful workflow context analysis."""
        bedrock_client = BedrockClient('us-east-1')
        
        # Mock Claude response with JSON
        mock_response = 'Here is the analysis: {"sourceType": "pdf", "dataIdentifier": "revenue table", "confidence": 0.9, "reasoning": "User wants to extract revenue data"}'
        
        with patch.object(bedrock_client, 'invoke_claude', return_value=mock_response):
            result = bedrock_client.analyze_workflow_context(
                "Extract revenue data from the quarterly report PDF",
                ['web', 'pdf', 'excel']
            )
            
            assert result['sourceType'] == 'pdf'
            assert result['dataIdentifier'] == 'revenue table'
            assert result['confidence'] == 0.9
            assert 'revenue data' in result['reasoning']
    
    def test_analyze_workflow_context_no_json(self):
        """Test workflow analysis when Claude doesn't return valid JSON."""
        bedrock_client = BedrockClient('us-east-1')
        
        # Mock Claude response without JSON
        mock_response = 'I cannot provide a JSON response at this time.'
        
        with patch.object(bedrock_client, 'invoke_claude', return_value=mock_response):
            result = bedrock_client.analyze_workflow_context(
                "Extract data from PDF",
                ['web', 'pdf', 'excel']
            )
            
            # Should return fallback analysis
            assert result['sourceType'] == 'web'
            assert result['dataIdentifier'] == 'table'
            assert result['confidence'] == 0.5
            assert 'Fallback analysis' in result['reasoning']
    
    def test_analyze_workflow_context_exception(self):
        """Test workflow analysis when exception occurs."""
        bedrock_client = BedrockClient('us-east-1')
        
        with patch.object(bedrock_client, 'invoke_claude', side_effect=Exception("Test error")):
            result = bedrock_client.analyze_workflow_context(
                "Extract data from PDF",
                ['web', 'pdf', 'excel']
            )
            
            # Should return error fallback
            assert result['sourceType'] == 'web'
            assert result['dataIdentifier'] == 'table'
            assert result['confidence'] == 0.0
            assert 'Error during analysis' in result['reasoning']
    
    def test_generate_ui_controls_success(self):
        """Test successful UI control generation."""
        bedrock_client = BedrockClient('us-east-1')
        
        workflow_context = {
            'sourceType': 'pdf',
            'dataIdentifier': 'revenue table',
            'confidence': 0.9
        }
        
        # Mock Claude response with JSON
        mock_response = '''
        Here are the UI controls:
        {
            "controls": [
                {
                    "type": "input",
                    "label": "PDF File",
                    "key": "sourceUri",
                    "required": true
                }
            ],
            "layout": "vertical",
            "reasoning": "Simple form layout"
        }
        '''
        
        with patch.object(bedrock_client, 'invoke_claude', return_value=mock_response):
            result = bedrock_client.generate_ui_controls(workflow_context)
            
            assert result['controls'][0]['type'] == 'input'
            assert result['controls'][0]['label'] == 'PDF File'
            assert result['controls'][0]['key'] == 'sourceUri'
            assert result['controls'][0]['required'] == True
            assert result['layout'] == 'vertical'
    
    def test_generate_ui_controls_no_json(self):
        """Test UI control generation when Claude doesn't return valid JSON."""
        bedrock_client = BedrockClient('us-east-1')
        
        workflow_context = {'sourceType': 'pdf'}
        
        # Mock Claude response without JSON
        mock_response = 'I cannot provide JSON at this time.'
        
        with patch.object(bedrock_client, 'invoke_claude', return_value=mock_response):
            result = bedrock_client.generate_ui_controls(workflow_context)
            
            # Should return fallback controls
            assert len(result['controls']) == 2
            assert result['controls'][0]['type'] == 'input'
            assert result['controls'][0]['key'] == 'sourceUri'
            assert result['layout'] == 'vertical'
            assert 'Fallback UI controls' in result['reasoning']
    
    def test_generate_ui_controls_exception(self):
        """Test UI control generation when exception occurs."""
        bedrock_client = BedrockClient('us-east-1')
        
        workflow_context = {'sourceType': 'pdf'}
        
        with patch.object(bedrock_client, 'invoke_claude', side_effect=Exception("Test error")):
            result = bedrock_client.generate_ui_controls(workflow_context)
            
            # Should return error fallback
            assert result['controls'] == []
            assert result['layout'] == 'vertical'
            assert 'Error generating controls' in result['reasoning']
    
    def test_validate_workflow_config_success(self):
        """Test successful workflow configuration validation."""
        bedrock_client = BedrockClient('us-east-1')
        
        workflow_config = {
            'sourceType': 'pdf',
            'sourceUri': 'test.pdf',
            'dataIdentifier': 'revenue table'
        }
        
        # Mock Claude response with JSON
        mock_response = '''
        Validation result:
        {
            "valid": true,
            "issues": [],
            "suggestions": ["Consider adding more specific table identifier"],
            "confidence": 0.8
        }
        '''
        
        with patch.object(bedrock_client, 'invoke_claude', return_value=mock_response):
            result = bedrock_client.validate_workflow_config(workflow_config)
            
            assert result['valid'] == True
            assert result['issues'] == []
            assert len(result['suggestions']) == 1
            assert result['confidence'] == 0.8
    
    def test_validate_workflow_config_invalid(self):
        """Test workflow validation when configuration is invalid."""
        bedrock_client = BedrockClient('us-east-1')
        
        workflow_config = {
            'sourceType': 'pdf',
            # Missing sourceUri and dataIdentifier
        }
        
        # Mock Claude response with JSON indicating invalid config
        mock_response = '''
        Validation result:
        {
            "valid": false,
            "issues": ["Missing sourceUri", "Missing dataIdentifier"],
            "suggestions": ["Add required fields"],
            "confidence": 0.9
        }
        '''
        
        with patch.object(bedrock_client, 'invoke_claude', return_value=mock_response):
            result = bedrock_client.validate_workflow_config(workflow_config)
            
            assert result['valid'] == False
            assert len(result['issues']) == 2
            assert 'Missing sourceUri' in result['issues']
            assert 'Missing dataIdentifier' in result['issues']
    
    def test_validate_workflow_config_no_json(self):
        """Test workflow validation when Claude doesn't return valid JSON."""
        bedrock_client = BedrockClient('us-east-1')
        
        workflow_config = {'sourceType': 'pdf'}
        
        # Mock Claude response without JSON
        mock_response = 'I cannot provide JSON validation.'
        
        with patch.object(bedrock_client, 'invoke_claude', return_value=mock_response):
            result = bedrock_client.validate_workflow_config(workflow_config)
            
            # Should return fallback validation
            assert result['valid'] == True
            assert result['issues'] == []
            assert result['suggestions'] == []
            assert result['confidence'] == 0.5
    
    def test_validate_workflow_config_exception(self):
        """Test workflow validation when exception occurs."""
        bedrock_client = BedrockClient('us-east-1')
        
        workflow_config = {'sourceType': 'pdf'}
        
        with patch.object(bedrock_client, 'invoke_claude', side_effect=Exception("Test error")):
            result = bedrock_client.validate_workflow_config(workflow_config)
            
            # Should return error fallback
            assert result['valid'] == False
            assert len(result['issues']) == 1
            assert 'Validation error' in result['issues'][0]
            assert result['confidence'] == 0.0


class TestGetBedrockClient:
    """Test cases for get_bedrock_client convenience function."""
    
    def test_get_bedrock_client_default_region(self):
        """Test getting Bedrock client with default region."""
        with patch('chalicelib.bedrock_client.BedrockClient') as mock_client_class:
            mock_client = Mock()
            mock_client_class.return_value = mock_client
            
            result = get_bedrock_client()
            
            assert result == mock_client
            mock_client_class.assert_called_once_with('us-east-1')
    
    def test_get_bedrock_client_custom_region(self):
        """Test getting Bedrock client with custom region."""
        with patch('chalicelib.bedrock_client.BedrockClient') as mock_client_class:
            mock_client = Mock()
            mock_client_class.return_value = mock_client
            
            result = get_bedrock_client('us-west-2')
            
            assert result == mock_client
            mock_client_class.assert_called_once_with('us-west-2')


if __name__ == '__main__':
    pytest.main([__file__])