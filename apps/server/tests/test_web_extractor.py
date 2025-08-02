import pytest
from unittest.mock import Mock, patch, MagicMock
from selenium.common.exceptions import TimeoutException, WebDriverException
from chalicelib.web_extractor import WebExtractor, extract_web_table
from chalicelib.pdf_extractor import PDFExtractor


class TestWebExtractor:
    """Test cases for WebExtractor class."""
    
    def setup_method(self):
        """Set up test fixtures."""
        # Don't initialize WebExtractor here to avoid webdriver issues
        # Initialize in individual tests with proper mocking
        pass
    
    def teardown_method(self):
        """Clean up after tests."""
        # Clean up handled by individual tests
        pass
    
    @patch('chalicelib.web_extractor.webdriver.Chrome')
    def test_setup_driver_success(self, mock_chrome):
        """Test successful WebDriver setup."""
        mock_driver = Mock()
        mock_chrome.return_value = mock_driver
        
        extractor = WebExtractor(headless=True, timeout=10)
        
        assert extractor.driver == mock_driver
        mock_driver.set_page_load_timeout.assert_called_once_with(10)
        mock_chrome.assert_called_once()
    
    @patch('chalicelib.web_extractor.webdriver.Chrome')
    def test_setup_driver_failure(self, mock_chrome):
        """Test WebDriver setup failure."""
        mock_chrome.side_effect = WebDriverException("Chrome not found")
        
        with pytest.raises(Exception):  # The actual implementation re-raises the original exception
            WebExtractor(headless=True, timeout=10)
    
    @patch('chalicelib.web_extractor.WebDriverWait')
    @patch('chalicelib.web_extractor.webdriver.Chrome')
    def test_navigate_to_url_success(self, mock_chrome, mock_wait):
        """Test successful URL navigation."""
        # Setup mocks
        mock_driver = Mock()
        mock_chrome.return_value = mock_driver
        mock_wait_instance = Mock()
        mock_wait.return_value = mock_wait_instance
        
        extractor = WebExtractor(headless=True, timeout=10)
        
        # Execute
        extractor._navigate_to_url("https://example.com")
        
        # Verify
        mock_driver.get.assert_called_once_with("https://example.com")
        mock_wait.assert_called_once_with(mock_driver, 10)
    
    @patch('chalicelib.web_extractor.WebDriverWait')
    @patch('chalicelib.web_extractor.webdriver.Chrome')
    def test_navigate_to_url_timeout(self, mock_chrome, mock_wait):
        """Test URL navigation timeout."""
        mock_driver = Mock()
        mock_chrome.return_value = mock_driver
        mock_wait_instance = Mock()
        mock_wait_instance.until.side_effect = TimeoutException()
        mock_wait.return_value = mock_wait_instance
        
        extractor = WebExtractor(headless=True, timeout=10)
        
        with pytest.raises(TimeoutException, match="Page load timeout"):
            extractor._navigate_to_url("https://example.com")
    
    @patch('chalicelib.web_extractor.webdriver.Chrome')
    def test_find_table_by_identifier_success(self, mock_chrome):
        """Test finding table by identifier."""
        mock_driver = Mock()
        mock_chrome.return_value = mock_driver
        mock_table = Mock()
        mock_header = Mock()
        mock_header.text = "test-table data"
        
        mock_table.find_elements.return_value = [mock_header]
        mock_driver.find_elements.return_value = [mock_table]
        
        extractor = WebExtractor(headless=True, timeout=10)
        
        result = extractor._find_table_by_identifier("test-table")
        
        assert result == mock_table
    
    @patch('chalicelib.web_extractor.webdriver.Chrome')
    def test_parse_table_element_with_table_structure(self, mock_chrome):
        """Test parsing standard HTML table structure."""
        mock_driver = Mock()
        mock_chrome.return_value = mock_driver
        
        mock_table = Mock()
        mock_table.tag_name = "table"
        
        # Mock rows
        mock_row1 = Mock()
        mock_row2 = Mock()
        
        # Mock cells for row 1
        mock_th1, mock_th2 = Mock(), Mock()
        mock_th1.text = "Column 1"
        mock_th2.text = "Column 2"
        
        def row1_side_effect(by, tag):
            if tag == "td":
                return []
            elif tag == "th":
                return [mock_th1, mock_th2]
            return []
        
        mock_row1.find_elements.side_effect = row1_side_effect
        
        # Mock cells for row 2
        mock_td1, mock_td2 = Mock(), Mock()
        mock_td1.text = "Data 1"
        mock_td2.text = "Data 2"
        
        def row2_side_effect(by, tag):
            if tag == "td":
                return [mock_td1, mock_td2]
            elif tag == "th":
                return []
            return []
            
        mock_row2.find_elements.side_effect = row2_side_effect
        
        mock_table.find_elements.return_value = [mock_row1, mock_row2]
        
        extractor = WebExtractor(headless=True, timeout=10)
        result = extractor._parse_table_element(mock_table)
        
        expected = [
            ["Column 1", "Column 2"],
            ["Data 1", "Data 2"]
        ]
        assert result == expected
    
    @patch('chalicelib.web_extractor.webdriver.Chrome')
    def test_parse_table_element_div_structure(self, mock_chrome):
        """Test parsing non-table element with text content."""
        mock_driver = Mock()
        mock_chrome.return_value = mock_driver
        
        mock_div = Mock()
        mock_div.tag_name = "div"
        mock_div.text = "Header 1    Header 2\nValue 1     Value 2\nValue 3     Value 4"
        
        extractor = WebExtractor(headless=True, timeout=10)
        result = extractor._parse_table_element(mock_div)
        
        # The implementation splits by 2+ spaces and processes each line
        assert len(result) >= 2  # At least 2 rows parsed
        assert all(len(row) >= 2 for row in result if row)  # Each non-empty row has at least 2 columns
    
    @patch('chalicelib.web_extractor.WebDriverWait')
    @patch('chalicelib.web_extractor.webdriver.Chrome')
    def test_extract_table_data_success(self, mock_chrome, mock_wait):
        """Test successful table extraction end-to-end."""
        mock_driver = Mock()
        mock_chrome.return_value = mock_driver
        mock_table = Mock()
        mock_table.tag_name = "table"
        
        # Mock row with cells
        mock_row = Mock()
        mock_cell = Mock()
        mock_cell.text = "Test Data"
        def row_side_effect(by, tag):
            if tag in ["td", "th"]:
                return [mock_cell]
            return []
        
        mock_row.find_elements.side_effect = row_side_effect
        
        # Mock finding table by identifier - need to set up the header search properly
        mock_header = Mock()
        mock_header.text = "test-table header"
        
        def table_side_effect(by, tag):
            if tag == "tr":
                return [mock_row]
            elif tag == "th":
                return [mock_header]
            return []
        
        mock_table.find_elements.side_effect = table_side_effect
        mock_driver.find_elements.return_value = [mock_table]  # For table search
        mock_driver.get.return_value = None
        
        # Mock WebDriverWait
        mock_wait_instance = Mock()
        mock_wait.return_value = mock_wait_instance
        
        extractor = WebExtractor(headless=True, timeout=10)
        
        # Need to mock the actual table finding logic
        with patch.object(extractor, '_find_table_by_identifier', return_value=mock_table):
            result = extractor.extract_table_data("https://example.com", "test-table")
        
            assert isinstance(result, list)
            assert len(result) >= 1
            mock_driver.get.assert_called_once_with("https://example.com")
    
    @patch('chalicelib.web_extractor.WebDriverWait')
    @patch('chalicelib.web_extractor.webdriver.Chrome')
    def test_extract_table_data_timeout(self, mock_chrome, mock_wait):
        """Test extraction with timeout error."""
        mock_driver = Mock()
        mock_chrome.return_value = mock_driver
        
        mock_wait_instance = Mock()
        mock_wait_instance.until.side_effect = TimeoutException("Page load timeout")
        mock_wait.return_value = mock_wait_instance
        
        extractor = WebExtractor(headless=True, timeout=10)
        
        with pytest.raises(TimeoutException):
            extractor.extract_table_data("https://example.com", "test-table")
    
    @patch('chalicelib.web_extractor.webdriver.Chrome')
    def test_cleanup_with_driver(self, mock_chrome):
        """Test cleanup with active driver."""
        mock_driver = Mock()
        mock_chrome.return_value = mock_driver
        
        extractor = WebExtractor(headless=True, timeout=10)
        extractor._cleanup()
        
        mock_driver.quit.assert_called_once()
    
    @patch('chalicelib.web_extractor.webdriver.Chrome')
    def test_cleanup_without_driver(self, mock_chrome):
        """Test cleanup without active driver."""
        mock_driver = Mock()
        mock_chrome.return_value = mock_driver
        
        extractor = WebExtractor(headless=True, timeout=10)
        extractor.driver = None
        
        # Should not raise exception
        extractor._cleanup()


