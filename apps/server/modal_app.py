"""
Modal deployment of MAGK Excel FastAPI application.

This module provides a complete FastAPI application for deployment on Modal.com
with proper webhook handling and input processing following Modal's documentation.
"""

import modal
from typing import List, Dict, Any, Optional, Union
import logging
from pydantic import BaseModel, Field
from chalicelib.pdf_extractor import PDFExtractor

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Modal app
app = modal.App("magk-excel-api")

# Define the Modal image with all required dependencies
image = (
    modal.Image.debian_slim(python_version="3.10")
    .pip_install(
        "fastapi[standard]",
        "pydantic>=2.0",
        "boto3",
        "pymupdf",
        "pdfplumber",
        "openpyxl",
        "requests",
        "selenium",
        "webdriver-manager",
    )
    .add_local_dir("chalicelib", remote_path="/root/chalicelib")
)

# Pydantic Models for Request/Response Validation
class PDFExtractionRequest(BaseModel):
    """Request model for PDF table extraction with input validation."""
    pdf_source: str = Field(
        ..., 
        description="URL or file path to the PDF document",
        min_length=1
    )
    prompt: Optional[str] = Field(
        None, 
        description="Natural language prompt describing what table to extract"
    )

class TableData(BaseModel):
    """Model for extracted table data."""
    title: str = Field(..., description="Table title or identifier")
    description: str = Field(..., description="Brief description of table contents")
    data: List[List[str]] = Field(..., description="Table data as rows and columns")
    headers: Optional[List[str]] = Field(None, description="Column headers for the table")
    row_count: int = Field(..., description="Number of rows in the table")
    column_count: int = Field(..., description="Number of columns in the table")
    confidence: float = Field(..., description="Confidence score for table extraction", ge=0.0, le=1.0)

class PDFExtractionResponse(BaseModel):
    """Response model for PDF table extraction."""
    status: str = Field(..., description="Status of the extraction operation")
    message: str = Field(..., description="Human-readable message about the result")
    tables: List[TableData] = Field(..., description="List of extracted tables")
    total_tables: int = Field(..., description="Total number of tables found")

class ErrorResponse(BaseModel):
    """Error response model."""
    status: str = Field(default="error", description="Status indicating error")
    error: str = Field(..., description="Error message")
    suggestion: str = Field(..., description="Suggestion for resolving the error")

# Main table extraction endpoint
@app.function(
    image=image,
    secrets=[
        modal.secret.Secret.from_name("aws-credentials"),  # AWS credentials for Bedrock
    ],
    cpu=2.0,
    memory=4096,
    timeout=600,  # 10 minutes timeout for PDF processing
)
@modal.fastapi_endpoint(method="POST")
def extract_tables(item: PDFExtractionRequest):
    """
    Extract tables from a PDF document via Modal webhook.
    
    Processes PDF documents and extracts tabular data using AI.
    Handles both URL and file-based PDF sources.
    """
    try:
        logger.info(f"Processing PDF extraction request for: {item.pdf_source}")
        
        # Validate PDF source
        if not item.pdf_source or not item.pdf_source.strip():
            return ErrorResponse(
                error="PDF source is required",
                suggestion="Please provide a valid URL or file path to the PDF document"
            ).dict()
        
        # Initialize PDF extractor and extract all tables
        extractor = PDFExtractor()
        
        try:
            # Extract all tables from PDF
            extracted_tables = extractor.extract_all_tables_from_pdf(item.pdf_source)
            
            if not extracted_tables:
                return ErrorResponse(
                    error="No tables found in the PDF document",
                    suggestion="Ensure the PDF contains tabular data that can be extracted"
                ).dict()
            
            # Convert extracted tables to TableData format
            table_data_list = []
            for table_info in extracted_tables:
                table_data = TableData(
                    title=table_info.get('title', f"Table {table_info['table_index']}"),
                    description=f"Table extracted from page {table_info['page_number']} with {table_info['row_count']} rows and {table_info['column_count']} columns",
                    data=table_info['data'],
                    headers=table_info['headers'] if table_info['headers'] else None,
                    row_count=table_info['row_count'],
                    column_count=table_info['column_count'],
                    confidence=0.9 if table_info.get('has_numeric_data', False) else 0.7
                )
                table_data_list.append(table_data)
            
            response = PDFExtractionResponse(
                status="success",
                message=f"Successfully extracted {len(table_data_list)} table(s) from PDF: {item.pdf_source}",
                tables=table_data_list,
                total_tables=len(table_data_list)
            )
            
        finally:
            extractor.close()
        
        logger.info("PDF extraction completed successfully")
        return response.dict()
        
    except Exception as e:
        logger.error(f"Error processing PDF extraction: {str(e)}")
        return ErrorResponse(
            error=f"Processing error: {str(e)}",
            suggestion="Check that the PDF source is accessible and contains tabular data"
        ).dict()

