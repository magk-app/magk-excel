"""
PDF Data Extraction Module for MAGK Excel Backend

This module provides functionality to extract tabular data from PDF documents
using PyMuPDF for text extraction and table parsing.
"""

import logging
import re
import os
import urllib.request
import tempfile
from typing import List, Optional, Any, Union
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

# Set up logging
logger = logging.getLogger(__name__)


class PDFExtractor:
    """
    PDF data extraction class using PyMuPDF.
    
    Handles text-based PDF processing with table detection and parsing,
    including support for various number formats.
    """
    
    def __init__(self):
        """Initialize the PDFExtractor."""
        if fitz is None:
            raise ImportError("PyMuPDF (fitz) is required for PDF processing. Install with: pip install PyMuPDF")
        
        logger.info("PDFExtractor initialized successfully")
    
    def extract_table_data(self, source_uri: str, table_identifier: str) -> List[List[str]]:
        """
        Extract table data from a PDF document.
        
        Args:
            source_uri: File path or URL to the PDF document
            table_identifier: String to identify the specific table
            
        Returns:
            List of lists representing table data (rows and columns)
            
        Raises:
            ValueError: If PDF cannot be opened or table not found
            FileNotFoundError: If PDF file doesn't exist
            urllib.error.URLError: If PDF URL is invalid
        """
        try:
            logger.info(f"Extracting table from PDF: {source_uri}")
            
            # Open PDF document
            pdf_document = self._open_pdf(source_uri)
            
            if not pdf_document:
                raise ValueError(f"Could not open PDF: {source_uri}")
            
            try:
                # Extract text from all pages
                text_content = self._extract_text_from_pdf(pdf_document)
                
                # Find table using identifier
                table_data = self._find_table_by_identifier(text_content, table_identifier)
                
                if not table_data:
                    raise ValueError(f"Table with identifier '{table_identifier}' not found in PDF")
                
                # Process number formats
                processed_data = self._process_number_formats(table_data)
                
                logger.info(f"Successfully extracted {len(processed_data)} rows from PDF table")
                return processed_data
                
            finally:
                pdf_document.close()
                
        except Exception as e:
            logger.error(f"Error extracting table from PDF {source_uri}: {str(e)}")
            raise
    
    def _open_pdf(self, source_uri: str) -> Optional[Any]:
        """
        Open PDF document from file path or URL.
        
        Args:
            source_uri: File path or URL to the PDF
            
        Returns:
            PyMuPDF document object or None if failed
        """
        try:
            if source_uri.startswith(('http://', 'https://')):
                # Download PDF from URL
                logger.info(f"Downloading PDF from URL: {source_uri}")
                
                with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_file:
                    urllib.request.urlretrieve(source_uri, temp_file.name)
                    temp_path = temp_file.name
                
                try:
                    pdf_document = fitz.open(temp_path)
                    logger.info("PDF downloaded and opened successfully")
                    return pdf_document
                finally:
                    # Clean up temporary file
                    os.unlink(temp_path)
            
            else:
                # Open local PDF file
                if not os.path.exists(source_uri):
                    raise FileNotFoundError(f"PDF file not found: {source_uri}")
                
                pdf_document = fitz.open(source_uri)
                logger.info("Local PDF opened successfully")
                return pdf_document
                
        except FileNotFoundError:
            # Re-raise FileNotFoundError as-is
            raise
        except Exception as e:
            logger.error(f"Error opening PDF {source_uri}: {str(e)}")
            return None
    
    def _extract_text_from_pdf(self, pdf_document) -> str:
        """
        Extract text content from all pages of the PDF.
        
        Args:
            pdf_document: PyMuPDF document object
            
        Returns:
            Combined text content from all pages
        """
        try:
            text_content = ""
            
            for page_num in range(len(pdf_document)):
                page = pdf_document.load_page(page_num)
                page_text = page.get_text()
                text_content += page_text + "\n"
                
                logger.debug(f"Extracted text from page {page_num + 1}")
            
            logger.info(f"Extracted text from {len(pdf_document)} pages")
            return text_content
            
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {str(e)}")
            raise
    
    def _find_table_by_identifier(self, text_content: str, table_identifier: str) -> Optional[List[List[str]]]:
        """
        Find table data using the provided identifier.
        
        Args:
            text_content: Full text content from PDF
            table_identifier: String to identify the specific table
            
        Returns:
            List of lists representing table data or None if not found
        """
        try:
            # Split text into lines
            lines = text_content.split('\n')
            
            # Find the section containing the table identifier
            table_start_idx = None
            for i, line in enumerate(lines):
                if table_identifier.lower() in line.lower():
                    table_start_idx = i
                    break
            
            if table_start_idx is None:
                logger.warning(f"Table identifier '{table_identifier}' not found in PDF text")
                return None
            
            # Extract table data starting from the identifier line
            table_data = self._parse_table_lines(lines[table_start_idx:])
            
            return table_data
            
        except Exception as e:
            logger.error(f"Error finding table with identifier '{table_identifier}': {str(e)}")
            return None
    
    def _parse_table_lines(self, lines: List[str]) -> List[List[str]]:
        """
        Parse lines of text to extract tabular data.
        
        Args:
            lines: List of text lines to parse
            
        Returns:
            List of lists representing table data
        """
        try:
            table_data = []
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # Skip lines that are likely headers or non-data
                if self._is_header_line(line):
                    continue
                
                # Parse line into columns
                row_data = self._parse_table_row(line)
                
                if row_data and len(row_data) > 1:  # At least 2 columns to be considered a table row
                    table_data.append(row_data)
                
                # Stop parsing if we encounter a clear end of table
                if self._is_table_end(line):
                    break
            
            return table_data
            
        except Exception as e:
            logger.error(f"Error parsing table lines: {str(e)}")
            return []
    
    def _is_header_line(self, line: str) -> bool:
        """
        Determine if a line is likely a header (non-data).
        
        Args:
            line: Text line to analyze
            
        Returns:
            True if line appears to be a header
        """
        # Common header indicators
        header_indicators = [
            'page', 'total', 'summary', 'report', 'statement',
            'period', 'date', 'year', 'quarter', 'month'
        ]
        
        line_lower = line.lower()
        
        # Check if line contains header indicators
        for indicator in header_indicators:
            if indicator in line_lower:
                return True
        
        # Check if line is mostly uppercase (common for headers)
        if len(line) > 3 and line.isupper():
            return True
        
        # Check if line contains mostly non-alphanumeric characters
        alphanumeric_count = sum(1 for c in line if c.isalnum())
        if len(line) > 0 and alphanumeric_count / len(line) < 0.3:
            return True
        
        return False
    
    def _is_table_end(self, line: str) -> bool:
        """
        Determine if a line indicates the end of a table.
        
        Args:
            line: Text line to analyze
            
        Returns:
            True if line appears to end the table
        """
        # Common table end indicators
        end_indicators = [
            'total', 'sum', 'grand total', 'subtotal',
            'notes:', 'footnotes:', 'source:', 'reference:'
        ]
        
        line_lower = line.lower()
        
        for indicator in end_indicators:
            if indicator in line_lower:
                return True
        
        return False
    
    def _parse_table_row(self, line: str) -> List[str]:
        """
        Parse a single line into table columns.
        
        Args:
            line: Text line to parse
            
        Returns:
            List of column values
        """
        try:
            # Try different parsing strategies
            
            # Strategy 1: Split by multiple spaces (common in PDF tables)
            if '  ' in line:
                columns = re.split(r'\s{2,}', line)
                columns = [col.strip() for col in columns if col.strip()]
                if len(columns) > 1:
                    return columns
            
            # Strategy 2: Split by tabs
            if '\t' in line:
                columns = line.split('\t')
                columns = [col.strip() for col in columns if col.strip()]
                if len(columns) > 1:
                    return columns
            
            # Strategy 3: Split by commas (if not part of numbers)
            if ',' in line:
                # Use regex to avoid splitting numbers with commas
                columns = re.split(r',(?![0-9])', line)
                columns = [col.strip() for col in columns if col.strip()]
                if len(columns) > 1:
                    return columns
            
            # Strategy 4: Split by single spaces (fallback)
            columns = line.split()
            if len(columns) > 1:
                return columns
            
            # If all else fails, return the line as a single column
            return [line] if line else []
            
        except Exception as e:
            logger.error(f"Error parsing table row '{line}': {str(e)}")
            return [line] if line else []
    
    def _process_number_formats(self, table_data: List[List[str]]) -> List[List[str]]:
        """
        Process and normalize number formats in table data.
        
        Args:
            table_data: Raw table data
            
        Returns:
            Processed table data with normalized number formats
        """
        try:
            processed_data = []
            
            for row in table_data:
                processed_row = []
                
                for cell in row:
                    processed_cell = self._normalize_number_format(cell)
                    processed_row.append(processed_cell)
                
                processed_data.append(processed_row)
            
            return processed_data
            
        except Exception as e:
            logger.error(f"Error processing number formats: {str(e)}")
            return table_data
    
    def _normalize_number_format(self, cell: str) -> str:
        """
        Normalize number format in a cell.
        
        Args:
            cell: Cell value to normalize
            
        Returns:
            Normalized cell value
        """
        try:
            if not cell or not cell.strip():
                return cell
            
            cell = cell.strip()
            
            # Handle accounting negative format: (123.45) -> -123.45
            if cell.startswith('(') and cell.endswith(')'):
                number_part = cell[1:-1]  # Remove parentheses
                if self._is_number(number_part):
                    return f"-{number_part}"
            
            # Handle comma-separated numbers: 1,234.56 -> 1234.56
            if ',' in cell and self._is_number_with_commas(cell):
                # Remove commas from numbers
                cell = re.sub(r',(?=\d)', '', cell)
                # Remove currency symbols for comma-separated numbers
                cell = re.sub(r'[\$€£¥]', '', cell)
            
            # Preserve units and currency symbols
            # This is a simplified approach - in production, you might want more sophisticated parsing
            
            return cell
            
        except Exception as e:
            logger.error(f"Error normalizing number format for '{cell}': {str(e)}")
            return cell
    
    def _is_number(self, text: str) -> bool:
        """
        Check if text represents a number.
        
        Args:
            text: Text to check
            
        Returns:
            True if text is a number
        """
        try:
            # Remove common currency symbols and units
            cleaned_text = re.sub(r'[\$€£¥%]', '', text.strip())
            
            # Check if it's a valid number
            float(cleaned_text)
            return True
        except ValueError:
            return False
    
    def _is_number_with_commas(self, text: str) -> bool:
        """
        Check if text represents a number with commas.
        
        Args:
            text: Text to check
            
        Returns:
            True if text is a number with commas
        """
        try:
            # Remove currency symbols first
            cleaned_text = re.sub(r'[\$€£¥%]', '', text.strip())
            # Pattern for numbers with commas: 1,234.56 or 1,234
            pattern = r'^[\d,]+\.?\d*$'
            return bool(re.match(pattern, cleaned_text))
        except Exception:
            return False
    
    def close(self):
        """Close the PDFExtractor (no-op for PDFExtractor)."""
        # PDFExtractor doesn't maintain persistent connections
        pass


def extract_pdf_table(source_uri: str, table_identifier: str) -> List[List[str]]:
    """
    Convenience function to extract table data from a PDF document.
    
    Args:
        source_uri: File path or URL to the PDF document
        table_identifier: String to identify the specific table
        
    Returns:
        List of lists representing table data
        
    Raises:
        ValueError: If table cannot be found or extracted
        ImportError: If PyMuPDF is not installed
    """
    extractor = PDFExtractor()
    try:
        return extractor.extract_table_data(source_uri, table_identifier)
    finally:
        extractor.close()