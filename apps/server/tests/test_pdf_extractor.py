"""
Unit tests for PDF Data Extraction Module

Tests the PDFExtractor class and extract_pdf_table function
for extracting tabular data from PDF documents.
"""

import pytest
import tempfile
import os
from unittest.mock import Mock, patch, MagicMock
from chalicelib.pdf_extractor import PDFExtractor, extract_pdf_table


class TestPDFExtractor:
    """Test cases for PDFExtractor class."""
    
    def test_init_success(self):
        """Test successful initialization of PDFExtractor."""
        with patch('chalicelib.pdf_extractor.fitz'):
            extractor = PDFExtractor()
            assert extractor is not None
    
    def test_init_missing_fitz(self):
        """Test initialization fails when PyMuPDF is not available."""
        with patch('chalicelib.pdf_extractor.fitz', None):
            with pytest.raises(ImportError, match="PyMuPDF.*required"):
                PDFExtractor()
    
    def test_open_pdf_local_file(self):
        """Test opening a local PDF file."""
        extractor = PDFExtractor()
        
        # Create a temporary PDF file for testing
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_file:
            temp_path = temp_file.name
            temp_file.write(b'%PDF-1.4\n%Test PDF content')
        
        try:
            with patch('chalicelib.pdf_extractor.fitz') as mock_fitz:
                mock_doc = Mock()
                mock_fitz.open.return_value = mock_doc
                
                result = extractor._open_pdf(temp_path)
                
                assert result == mock_doc
                mock_fitz.open.assert_called_once_with(temp_path)
        finally:
            os.unlink(temp_path)
    
    def test_open_pdf_url(self):
        """Test opening a PDF from URL."""
        extractor = PDFExtractor()
        
        with patch('chalicelib.pdf_extractor.urllib.request.urlretrieve') as mock_retrieve, \
             patch('chalicelib.pdf_extractor.tempfile.NamedTemporaryFile') as mock_temp, \
             patch('chalicelib.pdf_extractor.fitz') as mock_fitz, \
             patch('chalicelib.pdf_extractor.os.unlink') as mock_unlink:
            
            # Mock temporary file
            mock_temp_file = Mock()
            mock_temp_file.name = '/tmp/test.pdf'
            mock_temp.return_value.__enter__.return_value = mock_temp_file
            
            # Mock PDF document
            mock_doc = Mock()
            mock_fitz.open.return_value = mock_doc
            
            result = extractor._open_pdf('https://example.com/test.pdf')
            
            assert result == mock_doc
            mock_retrieve.assert_called_once_with('https://example.com/test.pdf', '/tmp/test.pdf')
            mock_fitz.open.assert_called_once_with('/tmp/test.pdf')
            mock_unlink.assert_called_once_with('/tmp/test.pdf')
    
    def test_open_pdf_file_not_found(self):
        """Test opening a non-existent PDF file."""
        extractor = PDFExtractor()
        
        with pytest.raises(FileNotFoundError):
            extractor._open_pdf('/nonexistent/file.pdf')
    
    def test_extract_text_from_pdf(self):
        """Test extracting text from PDF document."""
        extractor = PDFExtractor()
        
        # Mock PDF document
        mock_doc = Mock()
        mock_page1 = Mock()
        mock_page1.get_text.return_value = "Page 1 content"
        mock_page2 = Mock()
        mock_page2.get_text.return_value = "Page 2 content"
        
        # Set up len() for the mock document
        type(mock_doc).__len__ = Mock(return_value=2)
        mock_doc.load_page.side_effect = [mock_page1, mock_page2]
        
        result = extractor._extract_text_from_pdf(mock_doc)
        
        expected = "Page 1 content\nPage 2 content\n"
        assert result == expected
        assert mock_doc.load_page.call_count == 2
    
    def test_find_table_by_identifier_success(self):
        """Test finding table data using identifier."""
        extractor = PDFExtractor()
        
        text_content = """
        Some header text
        Revenue Table
        Product A   $1000
        Product B   $2000
        Total       $3000
        """
        
        result = extractor._find_table_by_identifier(text_content, "Revenue")
        
        assert result is not None
        assert len(result) > 0
        assert any("Product A" in row for row in result)
    
    def test_find_table_by_identifier_not_found(self):
        """Test finding table when identifier is not found."""
        extractor = PDFExtractor()
        
        text_content = "Some text without the identifier"
        
        result = extractor._find_table_by_identifier(text_content, "Revenue")
        
        assert result is None
    
    def test_parse_table_lines(self):
        """Test parsing table lines into structured data."""
        extractor = PDFExtractor()
        
        lines = [
            "Product A   $1000",
            "Product B   $2000",
            "Total       $3000"
        ]
        
        result = extractor._parse_table_lines(lines)
        
        assert len(result) > 0
        assert all(len(row) >= 2 for row in result)  # At least 2 columns
    
    def test_is_header_line(self):
        """Test header line detection."""
        extractor = PDFExtractor()
        
        # Test header indicators
        assert extractor._is_header_line("PAGE 1") == True
        assert extractor._is_header_line("TOTAL SUMMARY") == True
        assert extractor._is_header_line("Product A   $1000") == False
    
    def test_is_table_end(self):
        """Test table end detection."""
        extractor = PDFExtractor()
        
        # Test end indicators
        assert extractor._is_table_end("TOTAL: $3000") == True
        assert extractor._is_table_end("Notes: Some notes") == True
        assert extractor._is_table_end("Product A   $1000") == False
    
    def test_parse_table_row(self):
        """Test parsing individual table rows."""
        extractor = PDFExtractor()
        
        # Test different parsing strategies
        assert extractor._parse_table_row("Col1  Col2  Col3") == ["Col1", "Col2", "Col3"]
        assert extractor._parse_table_row("Col1\tCol2\tCol3") == ["Col1", "Col2", "Col3"]
        assert extractor._parse_table_row("Col1, Col2, Col3") == ["Col1", "Col2", "Col3"]
    
    def test_process_number_formats(self):
        """Test number format processing."""
        extractor = PDFExtractor()
        
        table_data = [
            ["Product A", "$1,234.56"],
            ["Product B", "(500.00)"],
            ["Product C", "100%"]
        ]
        
        result = extractor._process_number_formats(table_data)
        
        assert len(result) == 3
        # Check that number processing was applied
        assert any("1234.56" in row for row in result)  # Comma removed
        assert any("-500.00" in row for row in result)  # Parentheses converted
    
    def test_normalize_number_format(self):
        """Test number format normalization."""
        extractor = PDFExtractor()
        
        # Test accounting negative format
        assert extractor._normalize_number_format("(123.45)") == "-123.45"
        
        # Test comma-separated numbers
        assert extractor._normalize_number_format("1,234.56") == "1234.56"
        
        # Test regular text (should remain unchanged)
        assert extractor._normalize_number_format("Product A") == "Product A"
    
    def test_is_number(self):
        """Test number detection."""
        extractor = PDFExtractor()
        
        assert extractor._is_number("123.45") == True
        assert extractor._is_number("$123.45") == True
        assert extractor._is_number("Product A") == False
    
    def test_is_number_with_commas(self):
        """Test comma-separated number detection."""
        extractor = PDFExtractor()
        
        assert extractor._is_number_with_commas("1,234.56") == True
        assert extractor._is_number_with_commas("1,234") == True
        assert extractor._is_number_with_commas("Product A") == False
    
    def test_extract_table_data_success(self):
        """Test successful table data extraction."""
        extractor = PDFExtractor()
        
        with patch.object(extractor, '_open_pdf') as mock_open, \
             patch.object(extractor, '_extract_text_from_pdf') as mock_extract, \
             patch.object(extractor, '_find_table_by_identifier') as mock_find, \
             patch.object(extractor, '_process_number_formats') as mock_process:
            
            # Mock PDF document
            mock_doc = Mock()
            mock_open.return_value = mock_doc
            
            # Mock text extraction
            mock_extract.return_value = "Test PDF content"
            
            # Mock table finding
            mock_find.return_value = [["Product A", "$1000"], ["Product B", "$2000"]]
            
            # Mock number processing
            mock_process.return_value = [["Product A", "1000"], ["Product B", "2000"]]
            
            result = extractor.extract_table_data("test.pdf", "Revenue")
            
            assert result == [["Product A", "1000"], ["Product B", "2000"]]
            mock_doc.close.assert_called_once()
    
    def test_extract_table_data_pdf_open_failure(self):
        """Test table extraction when PDF cannot be opened."""
        extractor = PDFExtractor()
        
        with patch.object(extractor, '_open_pdf', return_value=None):
            with pytest.raises(ValueError, match="Could not open PDF"):
                extractor.extract_table_data("test.pdf", "Revenue")
    
    def test_extract_table_data_table_not_found(self):
        """Test table extraction when table is not found."""
        extractor = PDFExtractor()
        
        with patch.object(extractor, '_open_pdf') as mock_open, \
             patch.object(extractor, '_extract_text_from_pdf') as mock_extract, \
             patch.object(extractor, '_find_table_by_identifier') as mock_find:
            
            mock_doc = Mock()
            mock_open.return_value = mock_doc
            mock_extract.return_value = "Test content"
            mock_find.return_value = None
            
            with pytest.raises(ValueError, match="Table.*not found"):
                extractor.extract_table_data("test.pdf", "Revenue")
            
            mock_doc.close.assert_called_once()


