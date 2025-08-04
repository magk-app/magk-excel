"""
FastAPI application for MAGK Excel PDF Table Extraction

Provides endpoints for extracting tabular data from PDF documents
using natural language prompts or returning all tables.
"""

import logging
from typing import List, Dict, Any, Optional, Union
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field
import uvicorn

from chalicelib.pdf_extractor import PDFExtractor, extract_pdf_tables_with_prompt
from chalicelib.bedrock_client import get_bedrock_client

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="MAGK Excel PDF Table Extraction API",
    description="Extract tabular data from PDF documents using natural language prompts",
    version="1.0.0"
)

# Request/Response Models
class PDFExtractionRequest(BaseModel):
    """Request model for PDF table extraction."""
    pdf_source: str = Field(..., description="URL or file path to the PDF document")
    prompt: Optional[str] = Field(None, description="Natural language prompt describing what table to extract")

class TableData(BaseModel):
    """Model for extracted table data."""
    title: str = Field(..., description="Table title or identifier")
    description: str = Field(..., description="Brief description of table contents")
    data: List[List[str]] = Field(..., description="Table data as rows and columns")
    headers: Optional[List[str]] = Field(None, description="Column headers for the table")
    row_count: int = Field(..., description="Number of rows in the table")
    column_count: int = Field(..., description="Number of columns in the table")
    confidence: float = Field(..., description="Confidence score for table extraction")

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

@app.get("/", response_model=Dict[str, str])
async def root():
    """Health check endpoint."""
    return {"message": "MAGK Excel PDF Table Extraction API", "status": "healthy"}

@app.get("/health", response_model=Dict[str, str])
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "service": "magk-excel-pdf-extractor"}

