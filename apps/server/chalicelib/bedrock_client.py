"""
AWS Bedrock Client Module for MAGK Excel Backend

This module provides functionality to interact with AWS Bedrock
for natural language processing and AI-powered features.
"""

import logging
import json
import boto3
from typing import Dict, Any, Optional, List
from botocore.exceptions import ClientError, NoCredentialsError

# Set up logging
logger = logging.getLogger(__name__)


class BedrockClient:
    """
    AWS Bedrock client for AI inference and natural language processing.
    
    Handles communication with various Bedrock models including
    Claude, Titan, and other available models.
    """
    
    def __init__(self, region_name: str = 'us-east-1'):
        """
        Initialize the Bedrock client.
        
        Args:
            region_name: AWS region for Bedrock service
        """
        try:
            self.region_name = region_name
            self.client = boto3.client(
                'bedrock-runtime',
                region_name=region_name
            )
            logger.info(f"Bedrock client initialized for region: {region_name}")
            
        except NoCredentialsError:
            logger.error("AWS credentials not found. Please configure AWS credentials.")
            raise
        except Exception as e:
            logger.error(f"Failed to initialize Bedrock client: {str(e)}")
            raise
    
    def invoke_claude(self, prompt: str, model_id: str = 'anthropic.claude-3-sonnet-20240229-v1:0') -> Optional[str]:
        """
        Invoke Claude model for text generation.
        
        Args:
            prompt: Input prompt for the model
            model_id: Claude model ID to use
            
        Returns:
            Generated text response or None if failed
        """
        try:
            # Prepare request body for Claude
            request_body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 4096,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            }
            
            response = self.client.invoke_model(
                modelId=model_id,
                body=json.dumps(request_body)
            )
            
            # Handle different response formats
            if hasattr(response['body'], 'read'):
                response_body = json.loads(response['body'].read())
            else:
                response_body = response['body']
            
            content = response_body['content'][0]['text']
            
            logger.info(f"Successfully invoked Claude model: {model_id}")
            return content
            
        except ClientError as e:
            logger.error(f"Bedrock API error: {e}")
            return None
        except Exception as e:
            logger.error(f"Error invoking Claude model: {str(e)}")
            return None
    
    def invoke_titan(self, prompt: str, model_id: str = 'amazon.titan-text-express-v1') -> Optional[str]:
        """
        Invoke Titan model for text generation.
        
        Args:
            prompt: Input prompt for the model
            model_id: Titan model ID to use
            
        Returns:
            Generated text response or None if failed
        """
        try:
            # Prepare request body for Titan
            request_body = {
                "inputText": prompt,
                "textGenerationConfig": {
                    "maxTokenCount": 4096,
                    "temperature": 0.7,
                    "topP": 0.9
                }
            }
            
            response = self.client.invoke_model(
                modelId=model_id,
                body=json.dumps(request_body)
            )
            
            # Handle different response formats
            if hasattr(response['body'], 'read'):
                response_body = json.loads(response['body'].read())
            else:
                response_body = response['body']
            
            content = response_body['results'][0]['outputText']
            
            logger.info(f"Successfully invoked Titan model: {model_id}")
            return content
            
        except ClientError as e:
            logger.error(f"Bedrock API error: {e}")
            return None
        except Exception as e:
            logger.error(f"Error invoking Titan model: {str(e)}")
            return None
    
    def analyze_workflow_context(self, user_input: str, available_data_sources: List[str]) -> Dict[str, Any]:
        """
        Analyze user input to determine workflow context and requirements.
        
        Args:
            user_input: Natural language input from user
            available_data_sources: List of available data source types
            
        Returns:
            Dictionary containing workflow analysis
        """
        try:
            prompt = f"""
            Analyze the following user request and determine the appropriate workflow configuration:
            
            User Input: {user_input}
            Available Data Sources: {', '.join(available_data_sources)}
            
            Please provide a JSON response with the following structure:
            {{
                "sourceType": "web|pdf|excel",
                "dataIdentifier": "description of what to extract",
                "confidence": 0.0-1.0,
                "reasoning": "explanation of the analysis"
            }}
            """
            
            response = self.invoke_claude(prompt)
            
            if response:
                # Try to parse JSON from response
                try:
                    # Extract JSON from response (Claude might wrap it in markdown)
                    json_start = response.find('{')
                    json_end = response.rfind('}') + 1
                    if json_start != -1 and json_end != 0:
                        json_str = response[json_start:json_end]
                        analysis = json.loads(json_str)
                        return analysis
                except json.JSONDecodeError:
                    logger.warning("Failed to parse JSON from Claude response")
            
            # Fallback analysis
            return {
                "sourceType": "web",
                "dataIdentifier": "table",
                "confidence": 0.5,
                "reasoning": "Fallback analysis due to parsing error"
            }
            
        except Exception as e:
            logger.error(f"Error analyzing workflow context: {str(e)}")
            return {
                "sourceType": "web",
                "dataIdentifier": "table",
                "confidence": 0.0,
                "reasoning": f"Error during analysis: {str(e)}"
            }
    
    def generate_ui_controls(self, workflow_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate UI control suggestions based on workflow context.
        
        Args:
            workflow_context: Workflow analysis context
            
        Returns:
            Dictionary containing UI control suggestions
        """
        try:
            prompt = f"""
            Based on the following workflow context, suggest appropriate UI controls:
            
            Workflow Context: {json.dumps(workflow_context, indent=2)}
            
            Please provide a JSON response with the following structure:
            {{
                "controls": [
                    {{
                        "type": "input|select|button|checkbox",
                        "label": "User-friendly label",
                        "key": "unique_identifier",
                        "required": true|false,
                        "options": ["option1", "option2"] // for select controls
                    }}
                ],
                "layout": "vertical|horizontal|grid",
                "reasoning": "explanation of control choices"
            }}
            """
            
            response = self.invoke_claude(prompt)
            
            if response:
                try:
                    json_start = response.find('{')
                    json_end = response.rfind('}') + 1
                    if json_start != -1 and json_end != 0:
                        json_str = response[json_start:json_end]
                        ui_suggestions = json.loads(json_str)
                        return ui_suggestions
                except json.JSONDecodeError:
                    logger.warning("Failed to parse JSON from UI generation response")
            
            # Fallback UI suggestions
            return {
                "controls": [
                    {
                        "type": "input",
                        "label": "Data Source URL",
                        "key": "sourceUri",
                        "required": True
                    },
                    {
                        "type": "input",
                        "label": "Table Identifier",
                        "key": "dataIdentifier",
                        "required": True
                    }
                ],
                "layout": "vertical",
                "reasoning": "Fallback UI controls"
            }
            
        except Exception as e:
            logger.error(f"Error generating UI controls: {str(e)}")
            return {
                "controls": [],
                "layout": "vertical",
                "reasoning": f"Error generating controls: {str(e)}"
            }
    
    def validate_workflow_config(self, workflow_config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate workflow configuration using AI analysis.
        
        Args:
            workflow_config: Workflow configuration to validate
            
        Returns:
            Dictionary containing validation results
        """
        try:
            prompt = f"""
            Validate the following workflow configuration:
            
            Workflow Config: {json.dumps(workflow_config, indent=2)}
            
            Please provide a JSON response with the following structure:
            {{
                "valid": true|false,
                "issues": ["issue1", "issue2"],
                "suggestions": ["suggestion1", "suggestion2"],
                "confidence": 0.0-1.0
            }}
            """
            
            response = self.invoke_claude(prompt)
            
            if response:
                try:
                    json_start = response.find('{')
                    json_end = response.rfind('}') + 1
                    if json_start != -1 and json_end != 0:
                        json_str = response[json_start:json_end]
                        validation = json.loads(json_str)
                        return validation
                except json.JSONDecodeError:
                    logger.warning("Failed to parse JSON from validation response")
            
            # Fallback validation
            return {
                "valid": True,
                "issues": [],
                "suggestions": [],
                "confidence": 0.5
            }
            
        except Exception as e:
            logger.error(f"Error validating workflow config: {str(e)}")
            return {
                "valid": False,
                "issues": [f"Validation error: {str(e)}"],
                "suggestions": ["Check configuration format"],
                "confidence": 0.0
            }


# Convenience function for quick Bedrock operations
def get_bedrock_client(region_name: str = 'us-east-1') -> BedrockClient:
    """
    Get a Bedrock client instance.
    
    Args:
        region_name: AWS region for Bedrock service
        
    Returns:
        BedrockClient instance
    """
    return BedrockClient(region_name)