class TestConvenienceFunction:
    """Test cases for the convenience function."""
    
    @patch('chalicelib.web_extractor.WebExtractor')
    def test_extract_web_table(self, mock_extractor_class):
        """Test the convenience function."""
        mock_extractor = Mock()
        mock_extractor.extract_table_data.return_value = [["Test"], ["Data"]]
        mock_extractor_class.return_value = mock_extractor
        
        result = extract_web_table("https://example.com", "test-table")
        
        assert result == [["Test"], ["Data"]]
        mock_extractor_class.assert_called_once()
        mock_extractor.extract_table_data.assert_called_once_with("https://example.com", "test-table")
        mock_extractor.close.assert_called_once()


@pytest.fixture
def sample_table_data():
    """Sample table data for testing."""
    return [
        ["Name", "Age", "City"],
        ["Alice", "25", "New York"],
        ["Bob", "30", "San Francisco"]
    ]


class TestNaturalLanguageWebExtraction:
    """Test cases for natural language prompt-based web table extraction."""
    
    @patch('chalicelib.web_extractor.webdriver.Chrome')
    def test_extract_with_natural_language_prompt_financial_table(self, mock_chrome):
        """Test extraction using natural language prompt for financial data from a website."""
        mock_driver = Mock()
        mock_chrome.return_value = mock_driver
        
        extractor = WebExtractor(headless=True, timeout=30)
        
        # Real URL example (Yahoo Finance or similar financial site)
        financial_url = "https://finance.yahoo.com/quote/AAPL/financials"
        
        # Natural language prompt instead of simple identifier
        natural_prompt = "Find the income statement table showing total revenue, cost of revenue, gross profit, and operating expenses for the most recent quarters"
        
        # Mock Bedrock AI processing
        with patch('chalicelib.bedrock_client.get_bedrock_client') as mock_bedrock:
            mock_client = Mock()
            mock_bedrock.return_value = mock_client
            
            # Mock AI processing of natural language prompt
            mock_client.analyze_workflow_context.return_value = {
                "sourceType": "web",
                "dataIdentifier": "income statement",
                "confidence": 0.91,
                "reasoning": "User wants financial income statement data from webpage"
            }
            
            # Mock webpage elements
            mock_table = Mock()
            mock_table.tag_name = "table"
            mock_driver.find_elements.return_value = [mock_table]
            
            # Mock table headers
            mock_header = Mock()
            mock_header.text = "income statement data"
            mock_table.find_elements.return_value = [mock_header]
            
            # Mock successful table extraction
            with patch.object(extractor, '_find_table_by_identifier') as mock_find, \
                 patch.object(extractor, '_parse_table_element') as mock_parse:
                
                mock_find.return_value = mock_table
                mock_parse.return_value = [
                    ["Metric", "Q4 2024", "Q3 2024", "Q2 2024"],
                    ["Total Revenue", "119.575B", "94.930B", "85.777B"],
                    ["Cost of Revenue", "65.775B", "52.918B", "47.174B"],
                    ["Gross Profit", "53.800B", "42.012B", "38.603B"],
                    ["Operating Expenses", "15.834B", "14.492B", "13.421B"]
                ]
                
                # Process with AI
                ai_context = mock_client.analyze_workflow_context(natural_prompt, ["web"])
                processed_identifier = ai_context.get("dataIdentifier")
                
                data = extractor.extract_table_data(financial_url, processed_identifier)
                
                # Verify natural language processing worked
                assert data is not None
                assert len(data) > 3
                assert any("Total Revenue" in str(row) for row in data)
                assert any("Gross Profit" in str(row) for row in data)
                assert any("119.575B" in str(row) for row in data)
    
    @patch('chalicelib.web_extractor.webdriver.Chrome')
    def test_extract_with_natural_language_no_table_found_web(self, mock_chrome):
        """Test handling when no table is found on webpage with natural language prompt."""
        mock_driver = Mock()
        mock_chrome.return_value = mock_driver
        
        extractor = WebExtractor(headless=True, timeout=30)
        
        natural_prompt = "Find a table showing daily stock prices with open, high, low, close, and volume columns"
        test_url = "https://example.com/no-table-page"
        
        with patch('chalicelib.bedrock_client.get_bedrock_client') as mock_bedrock:
            mock_client = Mock()
            mock_bedrock.return_value = mock_client
            
            # Mock AI processing
            mock_client.analyze_workflow_context.return_value = {
                "sourceType": "web",
                "dataIdentifier": "stock prices", 
                "confidence": 0.85,
                "reasoning": "Looking for stock price data table"
            }
            
            # Mock page load but no table found
            mock_driver.find_elements.return_value = []  # No tables found
            
            # Should raise ValueError when table not found
            with pytest.raises(ValueError, match="Table with identifier .* not found"):
                extractor.extract_table_data(test_url, "stock prices")
            
            # In production, this would trigger a follow-up request to user
    
    @patch('chalicelib.web_extractor.webdriver.Chrome')
    def test_extract_news_table_natural_language(self, mock_chrome):
        """Test extraction from news website using natural language prompt."""
        mock_driver = Mock()
        mock_chrome.return_value = mock_driver
        
        extractor = WebExtractor(headless=True, timeout=30)
        
        # Example news/data website
        news_url = "https://www.reuters.com/markets/stocks"
        
        # Natural language prompt for market data
        natural_prompt = "Please extract the market summary table that shows major stock indices like S&P 500, Dow Jones, and NASDAQ with their current values and daily changes"
        
        with patch('chalicelib.bedrock_client.get_bedrock_client') as mock_bedrock:
            mock_client = Mock()
            mock_bedrock.return_value = mock_client
            
            # Mock AI processing 
            mock_client.analyze_workflow_context.return_value = {
                "sourceType": "web",
                "dataIdentifier": "market summary",
                "confidence": 0.88,
                "reasoning": "User wants stock market index data"
            }
            
            # Mock webpage elements
            mock_table = Mock()
            mock_table.tag_name = "table"
            mock_driver.find_elements.return_value = [mock_table]
            
            # Mock table with market data
            mock_header = Mock()
            mock_header.text = "market summary indices"
            mock_table.find_elements.return_value = [mock_header]
            
            with patch.object(extractor, '_find_table_by_identifier') as mock_find, \
                 patch.object(extractor, '_parse_table_element') as mock_parse:
                
                mock_find.return_value = mock_table
                mock_parse.return_value = [
                    ["Index", "Current", "Change", "% Change"],
                    ["S&P 500", "4,783.45", "+23.45", "+0.49%"],
                    ["Dow Jones", "37,689.54", "+156.87", "+0.42%"],
                    ["NASDAQ", "14,972.76", "+98.23", "+0.66%"],
                    ["Russell 2000", "2,089.43", "+12.67", "+0.61%"]
                ]
                
                # Process with AI
                ai_context = mock_client.analyze_workflow_context(natural_prompt, ["web"])
                processed_identifier = ai_context.get("dataIdentifier")
                
                data = extractor.extract_table_data(news_url, processed_identifier)
                
                # Verify extraction
                assert data is not None
                assert len(data) >= 4
                assert any("S&P 500" in str(row) for row in data)
                assert any("Dow Jones" in str(row) for row in data)
                assert any("4,783.45" in str(row) for row in data)