@app.post("/extract-tables", response_model=Union[PDFExtractionResponse, ErrorResponse])
async def extract_tables(request: PDFExtractionRequest):
    """
    Extract tables from a PDF document.
    
    If no prompt is provided, returns all formatted tables found in the PDF.
    If a prompt is provided, searches for tables matching the prompt description.
    """
    try:
        logger.info(f"Processing PDF extraction request for: {request.pdf_source}")
        
        # Validate PDF source
        if not request.pdf_source or not request.pdf_source.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ErrorResponse(
                    error="PDF source is required",
                    suggestion="Please provide a valid URL or file path to the PDF document"
                ).dict()
            )
        
        # Initialize PDF extractor
        extractor = PDFExtractor()
        
        try:
            if request.prompt and request.prompt.strip():
                # Extract specific tables based on prompt
                logger.info(f"Extracting tables with prompt: '{request.prompt}'")
                
                try:
                    # Use LLM-based extraction for natural language prompts
                    bedrock_client = get_bedrock_client()
                    extraction_result = extractor.extract_tables_with_llm(
                        request.pdf_source, request.prompt.strip(), bedrock_client
                    )
                    
                    # Check if extraction failed
                    if not extraction_result.get('success', False):
                        raise HTTPException(
                            status_code=status.HTTP_404_NOT_FOUND,
                            detail=ErrorResponse(
                                error=extraction_result.get('error', f"No tables found matching prompt: '{request.prompt}'"),
                                suggestion="Try refining your prompt or check if the table exists in the PDF. Examples: 'financial data table', 'revenue by quarter', 'balance sheet assets'"
                            ).dict()
                        )
                    
                    # Convert to response format (single table result)
                    table_data = TableData(
                        title=extraction_result.get('title', 'Unknown Table'),
                        description=extraction_result.get('match_reasoning', ''),
                        data=extraction_result.get('table_data', []),
                        headers=extraction_result.get('headers', None),
                        row_count=extraction_result.get('row_count', 0),
                        column_count=extraction_result.get('column_count', 0),
                        confidence=extraction_result.get('match_confidence', 0.5)
                    )
                    tables_data = [table_data]
                    
                    return PDFExtractionResponse(
                        status="success",
                        message=f"Successfully found {len(tables_data)} table(s) matching your prompt",
                        tables=tables_data,
                        total_tables=len(tables_data)
                    )
                    
                except ValueError as e:
                    error_msg = str(e)
                    if "No tables found matching prompt" in error_msg:
                        raise HTTPException(
                            status_code=status.HTTP_404_NOT_FOUND,
                            detail=ErrorResponse(
                                error=error_msg,
                                suggestion="Try refining your prompt to be more specific. Examples: 'extract revenue table', 'find balance sheet data', 'quarterly financial results'. Also verify that the table exists in the PDF."
                            ).dict()
                        )
                    else:
                        raise HTTPException(
                            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                            detail=ErrorResponse(
                                error=f"PDF processing error: {error_msg}",
                                suggestion="Check if the PDF file is accessible and contains readable text. Scanned PDFs may not work properly."
                            ).dict()
                        )
                        
            else:
                # Extract all tables from the PDF
                logger.info("Extracting all tables from PDF")
                
                try:
                    # For all tables extraction, we'll use extract_all_tables_from_pdf directly
                    all_tables = extractor.extract_all_tables_from_pdf(request.pdf_source)
                    
                    if not all_tables:
                        raise HTTPException(
                            status_code=status.HTTP_404_NOT_FOUND,
                            detail=ErrorResponse(
                                error="No tables found in the PDF document",
                                suggestion="The PDF may not contain any tabular data, or the tables might be in image format which cannot be extracted."
                            ).dict()
                        )
                    
                    # Convert to response format
                    tables_data = []
                    for table in all_tables:
                        tables_data.append(TableData(
                            title=table.get('title', 'Unknown Table'),
                            description=f"Table with {table.get('row_count', 0)} rows and {table.get('column_count', 0)} columns",
                            data=table.get('data', []),
                            headers=table.get('headers', None),
                            row_count=table.get('row_count', 0),
                            column_count=table.get('column_count', 0),
                            confidence=0.9  # High confidence for direct extraction
                        ))
                    
                    return PDFExtractionResponse(
                        status="success",
                        message=f"Successfully extracted {len(tables_data)} table(s) from the PDF",
                        tables=tables_data,
                        total_tables=len(tables_data)
                    )
                    
                except ValueError as e:
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail=ErrorResponse(
                            error=f"PDF processing error: {str(e)}",
                            suggestion="Check if the PDF file is accessible and contains readable text. Scanned PDFs may not work properly."
                        ).dict()
                    )
                    
        finally:
            extractor.close()
            
    except HTTPException:
        # Re-raise HTTPExceptions as-is
        raise
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ErrorResponse(
                error=f"PDF file not found: {str(e)}",
                suggestion="Check that the file path is correct and the file exists, or verify that the URL is accessible."
            ).dict()
        )
    except Exception as e:
        logger.error(f"Unexpected error during PDF extraction: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorResponse(
                error=f"Internal server error: {str(e)}",
                suggestion="Please try again. If the problem persists, check the server logs for more details."
            ).dict()
        )

@app.post("/extract-specific-table", response_model=Union[TableData, ErrorResponse])
async def extract_specific_table(request: PDFExtractionRequest):
    """
    Extract a specific table from a PDF document using a prompt.
    Returns only the first matching table.
    """
    if not request.prompt or not request.prompt.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ErrorResponse(
                error="Prompt is required for specific table extraction",
                suggestion="Please provide a natural language description of the table you want to extract"
            ).dict()
        )
    
    # Use the main extraction endpoint and return only the first table
    response = await extract_tables(request)
    
    if isinstance(response, ErrorResponse):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=response.dict())
    
    if response.tables:
        return response.tables[0]
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ErrorResponse(
                error="No matching table found",
                suggestion="Try refining your prompt to be more specific about the table you're looking for"
            ).dict()
        )

# Add CORS middleware for client access
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)