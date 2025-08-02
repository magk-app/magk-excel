import logging
from chalice import Chalice, Response, BadRequestError, ChaliceViewError
from chalicelib.web_extractor import extract_web_table
from chalicelib.pdf_extractor import extract_pdf_table
from chalicelib.bedrock_client import get_bedrock_client

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Chalice(app_name='magk-excel-backend')


@app.route('/')
def index():
    return {'message': 'MAGK Excel Backend API'}


@app.route('/health')
def health():
    return {'status': 'healthy', 'service': 'magk-excel-backend'}


@app.route('/execute-workflow', methods=['POST'])
def execute_workflow():
    """Execute data extraction workflow based on WorkflowConfig."""
    try:
        request = app.current_request

        # Validate request body
        if not request.json_body:
            raise BadRequestError("Request body is required")

        workflow_config = request.json_body
        logger.info(f"Received workflow config: {workflow_config}")

        # Validate required fields
        required_fields = ['sourceType', 'sourceUri', 'dataIdentifier']
        missing_fields = [
            field for field in required_fields
            if field not in workflow_config
        ]
        if missing_fields:
            raise BadRequestError(
                f"Missing required fields: {missing_fields}")

        # Validate workflow configuration using Bedrock AI
        try:
            bedrock_client = get_bedrock_client()
            validation_result = bedrock_client.validate_workflow_config(workflow_config)
            
            if not validation_result.get('valid', True):
                logger.warning(f"Workflow validation issues: {validation_result.get('issues', [])}")
                # Continue with warning, but log the issues
        except Exception as e:
            logger.warning(f"Bedrock validation failed, continuing without AI validation: {str(e)}")

        source_type = workflow_config['sourceType']
        source_uri = workflow_config['sourceUri']
        data_identifier = workflow_config['dataIdentifier']

        # Handle web source type
        if source_type == 'web':
            logger.info(f"Processing web extraction for URL: {source_uri}")

            # Extract table data
            table_data = extract_web_table(source_uri, data_identifier)

            if not table_data:
                raise ChaliceViewError(
                    "No data extracted from the specified table")

            logger.info(
                f"Successfully extracted {len(table_data)} rows "
                f"from web source")

            # TODO: Convert table_data to Excel and upload to S3
            # For now, return the data directly for testing
            return {
                'status': 'success',
                'message': f'Successfully extracted {len(table_data)} rows',
                'rowCount': len(table_data),
                'columnCount': len(table_data[0]) if table_data else 0,
                'sampleData': table_data[:3],  # First 3 rows
                'outputUrl': 'https://example.com/placeholder-output.xlsx'
            }

        elif source_type == 'pdf':
            logger.info(f"Processing PDF extraction for source: {source_uri}")
            
            # Check if data_identifier is a natural language prompt or simple identifier
            is_prompt = self._is_natural_language_prompt(data_identifier)
            
            if is_prompt:
                # Use LLM-based extraction for natural language prompts
                from chalicelib.pdf_extractor import PDFExtractor
                
                extractor = PDFExtractor()
                try:
                    bedrock_client = get_bedrock_client()
                    extracted_tables = extractor.extract_tables_with_llm(
                        source_uri, data_identifier, bedrock_client
                    )
                    
                    if not extracted_tables:
                        raise ChaliceViewError(
                            f"No tables found matching prompt: '{data_identifier}'")
                    
                    # Return information about all extracted tables
                    total_rows = sum(table['row_count'] for table in extracted_tables)
                    
                    return {
                        'status': 'success',
                        'message': f'Successfully extracted {len(extracted_tables)} tables with {total_rows} total rows',
                        'tableCount': len(extracted_tables),
                        'totalRows': total_rows,
                        'tables': [
                            {
                                'title': table['title'],
                                'description': table['description'],
                                'rowCount': table['row_count'],
                                'columnCount': table['column_count'],
                                'confidence': table['confidence'],
                                'sampleData': table['data'][:3] if table['data'] else []
                            }
                            for table in extracted_tables
                        ],
                        'outputUrl': 'https://example.com/placeholder-output.xlsx'
                    }
                finally:
                    extractor.close()
            else:
                # Use traditional extraction for simple identifiers
                table_data = extract_pdf_table(source_uri, data_identifier)
                
                if not table_data:
                    raise ChaliceViewError(
                        "No data extracted from the specified PDF table")
                
                logger.info(
                    f"Successfully extracted {len(table_data)} rows "
                    f"from PDF source")
                
                # TODO: Convert table_data to Excel and upload to S3
                # For now, return the data directly for testing
                return {
                    'status': 'success',
                    'message': f'Successfully extracted {len(table_data)} rows from PDF',
                    'rowCount': len(table_data),
                    'columnCount': len(table_data[0]) if table_data else 0,
                    'sampleData': table_data[:3],  # First 3 rows
                    'outputUrl': 'https://example.com/placeholder-output.xlsx'
                }
            
        elif source_type == 'excel':
            # TODO: Implement Excel extraction in future stories
            raise ChaliceViewError(
                f"Source type '{source_type}' not yet implemented")

        else:
            raise BadRequestError(
                f"Unsupported source type: {source_type}")

    except BadRequestError:
        # Re-raise BadRequestError as-is
        raise
    except Exception as e:
        logger.error(f"Error processing workflow: {str(e)}")
        raise ChaliceViewError(f"Internal server error: {str(e)}")


