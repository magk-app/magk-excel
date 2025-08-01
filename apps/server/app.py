import logging
from chalice import Chalice, Response, BadRequestError, ChaliceViewError
from chalicelib.lambda_web_extractor import extract_web_table

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

        elif source_type in ['pdf', 'excel']:
            # TODO: Implement PDF and Excel extraction in future stories
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