# Specific table extraction endpoint
@app.function(
    image=image,
    secrets=[
        modal.secret.Secret.from_name("aws-credentials"),
    ],
    cpu=2.0,
    memory=4096,
    timeout=600,
)
@modal.fastapi_endpoint(method="POST")
def extract_specific_table(item: PDFExtractionRequest):
    """
    Extract a specific table from a PDF document using a natural language prompt.
    
    Returns only the first matching table based on the provided prompt.
    """
    try:
        if not item.prompt or not item.prompt.strip():
            return ErrorResponse(
                error="Prompt is required for specific table extraction",
                suggestion="Please provide a natural language description of the table you want to extract"
            ).dict()
        
        logger.info(f"Processing specific table extraction with prompt: '{item.prompt}'")
        
        # Initialize PDF extractor and extract table using LLM
        extractor = PDFExtractor()
        
        try:
            # Use LLM to find and extract the specific table matching the prompt
            extraction_result = extractor.extract_tables_with_llm(item.pdf_source, item.prompt)
            
            if not extraction_result.get('success', False):
                return ErrorResponse(
                    error=extraction_result.get('error', 'Failed to extract table'),
                    suggestion="Try a more specific prompt describing the table you want to extract"
                ).dict()
            
            # Convert the result to TableData format
            specific_table = TableData(
                title=extraction_result.get('title', f"Table matching: {item.prompt}"),
                description=f"Table extracted using prompt: '{item.prompt}'. {extraction_result.get('match_reasoning', '')}",
                data=extraction_result['table_data'],
                headers=extraction_result.get('headers'),
                row_count=extraction_result['row_count'],
                column_count=extraction_result['column_count'],
                confidence=extraction_result.get('match_confidence', 0.8)
            )
            
            logger.info(f"Specific table extraction completed successfully. Scanned {extraction_result.get('total_tables_scanned', 0)} tables.")
            return specific_table.dict()
            
        finally:
            extractor.close()
        
    except Exception as e:
        logger.error(f"Error in specific table extraction: {str(e)}")
        return ErrorResponse(
            error=str(e),
            suggestion="Please check your request and try again"
        ).dict()

# Health check endpoint
@app.function(image=image)
@modal.fastapi_endpoint(method="GET")
def health():
    """Health check endpoint for Modal deployment."""
    return {
        "status": "healthy",
        "service": "magk-excel-pdf-extractor-modal",
        "deployment": "modal",
        "timestamp": "2025-01-08T10:00:00Z"
    }

# Root endpoint providing API documentation
@app.function(image=image)
@modal.fastapi_endpoint(method="GET")
def root():
    """Root endpoint providing API information and available endpoints."""
    return {
        "message": "MAGK Excel PDF Table Extraction API on Modal",
        "status": "healthy",
        "version": "1.0.0",
        "endpoints": {
            "/extract-tables": {
                "method": "POST",
                "description": "Extract all tables or tables matching a prompt",
                "input": "PDFExtractionRequest (pdf_source, optional prompt)"
            },
            "/extract-specific-table": {
                "method": "POST", 
                "description": "Extract a specific table using a natural language prompt",
                "input": "PDFExtractionRequest (pdf_source, prompt required)"
            },
            "/health": {
                "method": "GET",
                "description": "Health check endpoint"
            }
        },
        "example_request": {
            "pdf_source": "https://abc.xyz/assets/51/e1/bf43f01041f6a8882a29d7e89cae/goog-10-q-q1-2025.pdf",
            "prompt": "extract revenue data table"
        }
    }

# Local development and deployment
if __name__ == "__main__":
    # For local testing: modal serve modal_app.py
    # For deployment: modal deploy modal_app.py
    pass