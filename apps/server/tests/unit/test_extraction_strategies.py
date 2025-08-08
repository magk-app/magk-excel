"""
Tests for extraction strategies
"""
import pytest
from unittest.mock import Mock, MagicMock, patch
from selenium.webdriver.remote.webelement import WebElement
from chalicelib.extraction_strategies import (
    DynamicTableStrategy, XMLStrategy, WikipediaTableStrategy,
    ProtectedSiteStrategy, StrategyFactory
)

class MockWebElement:
    """Mock WebElement for testing"""
    def __init__(self, text="", tag_name="td"):
        self.text = text
        self.tag_name = tag_name
        self._elements = []
    
    def find_elements(self, by, value):
        return self._elements
    
    def find_element(self, by, value):
        return self._elements[0] if self._elements else MockWebElement()
    
    def add_elements(self, elements):
        self._elements = elements

@pytest.fixture
def mock_driver():
    """Create a mock Chrome driver"""
    driver = Mock()
    driver.get = Mock()
    driver.page_source = "<html><body>Test</body></html>"
    return driver

class TestDynamicTableStrategy:
    """Test dynamic table extraction"""
    
    def test_extract_simple_table(self, mock_driver):
        """Test extracting a simple HTML table"""
        strategy = DynamicTableStrategy()
        
        # Mock table structure
        table = MockWebElement(tag_name="table")
        
        # Headers
        header_row = MockWebElement(tag_name="tr")
        headers = [
            MockWebElement("Period", "th"),
            MockWebElement("Visitors", "th"),
            MockWebElement("Revenue", "th")
        ]
        header_row.add_elements(headers)
        
        # Data rows
        row1 = MockWebElement(tag_name="tr")
        row1_cells = [
            MockWebElement("Jan 2024", "td"),
            MockWebElement("1,234", "td"),
            MockWebElement("$5,678", "td")
        ]
        row1.add_elements(row1_cells)
        
        row2 = MockWebElement(tag_name="tr")
        row2_cells = [
            MockWebElement("Feb 2024", "td"),
            MockWebElement("2,345", "td"),
            MockWebElement("$6,789", "td")
        ]
        row2.add_elements(row2_cells)
        
        table.add_elements(headers)  # For find_elements(By.TAG_NAME, "th")
        table._elements = [header_row, row1, row2]  # For find_elements(By.TAG_NAME, "tr")
        
        # Mock driver behavior
        with patch('selenium.webdriver.support.ui.WebDriverWait') as mock_wait:
            mock_wait.return_value.until.return_value = table
            mock_driver.find_element.return_value = table
            
            result = strategy.extract(mock_driver, "http://test.com")
        
        assert result is not None
        assert result["type"] == "table"
        assert result["headers"] == ["Period", "Visitors", "Revenue"]
        assert len(result["data"]) == 2
        assert result["data"][0] == ["Jan 2024", "1,234", "$5,678"]
    
    def test_no_table_found(self, mock_driver):
        """Test when no table is found"""
        strategy = DynamicTableStrategy(wait_time=1)
        
        with patch('selenium.webdriver.support.ui.WebDriverWait') as mock_wait:
            mock_wait.return_value.until.side_effect = Exception("Timeout")
            
            result = strategy.extract(mock_driver, "http://test.com")
        
        assert result is None

class TestXMLStrategy:
    """Test XML extraction"""
    
    def test_extract_xml_data(self, mock_driver):
        """Test extracting data from XML"""
        strategy = XMLStrategy()
        
        xml_content = """<?xml version="1.0"?>
        <stockData>
            <ticker>AAPL</ticker>
            <price>150.50</price>
            <metrics>
                <pe>25.5</pe>
                <marketCap>2500000000000</marketCap>
            </metrics>
        </stockData>"""
        
        # Mock pre element containing XML
        pre_element = MockWebElement(xml_content, "pre")
        mock_driver.find_elements.return_value = [pre_element]
        
        result = strategy.extract(mock_driver, "http://test.com/data.xml")
        
        assert result is not None
        assert result["type"] == "xml"
        assert result["root_tag"] == "stockData"
        assert "data" in result
    
    def test_xml_to_dict_conversion(self):
        """Test XML to dictionary conversion"""
        strategy = XMLStrategy()
        
        import xml.etree.ElementTree as ET
        xml_string = """<root>
            <item id="1">
                <name>Test</name>
                <value>123</value>
            </item>
        </root>"""
        
        root = ET.fromstring(xml_string)
        result = strategy._xml_to_dict(root)
        
        assert "item" in result
        assert result["item"]["name"]["text"] == "Test"
        assert result["item"]["@attributes"]["id"] == "1"