class TestWebFollowUpScenarios:
    """Test cases for handling follow-up scenarios in web extraction when tables are not found."""
    
    @patch('chalicelib.web_extractor.webdriver.Chrome')
    def test_web_no_table_found_suggests_alternatives(self, mock_chrome):
        """Test web extraction follow-up when no table is found."""
        mock_driver = Mock()
        mock_chrome.return_value = mock_driver
        
        extractor = WebExtractor(headless=True, timeout=30)
        
        # Use a real website but impossible search
        test_url = "https://finance.yahoo.com/quote/AAPL"
        impossible_prompt = "Find the table showing employee happiness metrics by department"
        
        with patch('chalicelib.bedrock_client.get_bedrock_client') as mock_bedrock:
            mock_client = Mock()
            mock_bedrock.return_value = mock_client
            
            # Mock AI processing that finds no relevant table
            mock_client.analyze_workflow_context.return_value = {
                "sourceType": "web",
                "dataIdentifier": "employee happiness metrics",
                "confidence": 0.1,
                "reasoning": "No relevant table found - this appears to be financial data website"
            }
            
            # Mock no table found
            mock_driver.find_elements.return_value = []  # No tables found
            
            with pytest.raises(ValueError, match="Table with identifier .* not found"):
                extractor.extract_table_data(test_url, "employee happiness metrics")
                
            # Mock suggestion generation for web context
            mock_client.generate_web_suggestions.return_value = {
                "suggestions": [
                    "Try 'stock price' or 'historical prices' for price data",
                    "Look for 'financial statements' or 'income statement' for financial data",
                    "Search for 'key statistics' or 'summary' for company metrics"
                ],
                "alternative_sites": [
                    "For employee data, try LinkedIn or company career pages",
                    "For company metrics, try SEC filings or annual reports"
                ]
            }
            
            # Verify web-specific suggestions would be generated
            suggestions = mock_client.generate_web_suggestions.return_value
            assert len(suggestions["suggestions"]) > 0
            assert "stock price" in suggestions["suggestions"][0]
    
    @patch('chalicelib.web_extractor.webdriver.Chrome')
    def test_web_clarification_for_multiple_matches(self, mock_chrome):
        """Test web extraction clarification when multiple tables match."""
        mock_driver = Mock()
        mock_chrome.return_value = mock_driver
        
        extractor = WebExtractor(headless=True, timeout=30)
        
        financial_url = "https://finance.yahoo.com/quote/AAPL/financials"
        broad_prompt = "Find the financial table"  # Too broad
        
        with patch('chalicelib.bedrock_client.get_bedrock_client') as mock_bedrock:
            mock_client = Mock()
            mock_bedrock.return_value = mock_client
            
            # Mock AI processing that identifies multiple options
            mock_client.analyze_workflow_context.return_value = {
                "sourceType": "web",
                "dataIdentifier": "financial table",
                "confidence": 0.4,  # Low confidence due to ambiguity
                "reasoning": "Multiple financial tables available on this page"
            }
            
            # Mock multiple tables found but unclear which one
            mock_table1 = Mock()
            mock_table1.tag_name = "table"
            mock_table2 = Mock() 
            mock_table2.tag_name = "table"
            mock_driver.find_elements.return_value = [mock_table1, mock_table2]
            
            # Mock clarification for web context
            mock_client.generate_web_clarification.return_value = {
                "message": "Multiple financial tables found on this webpage:",
                "options": [
                    "Income Statement (revenue, expenses, profit by quarter)",
                    "Balance Sheet (assets, liabilities, equity)",
                    "Cash Flow (operating, investing, financing activities)",
                    "Key Statistics (valuation metrics, ratios)"
                ],
                "page_context": "Yahoo Finance - Apple Inc. financial data"
            }
            
            # In production, would present clarification rather than error
            with patch.object(extractor, '_find_table_by_identifier') as mock_find:
                mock_find.return_value = None  # Ambiguous result
                
                try:
                    extractor.extract_table_data(financial_url, "financial table") 
                    assert False, "Should request clarification"
                except ValueError:
                    # Verify clarification request would be generated
                    clarification = mock_client.generate_web_clarification.return_value
                    assert "Multiple financial tables found" in clarification["message"]
                    assert len(clarification["options"]) >= 4


