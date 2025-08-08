import logging
import tempfile
import os
from datetime import datetime, timedelta
from chalice import Chalice, Response, BadRequestError, ChaliceViewError
from chalicelib.web_extractor import extract_web_table
from chalicelib.HKtableextract import scrape_manually_reconstruct

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


@app.route('/extract-hk-immigration', methods=['POST'])
def extract_hk_immigration():
    """Extract HK Immigration passenger statistics for a date range."""
    try:
        request = app.current_request
        
        # Validate request body
        if not request.json_body:
            raise BadRequestError("Request body is required")
        
        config = request.json_body
        logger.info(f"Received HK Immigration extraction request: {config}")
        
        # Validate required fields
        required_fields = ['startDate', 'endDate']
        missing_fields = [
            field for field in required_fields
            if field not in config
        ]
        if missing_fields:
            raise BadRequestError(
                f"Missing required fields: {missing_fields}")
        
        start_date = config['startDate']
        end_date = config['endDate']
        
        # Validate date format (YYYYMMDD)
        try:
            start_dt = datetime.strptime(start_date, "%Y%m%d")
            end_dt = datetime.strptime(end_date, "%Y%m%d")
        except ValueError:
            raise BadRequestError(
                "Invalid date format. Use YYYYMMDD format (e.g., 20250101)")
        
        if start_dt > end_dt:
            raise BadRequestError("Start date must not be after end date")
        
        # Calculate total days for progress tracking
        total_days = (end_dt - start_dt).days + 1
        logger.info(f"Processing {total_days} days from {start_date} to {end_date}")
        
        # Process each date
        all_data = []
        current_date = start_dt
        
        for day_count in range(total_days):
            date_str = current_date.strftime("%Y%m%d")
            logger.info(f"Scraping date {date_str} ({day_count + 1}/{total_days})")
            
            try:
                # Create temporary file for this date's data
                with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as tmp:
                    temp_filename = tmp.name
                
                # Scrape data for this date
                scrape_manually_reconstruct(date_str, temp_filename)
                
                # Read the data back (you could use pandas here if needed)
                # For now, we'll just confirm the file was created
                if os.path.exists(temp_filename):
                    file_size = os.path.getsize(temp_filename)
                    all_data.append({
                        'date': date_str,
                        'status': 'success',
                        'file_size': file_size,
                        'message': f'Successfully extracted data for {date_str}'
                    })
                    # Clean up temp file
                    os.remove(temp_filename)
                else:
                    all_data.append({
                        'date': date_str,
                        'status': 'error',
                        'message': f'No data file created for {date_str}'
                    })
                    
            except Exception as date_error:
                logger.error(f"Error processing date {date_str}: {str(date_error)}")
                all_data.append({
                    'date': date_str,
                    'status': 'error',
                    'message': f'Error extracting data for {date_str}: {str(date_error)}'
                })
            
            current_date += timedelta(days=1)
        
        # Calculate success rate
        successful_days = len([d for d in all_data if d['status'] == 'success'])
        
        return {
            'status': 'completed',
            'message': f'Processed {total_days} days, {successful_days} successful',
            'totalDays': total_days,
            'successfulDays': successful_days,
            'dateRange': {
                'startDate': start_date,
                'endDate': end_date
            },
            'results': all_data
        }
        
    except BadRequestError:
        # Re-raise BadRequestError as-is
        raise
    except Exception as e:
        logger.error(f"Error in HK Immigration extraction: {str(e)}")
        raise ChaliceViewError(f"Internal server error: {str(e)}")


@app.route('/extract-hk-immigration', methods=['OPTIONS'])
def extract_hk_immigration_options():
    """Handle CORS preflight requests for HK Immigration endpoint."""
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
