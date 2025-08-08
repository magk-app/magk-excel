"""
Extraction strategies for different types of web content
"""
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import xml.etree.ElementTree as ET
import time
import logging
from typing import Dict, List, Optional, Any
from abc import ABC, abstractmethod
from datetime import date, timedelta

logger = logging.getLogger(__name__)

class ExtractionStrategy(ABC):
    """Base class for extraction strategies"""
    
    @abstractmethod
    def extract(self, driver: webdriver.Chrome, url: str) -> Optional[Dict[str, Any]]:
        """Extract data from the given URL"""
        pass

class DynamicTableStrategy(ExtractionStrategy):
    """Strategy for extracting data from JavaScript-rendered tables"""
    
    def __init__(self, wait_time: int = 20):
        self.wait_time = wait_time
        self.table_selectors = [
            "table.data-table",
            "table[role='grid']",
            "div.table-container table",
            "[class*='table']:not([class*='nav'])",
            "table.table",
            "table"
        ]
    
    def extract(self, driver: webdriver.Chrome, url: str) -> Optional[Dict[str, Any]]:
        driver.get(url)
        wait = WebDriverWait(driver, self.wait_time)
        
        # Try multiple selectors
        table = None
        for selector in self.table_selectors:
            try:
                table = wait.until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                )
                logger.info(f"Found table with selector: {selector}")
                break
            except:
                continue
        
        if not table:
            logger.warning("No table found with any selector")
            return None
        
        # Extract headers
        headers = []
        header_elements = table.find_elements(By.TAG_NAME, "th")
        if not header_elements:
            # Try first row as headers
            first_row = table.find_element(By.TAG_NAME, "tr")
            header_elements = first_row.find_elements(By.TAG_NAME, "td")
        
        headers = [h.text.strip() for h in header_elements if h.text.strip()]
        
        # Extract data rows
        rows = table.find_elements(By.TAG_NAME, "tr")
        data = []
        
        for i, row in enumerate(rows):
            cells = row.find_elements(By.TAG_NAME, "td")
            if cells and len(cells) > 0:
                row_data = [cell.text.strip() for cell in cells]
                # Skip if row is likely a header row
                if i == 0 and not headers:
                    headers = row_data
                else:
                    data.append(row_data)
        
        return {
            "type": "table",
            "headers": headers,
            "data": data,
            "rows": len(data),
            "columns": len(headers) if headers else 0
        }

class XMLStrategy(ExtractionStrategy):
    """Strategy for extracting data from XML documents"""
    
    def extract(self, driver: webdriver.Chrome, url: str) -> Optional[Dict[str, Any]]:
        driver.get(url)
        time.sleep(3)  # Allow XML to load
        
        try:
            # Get page source and parse as XML
            page_source = driver.page_source
            
            # Try to extract XML content from the page
            if "<html" in page_source.lower():
                # XML displayed in browser, extract from pre tag
                pre_elements = driver.find_elements(By.TAG_NAME, "pre")
                if pre_elements:
                    xml_content = pre_elements[0].text
                else:
                    # Try body text
                    body = driver.find_element(By.TAG_NAME, "body")
                    xml_content = body.text
            else:
                xml_content = page_source
            
            # Parse XML
            root = ET.fromstring(xml_content)
            
            # Extract data recursively
            data = self._xml_to_dict(root)
            
            return {
                "type": "xml",
                "root_tag": root.tag,
                "data": data
            }
            
        except Exception as e:
            logger.error(f"XML parsing error: {str(e)}")
            return None
    
    def _xml_to_dict(self, element) -> Dict[str, Any]:
        """Convert XML element to dictionary"""
        result = {}
        
        # Add attributes
        if element.attrib:
            result["@attributes"] = element.attrib
        
        # Add text content
        if element.text and element.text.strip():
            result["text"] = element.text.strip()
        
        # Add child elements
        for child in element:
            child_data = self._xml_to_dict(child)
            if child.tag in result:
                # Convert to list if multiple elements with same tag
                if not isinstance(result[child.tag], list):
                    result[child.tag] = [result[child.tag]]
                result[child.tag].append(child_data)
            else:
                result[child.tag] = child_data
        
        return result

class WikipediaTableStrategy(ExtractionStrategy):
    """Strategy for extracting tables from Wikipedia pages"""
    
    def __init__(self, table_identifier: Optional[str] = None):
        self.table_identifier = table_identifier
    
    def extract(self, driver: webdriver.Chrome, url: str) -> Optional[Dict[str, Any]]:
        driver.get(url)
        time.sleep(2)  # Allow page to load
        
        # Find all wikitable elements
        tables = driver.find_elements(By.CSS_SELECTOR, "table.wikitable")
        
        if not tables:
            logger.warning("No Wikipedia tables found")
            return None
        
        target_table = None
        
        if self.table_identifier:
            # Look for table containing specific text
            for table in tables:
                table_text = table.text.lower()
                if self.table_identifier.lower() in table_text:
                    target_table = table
                    break
        else:
            # Use first table
            target_table = tables[0]
        
        if not target_table:
            logger.warning(f"No table found with identifier: {self.table_identifier}")
            return None
        
        # Extract headers
        headers = []
        header_row = target_table.find_element(By.TAG_NAME, "tr")
        header_elements = header_row.find_elements(By.TAG_NAME, "th")
        headers = [h.text.strip() for h in header_elements]
        
        # Extract data
        rows = target_table.find_elements(By.TAG_NAME, "tr")[1:]  # Skip header row
        data = []
        
        for row in rows:
            cells = row.find_elements(By.TAG_NAME, "td")
            if not cells:
                cells = row.find_elements(By.TAG_NAME, "th")
            
            row_data = [cell.text.strip() for cell in cells]
            if row_data and any(row_data):  # Skip empty rows
                data.append(row_data)
        
        return {
            "type": "wikipedia_table",
            "headers": headers,
            "data": data,
            "rows": len(data),
            "columns": len(headers)
        }