class TestWikipediaTableStrategy:
    """Test Wikipedia table extraction"""
    
    def test_extract_wikipedia_table(self, mock_driver):
        """Test extracting a Wikipedia table"""
        strategy = WikipediaTableStrategy("GDP")
        
        # Mock Wikipedia table
        table = MockWebElement(tag_name="table")
        table.text = "GDP by Province"  # For identifier matching
        
        # Header row
        header_row = MockWebElement(tag_name="tr")
        headers = [
            MockWebElement("Province", "th"),
            MockWebElement("GDP (CNY)", "th"),
            MockWebElement("Share %", "th")
        ]
        header_row.add_elements(headers)
        
        # Data row
        data_row = MockWebElement(tag_name="tr")
        cells = [
            MockWebElement("Guangdong", "td"),
            MockWebElement("12,910,254.9", "td"),
            MockWebElement("10.67%", "td")
        ]
        data_row.add_elements(cells)
        
        table._elements = [header_row, data_row]
        
        mock_driver.find_elements.return_value = [table]
        mock_driver.find_element.return_value = header_row
        
        result = strategy.extract(mock_driver, "http://en.wikipedia.org/wiki/Test")
        
        assert result is not None
        assert result["type"] == "wikipedia_table"
        assert result["headers"] == ["Province", "GDP (CNY)", "Share %"]
        assert len(result["data"]) == 1
        assert result["data"][0] == ["Guangdong", "12,910,254.9", "10.67%"]

class TestProtectedSiteStrategy:
    """Test protected site handling"""
    
    def test_access_denied_detection(self, mock_driver):
        """Test detection of access denied pages"""
        strategy = ProtectedSiteStrategy()
        
        # Mock access denied page
        body = MockWebElement("Access Denied - Error 403", "body")
        mock_driver.find_element.return_value = body
        mock_driver.execute_cdp_cmd = Mock()
        
        result = strategy.extract(mock_driver, "http://protected.com")
        
        assert result is not None
        assert result["type"] == "error"
        assert result["error"] == "access_denied"

class TestStrategyFactory:
    """Test strategy factory"""
    
    def test_select_xml_strategy(self):
        """Test XML strategy selection"""
        strategy = StrategyFactory.get_strategy("http://test.com/data.xml")
        assert isinstance(strategy, XMLStrategy)
    
    def test_select_wikipedia_strategy(self):
        """Test Wikipedia strategy selection"""
        strategy = StrategyFactory.get_strategy("http://en.wikipedia.org/wiki/Test")
        assert isinstance(strategy, WikipediaTableStrategy)
    
    def test_select_protected_strategy(self):
        """Test protected site strategy selection"""
        strategy = StrategyFactory.get_strategy("http://macrotrends.net/data")
        assert isinstance(strategy, ProtectedSiteStrategy)
    
    def test_select_default_strategy(self):
        """Test default strategy selection"""
        strategy = StrategyFactory.get_strategy("http://example.com")
        assert isinstance(strategy, DynamicTableStrategy)

# Integration test with real data samples
class TestRealDataSamples:
    """Test with realistic data samples"""
    
    @pytest.mark.parametrize("url,expected_type", [
        ("https://tablebuilder.singstat.gov.sg/table/TS/M550241", "table"),
        ("https://www.dbs.com.hk/data.xml", "xml"),
        ("https://en.wikipedia.org/wiki/Economy_of_China", "wikipedia_table"),
        ("https://www.macrotrends.net/countries/data", "error")
    ])
    def test_strategy_selection_for_real_urls(self, url, expected_type):
        """Test strategy selection for real URLs"""
        strategy = StrategyFactory.get_strategy(url)
        assert strategy is not None