@app.middleware('http')
def add_cors_headers(event, get_response):
    """Add CORS headers to all responses."""
    response = get_response(event)
    response.headers.update({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': (
            'Content-Type,X-Amz-Date,Authorization,X-Api-Key'),
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    })
    return response


@app.route('/analyze-workflow', methods=['POST'])
def analyze_workflow():
    """Analyze user input and suggest workflow configuration using AI."""
    try:
        request = app.current_request

        # Validate request body
        if not request.json_body:
            raise BadRequestError("Request body is required")

        user_input = request.json_body.get('userInput')
        if not user_input:
            raise BadRequestError("userInput field is required")

        logger.info(f"Analyzing workflow for user input: {user_input}")

        # Get Bedrock client and analyze workflow
        try:
            bedrock_client = get_bedrock_client()
            
            # Analyze workflow context
            analysis = bedrock_client.analyze_workflow_context(
                user_input, 
                ['web', 'pdf', 'excel']
            )
            
            # Generate UI controls
            ui_suggestions = bedrock_client.generate_ui_controls(analysis)
            
            return {
                'status': 'success',
                'analysis': analysis,
                'uiSuggestions': ui_suggestions
            }
            
        except Exception as e:
            logger.error(f"Bedrock analysis failed: {str(e)}")
            raise ChaliceViewError(f"AI analysis failed: {str(e)}")

    except BadRequestError:
        raise
    except Exception as e:
        logger.error(f"Error analyzing workflow: {str(e)}")
        raise ChaliceViewError(f"Internal server error: {str(e)}")


@app.route('/analyze-workflow', methods=['OPTIONS'])
def analyze_workflow_options():
    """Handle CORS preflight requests for analyze-workflow."""
    return Response(
        body='',
        status_code=200,
        headers={
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': (
                'Content-Type,X-Amz-Date,Authorization,X-Api-Key'),
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        }
    )


def _is_natural_language_prompt(data_identifier: str) -> bool:
    """
    Determine if data_identifier is a natural language prompt or simple table identifier.
    
    Args:
        data_identifier: The data identifier string to analyze
        
    Returns:
        True if it appears to be a natural language prompt
    """
    # Simple heuristics to detect natural language prompts
    prompt_indicators = [
        'get', 'find', 'extract', 'show', 'table', 'data', 'information',
        'list', 'report', 'summary', 'analysis', 'by', 'with', 'for',
        'containing', 'including', 'related to', 'about'
    ]
    
    # Check for common prompt words and sentence structure
    data_lower = data_identifier.lower()
    word_count = len(data_identifier.split())
    
    # If it's longer than 3 words, likely a prompt
    if word_count > 3:
        return True
    
    # Check for prompt indicators
    for indicator in prompt_indicators:
        if indicator in data_lower:
            return True
    
    # If it contains question words or phrases
    question_indicators = ['what', 'which', 'where', 'how', 'who', 'when']
    for indicator in question_indicators:
        if indicator in data_lower:
            return True
    
    return False


@app.route('/execute-workflow', methods=['OPTIONS'])
def execute_workflow_options():
    """Handle CORS preflight requests."""
    return Response(
        body='',
        status_code=200,
        headers={
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': (
                'Content-Type,X-Amz-Date,Authorization,X-Api-Key'),
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        }
    )
