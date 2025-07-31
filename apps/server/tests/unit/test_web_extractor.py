import pytest
import os
from unittest.mock import Mock, patch
from selenium.common.exceptions import TimeoutException, WebDriverException
from chalicelib.web_extractor import (
    WebExtractor, extract_web_table, WebExtractionError, 
    TimeoutError, ElementNotFoundError
)


class TestWebExtractor:
    """Test cases for WebExtractor class - includes both unit tests and real integration tests."""

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

        with pytest.raises(WebExtractionError,
                            match="Failed to initialize WebDriver"):
            self.extractor._setup_driver()

    def test_navigate_to_url_success(self):
        """Test successful URL navigation."""
        # Setup mocks
        mock_driver = Mock()
        mock_wait_instance = Mock()
        self.extractor.driver = mock_driver
        self.extractor._unified_wait = mock_wait_instance

        # Execute
        self.extractor._navigate_to_url("https://example.com")

        # Verify
        mock_driver.get.assert_called_once_with("https://example.com")
        mock_wait_instance.until.assert_called_once()

    def test_navigate_to_url_timeout(self):
        """Test URL navigation timeout."""
        mock_driver = Mock()
        mock_wait_instance = Mock()
        mock_wait_instance.until.side_effect = TimeoutException()
        self.extractor.driver = mock_driver
        self.extractor._unified_wait = mock_wait_instance

        with pytest.raises(TimeoutError, match="Page load timeout"):
            self.extractor._navigate_to_url("https://example.com")

    def test_find_table_element_by_id(self):
        """Test finding table by ID."""
        mock_driver = Mock()
        mock_wait = Mock()
        mock_table = Mock()
        mock_wait.until.return_value = mock_table
        
        self.extractor.driver = mock_driver
        self.extractor._unified_wait = mock_wait

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
        mock_table.find_elements.side_effect = lambda by, tag: {
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
        def side_effect(by, tag):
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

    @pytest.mark.integration
    def test_wikipedia_china_gdp_real_extraction(self):
        """Test real extraction from Wikipedia China GDP table - INTEGRATION TEST."""
        url = "https://en.wikipedia.org/wiki/Economy_of_China"
        table_identifier = "GDP by administrative division"
        
        try:
            result = self.extractor.extract_table(url, table_identifier)
            
            # Verify structure
            assert len(result) > 0, "Should extract at least header row"
            assert len(result[0]) >= 3, "Should have at least 3 columns (Province, GDP values)"
            
            # Verify header contains expected columns
            header = result[0]
            header_text = ' '.join(header).lower()
            assert any(term in header_text for term in ['province', 'region', 'gdp']), f"Header should contain province/GDP info: {header}"
            
            # Verify data rows
            if len(result) > 1:
                # Check first data row has content
                first_row = result[1]
                assert any(cell.strip() for cell in first_row), "First data row should have content"
                
                # Verify common provinces are present
                all_data = ' '.join([' '.join(row) for row in result[1:]])
                common_provinces = ['guangdong', 'jiangsu', 'shandong']
                found_provinces = sum(1 for province in common_provinces if province in all_data.lower())
                assert found_provinces >= 1, f"Should find at least one major province in data: {all_data[:200]}..."
            
            print(f"SUCCESS: Extracted {len(result)} rows from Wikipedia GDP table")
            print(f"Header: {result[0]}")
            if len(result) > 1:
                print(f"First data row: {result[1]}")
                
        except WebExtractionError as e:
            pytest.skip(f"Wikipedia extraction failed (may be temporary): {e}")
        except Exception as e:
            pytest.fail(f"Unexpected error during Wikipedia extraction: {e}")

    @patch('chalicelib.web_extractor.StrategyFactory.get_strategy')
    @patch('chalicelib.web_extractor.WebExtractor._setup_driver')
    @patch('chalicelib.web_extractor.WebExtractor._cleanup')
    def test_extract_table_success_mocked(self, mock_cleanup, mock_setup, mock_strategy_factory):
        """Test successful table extraction end-to-end - UNIT TEST with mocks."""
        mock_strategy = Mock()
        mock_strategy.extract.return_value = {
            "type": "table",
            "headers": ["Header"],
            "data": [["Data"]]
        }
        mock_strategy_factory.return_value = mock_strategy
        
        self.extractor.driver = Mock()

        result = self.extractor.extract_table("https://example.com", "test-table")

        assert result == [["Header"], ["Data"]]
        mock_setup.assert_called_once()
        mock_cleanup.assert_called_once()

    @pytest.mark.integration
    def test_singapore_statistics_javascript_required(self):
        """Test handling of JavaScript-required site - INTEGRATION TEST."""
        url = "https://tablebuilder.singstat.gov.sg/table/TS/M550241"
        table_identifier = "statistics-table"
        
        try:
            # This should handle the JavaScript requirement gracefully
            result = self.extractor.extract_table(url, table_identifier)
            
            # If successful, verify structure
            if result:
                assert len(result) > 0, "Should extract data if JS loads properly"
                print(f"SUCCESS: Singapore site worked, extracted {len(result)} rows")
            else:
                pytest.skip("Singapore site requires JavaScript - expected behavior")
                
        except (WebExtractionError, TimeoutError) as e:
            # Expected behavior for JS-heavy sites
            print(f"EXPECTED: Singapore site failed due to JS requirement: {e}")
            assert "timeout" in str(e).lower() or "element not found" in str(e).lower()
        except Exception as e:
            pytest.fail(f"Unexpected error type: {e}")

    @patch('chalicelib.web_extractor.StrategyFactory.get_strategy')
    @patch('chalicelib.web_extractor.WebExtractor._setup_driver')
    @patch('chalicelib.web_extractor.WebExtractor._cleanup')
    def test_extract_table_navigation_error_mocked(self, mock_cleanup, mock_setup, mock_strategy_factory):
        """Test extraction with navigation error - UNIT TEST with mocks."""
        mock_strategy = Mock()
        mock_strategy.extract.side_effect = TimeoutException("Navigation failed")
        mock_strategy_factory.return_value = mock_strategy
        
        self.extractor.driver = Mock()

        with pytest.raises(TimeoutError):
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
        mock_extractor.extract_table.assert_called_once_with(
            "https://example.com", "test-table"
        )


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

        with pytest.raises(WebExtractionError, match="Failed to parse table data"):
            extractor._parse_table_element(mock_table)
