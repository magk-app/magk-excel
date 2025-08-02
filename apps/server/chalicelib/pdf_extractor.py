"""
PDF Data Extraction Module for MAGK Excel Backend

This module provides functionality to extract tabular data from PDF documents
using PyMuPDF for text extraction and table parsing.
"""

import logging
import re
import os
import json
import urllib.request
import tempfile
from typing import List, Optional, Any, Union, Dict
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
    
    def extract_tables_with_llm(self, source_uri: str, prompt: str, bedrock_client=None) -> List[Dict[str, Any]]:
        """
        Extract tables from a PDF document using LLM-based analysis.
        
        Args:
            source_uri: File path or URL to the PDF document
            prompt: Natural language description of what tables to find
            bedrock_client: Optional bedrock client instance
            
        Returns:
            List of dictionaries containing extracted table information
            
        Raises:
            ValueError: If PDF cannot be opened or no tables found
            FileNotFoundError: If PDF file doesn't exist
            urllib.error.URLError: If PDF URL is invalid
        """
        try:
            from .bedrock_client import get_bedrock_client
            
            logger.info(f"Extracting tables from PDF using LLM: {source_uri}")
            
            # Open PDF document
            pdf_document = self._open_pdf(source_uri)
            
            if not pdf_document:
                raise ValueError(f"Could not open PDF: {source_uri}")
            
            try:
                # Extract text from all pages
                text_content = self._extract_text_from_pdf(pdf_document)
                
                # Initialize bedrock client if not provided
                if bedrock_client is None:
                    bedrock_client = get_bedrock_client()
                
                # Use LLM to analyze PDF content and identify tables
                analysis_result = self._analyze_pdf_content_with_llm(text_content, prompt, bedrock_client)
                
                if not analysis_result or not analysis_result.get('tables'):
                    raise ValueError(f"No tables found matching prompt: '{prompt}'")
                
                # Extract and process each identified table
                extracted_tables = []
                for table_info in analysis_result['tables']:
                    table_data = self._extract_table_by_llm_analysis(text_content, table_info)
                    if table_data:
                        # Process number formats
                        processed_data = self._process_number_formats(table_data)
                        
                        extracted_tables.append({
                            'title': table_info.get('title', 'Unknown Table'),
                            'description': table_info.get('description', ''),
                            'data': processed_data,
                            'row_count': len(processed_data),
                            'column_count': len(processed_data[0]) if processed_data else 0,
                            'confidence': table_info.get('confidence', 0.5)
                        })
                
                if not extracted_tables:
                    raise ValueError(f"Failed to extract table data matching prompt: '{prompt}'")
                
                logger.info(f"Successfully extracted {len(extracted_tables)} tables from PDF")
                return extracted_tables
                
            finally:
                pdf_document.close()
                
        except Exception as e:
            logger.error(f"Error extracting tables from PDF {source_uri} with LLM: {str(e)}")
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
                
                if row_data and len(row_data) > 0:  # Any non-empty row is considered table data
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
        Normalize number format in a cell by removing symbols and formatting.
        Enhanced to handle percentages, dashes as zeros, and other formats.
        
        Args:
            cell: Cell value to normalize
            
        Returns:
            Normalized cell value with symbols removed
        """
        try:
            if not cell or not cell.strip():
                return cell
            
            original_cell = cell.strip()
            
            # Handle dash as zero
            if original_cell == '-':
                return '0'
            
            # Handle percentages FIRST - preserve % and handle parentheses specially for percentages
            if '%' in original_cell:
                # Handle negative percentages in parentheses: (25.5%) -> (25.5%)
                if original_cell.startswith('(') and original_cell.endswith(')') and '%' in original_cell:
                    return original_cell  # Preserve negative percentages in parentheses as-is
                
                # Extract the numeric part before %
                percent_match = re.search(r'([\d,]+\.?\d*)%', original_cell)
                if percent_match:
                    number_part = percent_match.group(1)
                    # Remove commas from the number part
                    cleaned_number = re.sub(r',', '', number_part)
                    return f"{cleaned_number}%"
                # If no clear numeric pattern, return as-is
                return original_cell
            
            # Handle accounting negative format: (123.45) -> -123.45 (but not for percentages)
            if original_cell.startswith('(') and original_cell.endswith(')'):
                number_part = original_cell[1:-1]  # Remove parentheses
                # Remove currency symbols and commas from the number part
                cleaned_number = re.sub(r'[\$€£¥,]', '', number_part)
                if self._is_number(cleaned_number):
                    return f"-{cleaned_number}"
            
            # Check if this looks like a number (with or without symbols)
            if self._contains_number(original_cell):
                # Remove currency symbols, commas, and million indicators (but preserve percentages handled above)
                cleaned_cell = re.sub(r'[\$€£¥,]', '', original_cell)
                
                # Handle million indicators: 123m, 123M, 123 million
                if re.search(r'\b\d+\.?\d*\s*m\b', cleaned_cell, re.IGNORECASE):
                    cleaned_cell = re.sub(r'\s*m\b', '', cleaned_cell, flags=re.IGNORECASE)
                elif 'million' in cleaned_cell.lower():
                    cleaned_cell = re.sub(r'\s*million\b', '', cleaned_cell, flags=re.IGNORECASE)
                
                # If after cleaning it's still a valid number, return cleaned version
                if self._is_number(cleaned_cell):
                    return cleaned_cell
                
                # If not a pure number after cleaning, return original
                return original_cell
            
            # For non-numeric text, return as-is
            return original_cell
            
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
    
    def _contains_number(self, text: str) -> bool:
        """
        Check if text contains numeric content.
        
        Args:
            text: Text to check
            
        Returns:
            True if text contains numbers
        """
        try:
            # Check if text contains digits
            return bool(re.search(r'\d', text))
        except Exception:
            return False
    
    def extract_table_data_with_headers(self, source_uri: str, table_identifier: str, include_headers: bool = True) -> List[List[str]]:
        """
        Extract table data with optional header inclusion.
        
        Args:
            source_uri: File path or URL to the PDF document
            table_identifier: String to identify the specific table
            include_headers: Whether to attempt to include table headers
            
        Returns:
            List of lists representing table data with optional headers
        """
        try:
            logger.info(f"Extracting table with headers from PDF: {source_uri}")
            
            # Open PDF document
            pdf_document = self._open_pdf(source_uri)
            
            if not pdf_document:
                raise ValueError(f"Could not open PDF: {source_uri}")
            
            try:
                # Extract text from all pages
                text_content = self._extract_text_from_pdf(pdf_document)
                
                # Find table using identifier
                if include_headers:
                    table_data = self._find_table_with_headers(text_content, table_identifier)
                else:
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
    
    def _find_table_with_headers(self, text_content: str, table_identifier: str) -> Optional[List[List[str]]]:
        """
        Find table data including potential headers.
        
        Args:
            text_content: Full text content from PDF
            table_identifier: String to identify the specific table
            
        Returns:
            List of lists representing table data with headers or None if not found
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
            
            # Look backwards for potential headers (up to 5 lines before identifier)
            header_start_idx = max(0, table_start_idx - 5)
            
            # Extract table data starting from potential header area
            extended_lines = lines[header_start_idx:]
            table_data = self._parse_table_lines_with_headers(extended_lines)
            
            return table_data
            
        except Exception as e:
            logger.error(f"Error finding table with headers '{table_identifier}': {str(e)}")
            return None
    
    def _parse_table_lines_with_headers(self, lines: List[str]) -> List[List[str]]:
        """
        Parse lines of text to extract tabular data including headers.
        
        Args:
            lines: List of text lines to parse
            
        Returns:
            List of lists representing table data with headers
        """
        try:
            table_data = []
            potential_headers = []
            in_table_data = False
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # Parse line into columns
                row_data = self._parse_table_row(line)
                
                if row_data:
                    # Check if this looks like a header row
                    if not in_table_data and self._is_potential_header(row_data):
                        potential_headers.append(row_data)
                    elif len(row_data) > 0:  # Data row (single or multi-column)
                        # If we haven't started collecting data yet, include recent headers
                        if not in_table_data and potential_headers:
                            table_data.extend(potential_headers[-2:])  # Include last 2 potential headers
                            in_table_data = True
                        
                        table_data.append(row_data)
                        in_table_data = True
                
                # Stop parsing if we encounter a clear end of table
                if in_table_data and self._is_table_end(line):
                    break
            
            return table_data
            
        except Exception as e:
            logger.error(f"Error parsing table lines with headers: {str(e)}")
            return []
    
    def _is_potential_header(self, row: List[str]) -> bool:
        """
        Determine if a row is likely a table header.
        
        Args:
            row: Table row to analyze
            
        Returns:
            True if row appears to be a header
        """
        try:
            if not row:
                return False
            
            row_text = ' '.join(row).lower()
            
            # Header indicators
            header_patterns = [
                # Time periods
                r'\b(year|quarter|month)\b',
                r'\b(2024|2023|2022|2021|2020)\b',
                r'\bmarch|june|september|december\b',
                # Financial statement headers
                r'\b(amount|value|total|balance)\b',
                r'\b(thousand|million|billion)\b',
                r'\b(assets|liabilities|equity)\b',
                r'\b(level [123])\b',
                # Common table headers
                r'\b(description|type|category)\b',
                r'\b(fair value|book value|market value)\b',
            ]
            
            # Check for header patterns
            for pattern in header_patterns:
                if re.search(pattern, row_text):
                    return True
            
            # Check if row has mostly text (not numbers) - common for headers
            text_cells = sum(1 for cell in row if not self._contains_number(cell))
            return text_cells > len(row) * 0.6  # More than 60% text
            
        except Exception as e:
            logger.error(f"Error checking if potential header: {str(e)}")
            return False
    
    def _distinguish_dates_from_data(self, row: List[str]) -> bool:
        """
        Distinguish between row headers containing dates and actual data.
        
        Args:
            row: Table row to analyze
            
        Returns:
            True if this appears to be a date header rather than data
        """
        try:
            if not row:
                return False
            
            first_cell = str(row[0]).strip().lower()
            
            # Date header patterns
            date_patterns = [
                r'as of \d{4}',
                r'december 31, \d{4}',
                r'march 31, \d{4}',
                r'for the year ended',
                r'three months ended',
                r'year ended december',
                r'\d{4} annual report',
                r'fiscal year \d{4}'
            ]
            
            # Check if first cell contains date patterns
            for pattern in date_patterns:
                if re.search(pattern, first_cell):
                    return True
            
            # Check if row has only 1-2 cells and contains dates AND looks like a date header
            if (len(row) <= 2 and re.search(r'\b\d{4}\b', first_cell) and 
                not any(keyword in first_cell for keyword in ['cash', 'flow', 'revenue', 'income', 'assets', 'cost'])):
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error distinguishing dates from data: {str(e)}")
            return False
    
    def _analyze_pdf_content_with_llm(self, text_content: str, prompt: str, bedrock_client) -> Dict[str, Any]:
        """
        Analyze PDF text content using LLM to identify tables matching the prompt.
        
        Args:
            text_content: Full text content from PDF
            prompt: Natural language description of what tables to find
            bedrock_client: Bedrock client instance
            
        Returns:
            Dictionary containing table analysis results
        """
        try:
            # Truncate content if too long (Claude has token limits)
            max_content_length = 50000  # Approximate character limit
            if len(text_content) > max_content_length:
                text_content = text_content[:max_content_length] + "...[truncated]"
            
            analysis_prompt = f"""
            You are an expert at analyzing PDF documents and extracting tabular data. 
            
            User Request: "{prompt}"
            
            PDF Content:
            {text_content}
            
            Please analyze the PDF content and identify all tables that match the user's request. For each matching table:
            
            1. Identify the table title/name
            2. Provide a brief description of what the table contains
            3. Identify the approximate location markers (key text that appears before the table)
            4. Assess how well it matches the user's request (confidence 0.0-1.0)
            5. Identify key characteristics of the table structure
            
            Respond with a JSON object in this exact format:
            {{
                "tables": [
                    {{
                        "title": "Table title from PDF",
                        "description": "Brief description of table contents",
                        "location_markers": ["text that appears before table", "table header text"],
                        "confidence": 0.95,
                        "structure_hints": {{
                            "has_headers": true,
                            "estimated_columns": 4,
                            "numeric_data": true
                        }}
                    }}
                ],
                "analysis_summary": "Brief summary of what was found"
            }}
            
            Only include tables that genuinely match the user's request. If no matching tables are found, return an empty tables array.
            """
            
            response = bedrock_client.invoke_claude(analysis_prompt)
            
            if not response:
                logger.warning("No response from LLM analysis")
                return {"tables": [], "analysis_summary": "LLM analysis failed"}
            
            # Parse JSON from response
            try:
                # Extract JSON from response (Claude might wrap it in markdown)
                json_start = response.find('{')
                json_end = response.rfind('}') + 1
                if json_start != -1 and json_end != 0:
                    json_str = response[json_start:json_end]
                    analysis_result = json.loads(json_str)
                    
                    logger.info(f"LLM identified {len(analysis_result.get('tables', []))} matching tables")
                    return analysis_result
                    
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to parse JSON from LLM response: {e}")
                logger.debug(f"Raw LLM response: {response[:1000]}...")
            
            # Fallback: no tables found
            return {"tables": [], "analysis_summary": "Failed to parse LLM response"}
            
        except Exception as e:
            logger.error(f"Error analyzing PDF content with LLM: {str(e)}")
            return {"tables": [], "analysis_summary": f"Analysis error: {str(e)}"}
    
    def _extract_table_by_llm_analysis(self, text_content: str, table_info: Dict[str, Any]) -> Optional[List[List[str]]]:
        """
        Extract specific table data based on LLM analysis results.
        
        Args:
            text_content: Full text content from PDF
            table_info: Table information from LLM analysis
            
        Returns:
            List of lists representing table data or None if extraction fails
        """
        try:
            location_markers = table_info.get('location_markers', [])
            
            # Try to find table using location markers
            lines = text_content.split('\n')
            table_start_idx = None
            
            # Look for any of the location markers
            for marker in location_markers:
                if marker and marker.strip():
                    for i, line in enumerate(lines):
                        if marker.lower() in line.lower():
                            table_start_idx = i
                            break
                    if table_start_idx is not None:
                        break
            
            # If no location markers found, try using the table title
            if table_start_idx is None:
                table_title = table_info.get('title', '')
                if table_title:
                    for i, line in enumerate(lines):
                        if table_title.lower() in line.lower():
                            table_start_idx = i
                            break
            
            if table_start_idx is None:
                logger.warning(f"Could not locate table: {table_info.get('title', 'Unknown')}")
                return None
            
            # Extract table data based on structure hints
            structure_hints = table_info.get('structure_hints', {})
            has_headers = structure_hints.get('has_headers', True)
            
            if has_headers:
                table_data = self._parse_table_lines_with_headers(lines[table_start_idx:])
            else:
                table_data = self._parse_table_lines(lines[table_start_idx:])
            
            return table_data
            
        except Exception as e:
            logger.error(f"Error extracting table by LLM analysis: {str(e)}")
            return None
    
    
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


def extract_pdf_tables_with_prompt(source_uri: str, prompt: str) -> List[Dict[str, Any]]:
    """
    Convenience function to extract tables from a PDF document using natural language prompts.
    
    Args:
        source_uri: File path or URL to the PDF document
        prompt: Natural language description of what tables to find
        
    Returns:
        List of dictionaries containing extracted table information
        
    Raises:
        ValueError: If PDF cannot be opened or no matching tables found
        ImportError: If PyMuPDF is not installed
    """
    from .bedrock_client import get_bedrock_client
    
    extractor = PDFExtractor()
    try:
        bedrock_client = get_bedrock_client()
        return extractor.extract_tables_with_llm(source_uri, prompt, bedrock_client)
    finally:
        extractor.close()