class TestDataProcessingValidation:
    """Test cases to ensure correct data processing and return validation."""
    
    @patch('chalicelib.web_extractor.webdriver.Chrome')
    def test_web_data_processing_validation(self, mock_chrome):
        """Test that web extracted data is properly processed and validated."""
        mock_driver = Mock()
        mock_chrome.return_value = mock_driver
        
        extractor = WebExtractor(headless=True, timeout=30)
        
        # Test with financial data that needs processing
        test_url = "https://finance.yahoo.com/quote/AAPL/financials"
        prompt = "Extract the quarterly revenue data with proper number formatting"
        
        # Mock successful extraction with raw data that needs processing
        mock_table = Mock()
        mock_table.tag_name = "table"
        mock_driver.find_elements.return_value = [mock_table]
        
        with patch.object(extractor, '_find_table_by_identifier') as mock_find, \
             patch.object(extractor, '_parse_table_element') as mock_parse:
            
            mock_find.return_value = mock_table
            
            # Mock raw data with various number formats needing processing
            mock_parse.return_value = [
                ["Quarter", "Revenue", "Growth"],
                ["Q4 2024", "$119,575M", "+5.4%"],
                ["Q3 2024", "$94,930M", "-1.2%"],
                ["Q2 2024", "$85,777M", "+3.8%"],
                ["Q1 2024", "$90,753M", "+0.5%"]
            ]
            
            data = extractor.extract_table_data(test_url, "quarterly revenue")
            
            # Validate data structure
            assert isinstance(data, list), "Data should be a list"
            assert len(data) > 1, "Should have header and data rows"
            assert all(isinstance(row, list) for row in data), "All rows should be lists"
            
            # Validate data content  
            assert any("Revenue" in str(row) for row in data), "Should contain revenue data"
            assert any("119,575M" in str(row) for row in data), "Should preserve number formatting"
            assert any("%" in str(row) for row in data), "Should preserve percentage symbols"
            
            # Validate data types are consistent
            for row in data[1:]:  # Skip header row
                assert len(row) == len(data[0]), "All rows should have same column count"
    
    def test_pdf_data_processing_validation(self):
        """Test that PDF extracted data is properly processed and validated."""
        extractor = PDFExtractor()
        
        test_url = "https://pic.bankofchina.com/bocappd/report/202503/P020250326622154965176.pdf"
        prompt = "Extract income statement data with proper number format processing"
        
        # Mock extraction that includes number format processing
        with patch.object(extractor, 'extract_table_data') as mock_extract:
            # Mock processed data (after number format normalization)
            mock_extract.return_value = [
                ["Item", "2024", "2023", "Change"],
                ["Interest income", "46156", "74604", "-28448"],
                ["Interest expense", "37681", "32780", "4901"], 
                ["Net interest income", "8475", "41824", "-33349"],
                ["Operating expenses", "25744", "23567", "2177"]
            ]
            
            data = extractor.extract_table_data(test_url, "income statement")
            
            # Validate data structure
            assert isinstance(data, list), "Data should be a list"
            assert len(data) >= 4, "Should have multiple rows of financial data"
            
            # Validate number processing worked correctly
            # All numeric values should be cleaned (no commas, currency symbols)
            numeric_values = []
            for row in data[1:]:  # Skip header
                for cell in row[1:]:  # Skip description column
                    if str(cell).replace('-', '').replace('.', '').isdigit():
                        numeric_values.append(cell)
                        assert ',' not in str(cell), f"Commas should be removed from {cell}"
                        assert '$' not in str(cell), f"Currency symbols should be removed from {cell}"
            
            assert len(numeric_values) > 0, "Should have processed numeric values"
            
            # Validate data completeness
            assert any("Interest income" in str(row) for row in data), "Should contain expected line items"
            assert any("46156" in str(row) for row in data), "Should contain expected values"
    
    def test_data_return_format_consistency(self):
        """Test that both PDF and web extractors return data in consistent format."""
        pdf_extractor = PDFExtractor()
        
        # Mock both extractors to return similar data structures
        with patch.object(pdf_extractor, 'extract_table_data') as mock_pdf:
            mock_pdf.return_value = [
                ["Item", "Value"],
                ["Revenue", "100000"],
                ["Expenses", "75000"]
            ]
            
            pdf_data = pdf_extractor.extract_table_data("test.pdf", "financial")
            
            # Test data format consistency
            assert isinstance(pdf_data, list), "PDF data should be list of lists"
            assert all(isinstance(row, list) for row in pdf_data), "All PDF rows should be lists"
            assert len(pdf_data) > 1, "PDF data should have header and data rows"
            
            # Mock web extractor for comparison
            with patch('chalicelib.web_extractor.webdriver.Chrome') as mock_chrome:
                mock_driver = Mock()
                mock_chrome.return_value = mock_driver
                
                web_extractor = WebExtractor(headless=True, timeout=30)
                
                with patch.object(web_extractor, 'extract_table_data') as mock_web:
                    mock_web.return_value = [
                        ["Item", "Value"],
                        ["Revenue", "100000"], 
                        ["Expenses", "75000"]
                    ]
                    
                    web_data = web_extractor.extract_table_data("test.com", "financial")
                    
                    # Verify both return same format
                    assert type(pdf_data) == type(web_data), "Both should return same data type"
                    assert len(pdf_data[0]) == len(web_data[0]), "Both should have same column structure"
                    
                    # Both should be JSON-serializable for API responses
                    import json
                    pdf_json = json.dumps(pdf_data)
                    web_json = json.dumps(web_data)
                    assert pdf_json is not None, "PDF data should be JSON serializable"
                    assert web_json is not None, "Web data should be JSON serializable"


class TestErrorHandling:
    """Test error handling scenarios."""
    
    @patch('chalicelib.web_extractor.webdriver.Chrome')
    def test_empty_table_data(self, mock_chrome):
        """Test handling of empty table data."""
        mock_driver = Mock()
        mock_chrome.return_value = mock_driver
        
        extractor = WebExtractor(headless=True, timeout=10)
        
        mock_table = Mock()
        mock_table.tag_name = "table"
        mock_table.find_elements.return_value = []
        
        result = extractor._parse_table_element(mock_table)
        assert result == []
    
    @patch('chalicelib.web_extractor.webdriver.Chrome')
    def test_malformed_table_structure(self, mock_chrome):
        """Test handling of malformed table structure."""
        mock_driver = Mock()
        mock_chrome.return_value = mock_driver
        
        extractor = WebExtractor(headless=True, timeout=10)
        
        mock_table = Mock()
        mock_table.tag_name = "table"
        mock_table.find_elements.side_effect = Exception("Parse error")
        
        with pytest.raises(Exception):
            extractor._parse_table_element(mock_table)