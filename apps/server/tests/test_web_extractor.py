import pytest
from unittest.mock import Mock, patch, MagicMock
from selenium.common.exceptions import TimeoutException, WebDriverException
from chalicelib.web_extractor import WebExtractor, extract_web_table


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