class ProtectedSiteStrategy(ExtractionStrategy):
    """Strategy for sites with anti-bot protection"""
    
    def __init__(self, wait_time: int = 30):
        self.wait_time = wait_time
    
    def extract(self, driver: webdriver.Chrome, url: str) -> Optional[Dict[str, Any]]:
        # Configure driver for stealth
        driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
            "source": """
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                })
            """
        })
        
        driver.get(url)
        time.sleep(5)  # Initial wait
        
        # Check for access denied
        page_text = driver.find_element(By.TAG_NAME, "body").text.lower()
        if "access denied" in page_text or "403" in page_text:
            logger.warning("Access denied - site has anti-bot protection")
            return {
                "type": "error",
                "error": "access_denied",
                "message": "Site has anti-bot protection. Manual access may be required."
            }
        
        # Try standard table extraction
        table_strategy = DynamicTableStrategy(self.wait_time)
        return table_strategy.extract(driver, url)

class StrategyFactory:
    """Factory for selecting appropriate extraction strategy"""
    
    @staticmethod
    def get_strategy(url: str, data_identifier: Optional[str] = None) -> ExtractionStrategy:
        """Select strategy based on URL and data identifier"""
        
        url_lower = url.lower()
        
        # XML files
        if url_lower.endswith('.xml'):
            return XMLStrategy()
        
        # Wikipedia
        if 'wikipedia.org' in url_lower:
            return WikipediaTableStrategy(data_identifier)
        
        # Protected sites (known patterns)
        protected_domains = ['macrotrends.net', 'investing.com', 'tradingview.com']
        if any(domain in url_lower for domain in protected_domains):
            return ProtectedSiteStrategy()
        
        # Singapore statistics (requires JavaScript)
        if 'singstat.gov.sg' in url_lower:
            return DynamicTableStrategy(wait_time=30)
        
        # Hong Kong Immigration Department
        if 'immd.gov.hk' in url_lower or 'data.gov.hk' in url_lower and 'hk-immd' in url_lower:
            return HKImmigrationStrategy(data_identifier)
        
        # Default strategy
        return DynamicTableStrategy()


class HKImmigrationStrategy(ExtractionStrategy):
    """Strategy for extracting Hong Kong Immigration Department data"""
    
    def __init__(self, date_range_config: Optional[str] = None):
        self.date_range_config = date_range_config
        
    def extract(self, driver: webdriver.Chrome, url: str) -> Optional[Dict[str, Any]]:
        """Extract HK Immigration data using the specialized extractor"""
        try:
            # Import here to avoid circular imports
            from .hk_immigration_extractor import HKImmigrationExtractor
            
            # Parse date range from data_identifier if provided
            date_range = self._parse_date_range(self.date_range_config)
            
            # Use the specialized HK Immigration extractor
            extractor = HKImmigrationExtractor()
            result = extractor.extract_immigration_data(date_range)
            
            # Convert to standard strategy format
            return {
                "type": "hk_immigration",
                "headers": result["data"][0] if result["data"] else [],
                "data": result["data"][1:] if len(result["data"]) > 1 else [],
                "rows": len(result["data"]) - 1 if result["data"] else 0,
                "columns": len(result["data"][0]) if result["data"] else 0,
                "statistics": result["statistics"],
                "metadata": result["metadata"]
            }
            
        except Exception as e:
            logger.error(f"HK Immigration extraction failed: {str(e)}")
            return {
                "type": "error",
                "error": "hk_immigration_extraction_failed",
                "message": f"Failed to extract HK Immigration data: {str(e)}"
            }
    
    def _parse_date_range(self, config: Optional[str]) -> Dict[str, date]:
        """Parse date range configuration or use default last month"""
        if not config:
            # Default to last month
            today = date.today()
            first_day_this_month = today.replace(day=1)
            last_day_last_month = first_day_this_month - timedelta(days=1)
            first_day_last_month = last_day_last_month.replace(day=1)
            
            return {
                "start": first_day_last_month,
                "end": last_day_last_month
            }
        
        # Parse custom date range format: "YYYY-MM-DD,YYYY-MM-DD"
        try:
            if ',' in config:
                start_str, end_str = config.split(',')
                start_date = date.fromisoformat(start_str.strip())
                end_date = date.fromisoformat(end_str.strip())
                return {"start": start_date, "end": end_date}
        except Exception as e:
            logger.warning(f"Failed to parse date range '{config}': {e}. Using default last month.")
        
        # Fallback to last month
        today = date.today()
        first_day_this_month = today.replace(day=1)
        last_day_last_month = first_day_this_month - timedelta(days=1)
        first_day_last_month = last_day_last_month.replace(day=1)
        
        return {
            "start": first_day_last_month,
            "end": last_day_last_month
        }