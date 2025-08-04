"""
PDF Data Extraction Module for MAGK Excel Backend

This module provides functionality to extract tabular data from PDF documents
using pdfplumber for table extraction and PyMuPDF as fallback for text extraction.
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
    import pdfplumber
except ImportError:
    pdfplumber = None

try:
    import fitz  # PyMuPDF - keep as fallback
except ImportError:
    fitz = None

# Set up logging
logger = logging.getLogger(__name__)


class PDFExtractor:
    """
    PDF data extraction class using pdfplumber with PyMuPDF fallback.
    
    Handles text-based PDF processing with table detection and parsing,
    including support for various number formats.
    """
    
    def __init__(self):
        """Initialize the PDFExtractor."""
        if pdfplumber is None and fitz is None:
            raise ImportError("pdfplumber or PyMuPDF (fitz) is required for PDF processing. Install with: pip install pdfplumber")
        
        # Use pdfplumber as primary extractor if available
        self.use_pdfplumber = pdfplumber is not None
        
        logger.info(f"PDFExtractor initialized successfully (using {'pdfplumber' if self.use_pdfplumber else 'PyMuPDF'})")
    
    def extract_all_tables_from_pdf(self, source_uri: str) -> List[Dict[str, Any]]:
        """
        Extract ALL tables from a PDF document using pdfplumber.
        
        Args:
            source_uri: File path or URL to the PDF document
            
        Returns:
            List of dictionaries containing all extracted tables with metadata
            
        Raises:
            ValueError: If PDF cannot be opened
            FileNotFoundError: If PDF file doesn't exist
        """
        try:
            logger.info(f"Extracting all tables from PDF: {source_uri}")
            
            # Download PDF if it's a URL
            if source_uri.startswith(('http://', 'https://')):
                with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_file:
                    urllib.request.urlretrieve(source_uri, temp_file.name)
                    pdf_path = temp_file.name
                    is_temp = True
            else:
                pdf_path = source_uri
                is_temp = False
                if not os.path.exists(pdf_path):
                    raise FileNotFoundError(f"PDF file not found: {pdf_path}")
            
            all_tables = []
            
            try:
                if self.use_pdfplumber:
                    # Use pdfplumber for extraction
                    with pdfplumber.open(pdf_path) as pdf:
                        for page_num, page in enumerate(pdf.pages):
                            # Extract tables from each page
                            tables = page.extract_tables()
                            
                            for table_idx, table in enumerate(tables):
                                if table and len(table) > 0:
                                    # Process the table
                                    processed_table = []
                                    headers = []
                                    
                                    # First row might be headers
                                    if len(table) > 0:
                                        headers = [str(cell) if cell else '' for cell in table[0]]
                                        
                                        # Include all rows (including headers)
                                        for row in table:
                                            processed_row = [str(cell) if cell else '' for cell in row]
                                            processed_table.append(processed_row)
                                    
                                    # Calculate table metadata
                                    has_numeric_data = any(
                                        self._contains_number(str(cell)) 
                                        for row in processed_table[1:] 
                                        for cell in row if cell
                                    )
                                    
                                    table_info = {
                                        'page_number': page_num + 1,
                                        'table_index': table_idx + 1,
                                        'data': processed_table,
                                        'headers': headers,
                                        'row_count': len(processed_table),
                                        'column_count': len(headers),
                                        'has_numeric_data': has_numeric_data,
                                        'title': f'Table {table_idx + 1} on Page {page_num + 1}'
                                    }

                                    
                                    all_tables.append(table_info)
                else:
                    # Fallback to PyMuPDF-based extraction
                    pdf_document = fitz.open(pdf_path)
                    try:
                        text_content = self._extract_text_from_pdf(pdf_document)
                        # Use existing parsing logic but extract all potential tables
                        all_tables = self._extract_all_tables_from_text(text_content)

                    finally:
                        pdf_document.close()
                
                logger.info(f"Extracted {len(all_tables)} tables from PDF")
                return all_tables
                
            finally:
                if is_temp:
                    os.unlink(pdf_path)
                    
        except Exception as e:
            logger.error(f"Error extracting all tables from PDF {source_uri}: {str(e)}")
            raise

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
                
                # Validate that table contains sufficient numerical data
                if not self._validate_table_has_numerical_data(processed_data):
                    raise ValueError(f"Table with identifier '{table_identifier}' does not contain sufficient numerical data. Only tables with numerical data will be extracted.")
                
                logger.info(f"Successfully extracted {len(processed_data)} rows from PDF table with numerical data")
                return processed_data
                
            finally:
                pdf_document.close()
                
        except Exception as e:
            logger.error(f"Error extracting table from PDF {source_uri}: {str(e)}")
            raise
    
    def _extract_all_tables_from_text(self, text_content: str) -> List[Dict[str, Any]]:
        """
        Extract all potential tables from text content (PyMuPDF fallback).
        
        Args:
            text_content: Full text content from PDF
            
        Returns:
            List of dictionaries containing table information
        """
        try:
            lines = text_content.split('\n')
            all_tables = []
            current_table = []
            table_count = 0
            
            for i, line in enumerate(lines):
                line = line.strip()
                
                # Check if line looks like table data
                if self._line_looks_like_table_data(line):
                    row_data = self._parse_table_row(line)
                    if row_data:
                        current_table.append(row_data)
                elif current_table:
                    # End of table detected, save it
                    if len(current_table) > 1:  # At least 2 rows
                        table_count += 1
                        headers = [str(cell) for cell in current_table[0]]
                        
                        has_numeric_data = any(
                            self._contains_number(str(cell)) 
                            for row in current_table[1:] 
                            for cell in row if cell
                        )
                        
                        table_info = {
                            'page_number': 0,  # Unknown from text extraction
                            'table_index': table_count,
                            'data': current_table,
                            'headers': headers,
                            'row_count': len(current_table),
                            'column_count': len(headers),
                            'has_numeric_data': has_numeric_data,
                            'title': f'Table {table_count}'
                        }
                        
                        
                        all_tables.append(table_info)
                    
                    current_table = []
            
            # Don't forget the last table
            if current_table and len(current_table) > 1:
                table_count += 1
                headers = [str(cell) for cell in current_table[0]]
                
                has_numeric_data = any(
                    self._contains_number(str(cell)) 
                    for row in current_table[1:] 
                    for cell in row if cell
                )
                
                table_info = {
                    'page_number': 0,
                    'table_index': table_count,
                    'data': current_table,
                    'headers': headers,
                    'row_count': len(current_table),
                    'column_count': len(headers),
                    'has_numeric_data': has_numeric_data,
                    'title': f'Table {table_count}'
                }
                
                all_tables.append(table_info)
            
            return all_tables
            
        except Exception as e:
            logger.error(f"Error extracting tables from text: {str(e)}")
            return []

    def extract_tables_with_llm(self, source_uri: str, prompt: str, bedrock_client=None) -> Dict[str, Any]:
        """
        Extract tables from a PDF document using two-step LLM-based analysis.
        Step 1: Extract ALL tables from PDF and store in JSON
        Step 2: Use LLM to find the table that matches the prompt
        
        Args:
            source_uri: File path or URL to the PDF document
            prompt: Natural language description of what table to find
            bedrock_client: Optional bedrock client instance
            
        Returns:
            Dictionary with either error message or table data with headers
            
        Raises:
            ValueError: If PDF cannot be opened or no matching table found
            FileNotFoundError: If PDF file doesn't exist
        """
        try:
            from .bedrock_client import get_bedrock_client
            
            logger.info(f"Starting two-step table extraction from PDF: {source_uri}")
            
            # STEP 1: Extract ALL tables from PDF first
            all_tables = self.extract_all_tables_from_pdf(source_uri)
            
            if not all_tables:
                return {
                    'error': 'No tables found in the PDF document',
                    'success': False
                }
            
            logger.info(f"Step 1 complete: Extracted {len(all_tables)} tables from PDF")
            
            # STEP 2: Use LLM to find the matching table
            if bedrock_client is None:
                bedrock_client = get_bedrock_client()
            
            matching_table = self._find_matching_table_with_llm(all_tables, prompt, bedrock_client)
            
            if not matching_table:
                return {
                    'error': f'No table found matching the request: "{prompt}"',
                    'success': False,
                    'available_tables': len(all_tables)
                }
            
            # Return the matching table with headers and data
            return {
                'success': True,
                'table_data': matching_table['data'],
                'headers': matching_table['headers'],
                'title': matching_table.get('title', 'Found Table'),
                'page_number': matching_table.get('page_number', 1),
                'row_count': matching_table['row_count'],
                'column_count': matching_table['column_count'],
                'match_confidence': matching_table.get('match_confidence', 0.8),
                'match_reasoning': matching_table.get('match_reasoning', ''),
                'total_tables_scanned': len(all_tables)
            }
                
        except Exception as e:
            logger.error(f"Error extracting tables from PDF {source_uri} with LLM: {str(e)}")
            return {
                'error': f'Failed to extract tables: {str(e)}',
                'success': False
            }
    
    def _find_matching_table_with_llm(self, all_tables: List[Dict[str, Any]], prompt: str, bedrock_client) -> Optional[Dict[str, Any]]:
        """
        Use LLM to analyze extracted tables and find the one matching the prompt.
        
        Args:
            all_tables: List of all extracted tables with metadata
            prompt: Natural language description of what table to find
            bedrock_client: Bedrock client instance
            
        Returns:
            Dictionary containing the matching table or None if no match
        """
        try:
            # Create a summary of all tables for LLM analysis
            tables_summary = []
            for i, table in enumerate(all_tables):
                # Sample first few rows for analysis
                sample_rows = table['data'][:3] if len(table['data']) > 3 else table['data']
                
                table_summary = {
                    'index': i,
                    'title': table['title'],
                    'page_number': table['page_number'],
                    'row_count': table['row_count'],
                    'column_count': table['column_count'],
                    'headers': table['headers'],
                    'sample_data': sample_rows,
                    'has_numeric_data': table['has_numeric_data']
                }
                tables_summary.append(table_summary)
            
            # Create LLM prompt to analyze tables
            analysis_prompt = f"""
            You are an expert data analyst. I have extracted {len(all_tables)} tables from a PDF document. 
            Your task is to identify which table best matches this user request: "{prompt}"
            
            Here are all the available tables with sample data:
            
            {json.dumps(tables_summary, indent=2)}
            
            INSTRUCTIONS:
            1. Analyze each table's headers and sample data
            2. Consider the semantic meaning of the user's request
            3. Look for tables that contain the type of data requested
            4. Prioritize tables with relevant headers and numeric data if appropriate
            5. Return the index of the BEST matching table
            
            RESPONSE FORMAT - Return ONLY valid JSON:
            {{
                "matching_table_index": <index_number>,
                "match_confidence": <0.0_to_1.0>,
                "match_reasoning": "Brief explanation of why this table matches",
                "alternative_tables": [<list_of_other_possible_indices>]
            }}
            
            If no table matches well, return matching_table_index: -1
            """
            
            response = bedrock_client.invoke_claude(analysis_prompt)
            
            if not response:
                logger.warning("No response from LLM table matching")
                return None
            
            # Parse JSON from response
            try:
                json_start = response.find('{')
                json_end = response.rfind('}') + 1
                if json_start != -1 and json_end != 0:
                    json_str = response[json_start:json_end]
                    analysis_result = json.loads(json_str)
                    
                    table_index = analysis_result.get('matching_table_index', -1)
                    
                    if table_index >= 0 and table_index < len(all_tables):
                        matching_table = all_tables[table_index].copy()
                        matching_table['match_confidence'] = analysis_result.get('match_confidence', 0.8)
                        matching_table['match_reasoning'] = analysis_result.get('match_reasoning', '')
                        
                        logger.info(f"LLM matched table {table_index}: {matching_table['title']}")
                        return matching_table
                    else:
                        logger.info("LLM found no matching table")
                        return None
                        
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to parse JSON from LLM table matching response: {e}")
                return None
            
        except Exception as e:
            logger.error(f"Error finding matching table with LLM: {str(e)}")
            return None

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
    
    
    def _validate_table_has_numerical_data(self, table_data: List[List[str]], min_numerical_threshold: float = 0.3) -> bool:
        """
        Validate that a table contains sufficient numerical data to be considered a data table.
        
        Args:
            table_data: Table data to validate
            min_numerical_threshold: Minimum percentage of cells that must contain numbers (0.0-1.0)
            
        Returns:
            True if table has sufficient numerical data, False otherwise
        """
        try:
            if not table_data or len(table_data) == 0:
                return False
                
            total_cells = 0
            numerical_cells = 0
            
            for row in table_data:
                if not row:
                    continue
                    
                for cell in row:
                    if cell and cell.strip():
                        total_cells += 1
                        
                        # Check if cell contains numerical data
                        if self._contains_number(cell.strip()):
                            # Further validate it's not just a year or page number in text
                            if self._is_meaningful_numerical_data(cell.strip()):
                                numerical_cells += 1
            
            if total_cells == 0:
                return False
                
            numerical_percentage = numerical_cells / total_cells
            
            logger.debug(f"Table validation: {numerical_cells}/{total_cells} cells contain numbers ({numerical_percentage:.2%})")
            
            # Return True only if table meets numerical threshold
            return numerical_percentage >= min_numerical_threshold
            
        except Exception as e:
            logger.error(f"Error validating table numerical data: {str(e)}")
            return False
    
    def _is_meaningful_numerical_data(self, cell: str) -> bool:
        """
        Check if a cell contains meaningful numerical data (not just incidental numbers).
        
        Args:
            cell: Cell content to check
            
        Returns:
            True if cell contains meaningful numerical data
        """
        try:
            cell_clean = cell.strip().lower()
            
            # Skip cells that are just years (common in headers)
            if re.match(r'^(19|20)\d{2}$', cell_clean):
                return False
                
            # Skip cells that are just page numbers or similar
            if re.match(r'^(page\s*)?[0-9]{1,3}$', cell_clean):
                return False
                
            # Skip cells with mostly text and just incidental numbers
            if len(cell_clean) > 10 and sum(c.isalpha() for c in cell_clean) > sum(c.isdigit() for c in cell_clean):
                return False
            
            # Must contain actual numerical content (digits, decimal points, currency symbols, etc.)
            if re.search(r'\d+[,.]?\d*', cell_clean):
                return True
                
            return False
            
        except Exception as e:
            logger.error(f"Error checking meaningful numerical data for '{cell}': {str(e)}")
            return False
    
    
    
    def _line_looks_like_table_data(self, line: str) -> bool:
        """
        Check if a line looks like it contains table data.
        
        Args:
            line: Text line to analyze
            
        Returns:
            True if line appears to contain table data
        """
        try:
            line = line.strip()
            if not line:
                return False
            
            # Count separators and numbers
            separators = line.count('  ') + line.count('\t') + line.count('|')
            number_count = len(re.findall(r'\d+', line))
            
            # Looks like table data if it has multiple separators or contains numbers
            return separators >= 2 or (separators >= 1 and number_count >= 2)
            
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


def extract_pdf_tables_with_prompt(source_uri: str, prompt: str) -> Dict[str, Any]:
    """
    Convenience function to extract tables from a PDF document using natural language prompts.
    Uses two-step approach: 1) Extract all tables, 2) LLM finds matching table.
    
    Args:
        source_uri: File path or URL to the PDF document
        prompt: Natural language description of what table to find
        
    Returns:
        Dictionary with either error message or table data with headers
        
    Raises:
        ValueError: If PDF cannot be opened or no matching table found
        ImportError: If pdfplumber or PyMuPDF is not installed
    """
    from .bedrock_client import get_bedrock_client
    
    extractor = PDFExtractor()
    try:
        bedrock_client = get_bedrock_client()
        return extractor.extract_tables_with_llm(source_uri, prompt, bedrock_client)
    finally:
        extractor.close()