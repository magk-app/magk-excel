import pytest
from unittest.mock import Mock, patch, MagicMock
from selenium.common.exceptions import TimeoutException, WebDriverException
from chalicelib.web_extractor import WebExtractor, extract_web_table


class TestWebExtractor:
    """Test cases for WebExtractor class."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.extractor = WebExtractor(headless=True, timeout=10)
    
    def teardown_method(self):
        """Clean up after tests."""
        if hasattr(self.extractor, 'driver') and self.extractor.driver:
            self.extractor.driver.quit()
    
    @patch('chalicelib.web_extractor.webdriver.Chrome')
    def test_setup_driver_success(self, mock_chrome):
        """Test successful WebDriver setup."""
        mock_driver = Mock()
        mock_chrome.return_value = mock_driver
        
        self.extractor._setup_driver()
        
        assert self.extractor.driver == mock_driver
        mock_driver.set_page_load_timeout.assert_called_once_with(10)
        mock_chrome.assert_called_once()
    
    @patch('chalicelib.web_extractor.webdriver.Chrome')
    def test_setup_driver_failure(self, mock_chrome):
        """Test WebDriver setup failure."""
        mock_chrome.side_effect = WebDriverException("Chrome not found")
        
        with pytest.raises(WebDriverException, match="Failed to initialize WebDriver"):
            self.extractor._setup_driver()
    
    @patch('chalicelib.web_extractor.WebDriverWait')
    def test_navigate_to_url_success(self, mock_wait):
        """Test successful URL navigation."""
        # Setup mocks
        mock_driver = Mock()
        mock_wait_instance = Mock()
        mock_wait.return_value = mock_wait_instance
        self.extractor.driver = mock_driver
        
        # Execute
        self.extractor._navigate_to_url("https://example.com")
        
        # Verify
        mock_driver.get.assert_called_once_with("https://example.com")
        mock_wait.assert_called_once_with(mock_driver, 10)
    
    @patch('chalicelib.web_extractor.WebDriverWait')
    def test_navigate_to_url_timeout(self, mock_wait):
        """Test URL navigation timeout."""
        mock_driver = Mock()
        mock_wait_instance = Mock()
        mock_wait_instance.until.side_effect = TimeoutException()
        mock_wait.return_value = mock_wait_instance
        self.extractor.driver = mock_driver
        
        with pytest.raises(TimeoutException, match="Page load timeout"):
            self.extractor._navigate_to_url("https://example.com")
    
    def test_find_table_element_by_id(self):
        """Test finding table by ID."""
        mock_driver = Mock()
        mock_wait = Mock()
        mock_table = Mock()
        
        with patch('chalicelib.web_extractor.WebDriverWait') as mock_wait_class:
            mock_wait_class.return_value = mock_wait
            mock_wait.until.return_value = mock_table
            self.extractor.driver = mock_driver
            
            result = self.extractor._find_table_element("test-table")
            
            assert result == mock_table
    
    def test_parse_table_element_with_thead_tbody(self):
        """Test parsing table with proper thead/tbody structure."""
        # Create mock table structure
        mock_table = Mock()
        
        # Mock thead
        mock_thead = Mock()
        mock_header_row = Mock()
        mock_th1, mock_th2 = Mock(), Mock()
        mock_th1.text = "Column 1"
        mock_th2.text = "Column 2"
        mock_header_row.find_elements.return_value = [mock_th1, mock_th2]
        mock_thead.find_elements.return_value = [mock_header_row]
        
        # Mock tbody
        mock_tbody = Mock()
        mock_data_row = Mock()
        mock_td1, mock_td2 = Mock(), Mock()
        mock_td1.text = "Data 1"
        mock_td2.text = "Data 2"
        mock_data_row.find_elements.return_value = [mock_td1, mock_td2]
        mock_tbody.find_elements.return_value = [mock_data_row]
        
        # Configure table mock
        mock_table.find_elements.side_effect = lambda tag: {
            "thead": [mock_thead],
            "tbody": [mock_tbody]
        }.get(tag, [])
        
        result = self.extractor._parse_table_element(mock_table)
        
        expected = [
            ["Column 1", "Column 2"],
            ["Data 1", "Data 2"]
        ]
        assert result == expected
    
    def test_parse_table_element_simple_structure(self):
        """Test parsing table with simple tr/td structure."""
        mock_table = Mock()
        
        # No thead/tbody
        mock_table.find_elements.side_effect = lambda tag: []
        
        # Mock rows directly under table
        mock_row1, mock_row2 = Mock(), Mock()
        mock_td1, mock_td2 = Mock(), Mock()
        mock_td3, mock_td4 = Mock(), Mock()
        
        mock_td1.text = "Header 1"
        mock_td2.text = "Header 2"
        mock_td3.text = "Value 1"
        mock_td4.text = "Value 2"
        
        mock_row1.find_elements.return_value = [mock_td1, mock_td2]
        mock_row2.find_elements.return_value = [mock_td3, mock_td4]
        
        # Override the find_elements for "tr" specifically
        def side_effect(tag):
            if tag == "tr":
                return [mock_row1, mock_row2]
            return []
        
        mock_table.find_elements.side_effect = side_effect
        
        result = self.extractor._parse_table_element(mock_table)
        
        expected = [
            ["Header 1", "Header 2"],
            ["Value 1", "Value 2"]
        ]
        assert result == expected
    
    @patch('chalicelib.web_extractor.WebExtractor._setup_driver')
    @patch('chalicelib.web_extractor.WebExtractor._navigate_to_url')
    @patch('chalicelib.web_extractor.WebExtractor._extract_table_data')
    @patch('chalicelib.web_extractor.WebExtractor._cleanup')
    def test_extract_table_success(self, mock_cleanup, mock_extract, mock_navigate, mock_setup):
        """Test successful table extraction end-to-end."""
        mock_extract.return_value = [["Header"], ["Data"]]
        
        result = self.extractor.extract_table("https://example.com", "test-table")
        
        assert result == [["Header"], ["Data"]]
        mock_setup.assert_called_once()
        mock_navigate.assert_called_once_with("https://example.com")
        mock_extract.assert_called_once_with("test-table")
        mock_cleanup.assert_called_once()
    
    @patch('chalicelib.web_extractor.WebExtractor._setup_driver')
    @patch('chalicelib.web_extractor.WebExtractor._navigate_to_url')
    @patch('chalicelib.web_extractor.WebExtractor._cleanup')
    def test_extract_table_navigation_error(self, mock_cleanup, mock_navigate, mock_setup):
        """Test extraction with navigation error."""
        mock_navigate.side_effect = TimeoutException("Navigation failed")
        
        with pytest.raises(TimeoutException):
            self.extractor.extract_table("https://example.com", "test-table")
        
        mock_cleanup.assert_called_once()
    
    def test_cleanup_with_driver(self):
        """Test cleanup with active driver."""
        mock_driver = Mock()
        self.extractor.driver = mock_driver
        
        self.extractor._cleanup()
        
        mock_driver.quit.assert_called_once()
    
    def test_cleanup_without_driver(self):
        """Test cleanup without active driver."""
        self.extractor.driver = None
        
        # Should not raise exception
        self.extractor._cleanup()


class TestConvenienceFunction:
    """Test cases for the convenience function."""
    
    @patch('chalicelib.web_extractor.WebExtractor')
    def test_extract_web_table(self, mock_extractor_class):
        """Test the convenience function."""
        mock_extractor = Mock()
        mock_extractor.extract_table.return_value = [["Test"], ["Data"]]
        mock_extractor_class.return_value = mock_extractor
        
        result = extract_web_table("https://example.com", "test-table")
        
        assert result == [["Test"], ["Data"]]
        mock_extractor_class.assert_called_once()
        mock_extractor.extract_table.assert_called_once_with("https://example.com", "test-table")


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
    
    def test_empty_table_data(self):
        """Test handling of empty table data."""
        extractor = WebExtractor()
        
        mock_table = Mock()
        mock_table.find_elements.return_value = []
        
        result = extractor._parse_table_element(mock_table)
        assert result == []
    
    def test_malformed_table_structure(self):
        """Test handling of malformed table structure."""
        extractor = WebExtractor()
        
        mock_table = Mock()
        mock_table.find_elements.side_effect = Exception("Parse error")
        
        with pytest.raises(ValueError, match="Failed to parse table data"):
            extractor._parse_table_element(mock_table)