class TestExtractPDFTable:
    """Test cases for extract_pdf_table convenience function."""
    
    def test_extract_pdf_table_success(self):
        """Test successful table extraction using convenience function."""
        with patch('chalicelib.pdf_extractor.PDFExtractor') as mock_extractor_class:
            mock_extractor = Mock()
            mock_extractor.extract_table_data.return_value = [["Product A", "$1000"]]
            mock_extractor_class.return_value = mock_extractor
            
            result = extract_pdf_table("test.pdf", "Revenue")
            
            assert result == [["Product A", "$1000"]]
            mock_extractor.extract_table_data.assert_called_once_with("test.pdf", "Revenue")
            mock_extractor.close.assert_called_once()
    
    def test_extract_pdf_table_with_exception(self):
        """Test table extraction when exception occurs."""
        with patch('chalicelib.pdf_extractor.PDFExtractor') as mock_extractor_class:
            mock_extractor = Mock()
            mock_extractor.extract_table_data.side_effect = ValueError("Test error")
            mock_extractor_class.return_value = mock_extractor
            
            with pytest.raises(ValueError, match="Test error"):
                extract_pdf_table("test.pdf", "Revenue")
            
            mock_extractor.close.assert_called_once()


if __name__ == '__main__':
    pytest.main([__file__])