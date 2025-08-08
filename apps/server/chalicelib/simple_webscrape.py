"""
Simple Web Table Extractor using Selenium
A straightforward tool to scrape table data from websites
"""

import time
import logging
from typing import List, Optional
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException, WebDriverException

from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SimpleWebExtractor:
    """A simple web table extractor using Selenium."""
    
    def __init__(self, headless: bool = True, timeout: int = 10):
        """
        Initialize the extractor.
        
        Args:
            headless: Run browser in headless mode (no GUI)
            timeout: Maximum time to wait for elements (seconds)
        """
        self.headless = headless
        self.timeout = timeout
        self.driver = None
    
    def setup_driver(self):
        """Set up Chrome WebDriver with basic options."""
        try:
            options = Options()
            
            if self.headless:
                options.add_argument('--headless')
            
            # Basic Chrome options for compatibility
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            options.add_argument('--disable-gpu')
            options.add_argument('--window-size=1920,1080')
            
            # Initialize driver
            self.driver = webdriver.Chrome(options=options)
            self.driver.set_page_load_timeout(self.timeout)
            
            logger.info("WebDriver initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize WebDriver: {e}")
            raise
    
    def extract_tables(self, url: str) -> List[List[List[str]]]:
        """
        Extract all tables from a webpage.
        
        Args:
            url: The URL to scrape
            
        Returns:
            List of tables, where each table is a list of rows,
            and each row is a list of cell values
        """
        if not self.driver:
            self.setup_driver()
        
        try:
            logger.info(f"Navigating to: {url}")
            self.driver.get(url)
            
            # Wait for page to load
            WebDriverWait(self.driver, self.timeout).until(
                lambda driver: driver.execute_script("return document.readyState") == "complete"
            )
            
            # Find all tables on the page
            tables = self.driver.find_elements(By.TAG_NAME, "table")
            
            if not tables:
                logger.warning("No tables found on the page")
                return []
            
            logger.info(f"Found {len(tables)} table(s)")
            
            all_tables_data = []
            
            for i, table in enumerate(tables):
                logger.info(f"Processing table {i + 1}")
                table_data = self._extract_table_data(table)
                if table_data:  # Only add non-empty tables
                    all_tables_data.append(table_data)
            
            return all_tables_data
            
        except TimeoutException:
            logger.error(f"Timeout loading page: {url}")
            raise
        except Exception as e:
            logger.error(f"Error extracting tables: {e}")
            raise
        finally:
            self.close()
    
    def extract_first_table(self, url: str) -> List[List[str]]:
        """
        Extract only the first table from a webpage.
        
        Args:
            url: The URL to scrape
            
        Returns:
            List of rows, where each row is a list of cell values
        """
        all_tables = self.extract_tables(url)
        return all_tables[0] if all_tables else []
    
    def _extract_table_data(self, table_element) -> List[List[str]]:
        """
        Extract data from a single table element.
        
        Args:
            table_element: Selenium WebElement representing a table
            
        Returns:
            List of rows, where each row is a list of cell values
        """
        table_data = []
        
        try:
            # Get all rows from the table
            rows = table_element.find_elements(By.TAG_NAME, "tr")
            
            for row in rows:
                # Get all cells in the row (both th and td)
                cells = row.find_elements(By.TAG_NAME, "th") + row.find_elements(By.TAG_NAME, "td")
                
                if cells:
                    # Extract text from each cell and clean it
                    row_data = [cell.text.strip() for cell in cells]
                    # Only add rows that have content
                    if any(cell for cell in row_data):
                        table_data.append(row_data)
            
            logger.info(f"Extracted {len(table_data)} rows from table")
            return table_data
            
        except Exception as e:
            logger.error(f"Error extracting table data: {e}")
            return []
    
    def close(self):
        """Close the WebDriver."""
        if self.driver:
            try:
                self.driver.quit()
                logger.info("WebDriver closed")
            except Exception as e:
                logger.error(f"Error closing WebDriver: {e}")
            finally:
                self.driver = None


# Convenience functions for quick usage
def scrape_tables(url: str, headless: bool = True, timeout: int = 10) -> List[List[List[str]]]:
    """
    Quick function to scrape all tables from a URL.
    
    Args:
        url: The URL to scrape
        headless: Run browser in headless mode
        timeout: Maximum time to wait for elements
        
    Returns:
        List of tables, where each table is a list of rows
    """
    extractor = SimpleWebExtractor(headless=headless, timeout=timeout)
    return extractor.extract_tables(url)


def scrape_first_table(url: str, headless: bool = True, timeout: int = 10) -> List[List[str]]:
    """
    Quick function to scrape the first table from a URL.
    
    Args:
        url: The URL to scrape
        headless: Run browser in headless mode
        timeout: Maximum time to wait for elements
        
    Returns:
        List of rows, where each row is a list of cell values
    """
    extractor = SimpleWebExtractor(headless=headless, timeout=timeout)
    return extractor.extract_first_table(url)


# Example usage
if __name__ == "__main__":
    # test case urls
    urls_1_1_1 = [
        "https://www.immd.gov.hk/eng/facts/control.html",
        "https://worldostats.com/country-stats/tiger-population-by-country/",
        "https://tablebuilder.singstat.gov.sg/table/TS/M550241",
        "https://quickfs.net/company/META:US",
    ]

    urls_1_1_2 = [
        "https://www.singstat.gov.sg/find-data/search-by-theme/population/births-and-fertility/latest-data",
        "https://en.wikipedia.org/wiki/2024%E2%80%9325_Premier_League",
    ]

    urls_1_1_3 = [
        "https://www.immd.gov.hk/eng/facts/control.html",
        "https://worldostats.com/country-stats/tiger-population-by-country/",
        "https://tablebuilder.singstat.gov.sg/table/TS/M550241",
        "https://quickfs.net/company/META:US",
    ]

    urls_1_1_4 = [
        "https://en.wikipedia.org/wiki/List_of_Chinese_administrative_divisions_by_population",
        "https://www.barnsleyfc.co.uk/tickets/match-tickets/pricing-65abc17a",
        "https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-tables/",
        "https://www.bloomberg.com/markets/rates-bonds/government-bonds/us",
    ]

    urls_1_1_5 = [
        "https://www.immd.gov.hk/eng/facts/passenger-statistics.html?d=20250730",
        "https://www.censtatd.gov.hk/en/web_table.html?id=310-30001",
    ]
    
    # Test all URLs in the arrays
    all_url_arrays = [
        ("1.1.1 - Basic Table Extraction", urls_1_1_1),
        ("1.1.2 - Tables with References", urls_1_1_2),
        ("1.1.3 - Complex Table Structures", urls_1_1_3),
        ("1.1.4 - Multiple Tables on One Page", urls_1_1_4),
        ("1.1.5 - Confusing Table Formats", urls_1_1_5),
    ]
    
    for test_name, urls in all_url_arrays:
        print(f"\n{'='*60}")
        print(f"TESTING: {test_name}")
        print(f"{'='*60}")
        
        for i, url in enumerate(urls, 1):
            print(f"\n--- Test {i}: {url} ---")
            try:
                print("Scraping all tables...")
                tables = scrape_tables(url)
                
                print(f"Found {len(tables)} tables")
                
                if tables:
                    for table_idx, table in enumerate(tables):
                        print(f"\nTable {table_idx + 1}:")
                        print(f"  Rows: {len(table)}")
                        print(f"  Columns: {len(table[0]) if table else 0}")
                        
                        # Print first few rows
                        for row_idx, row in enumerate(table[:3]):
                            print(f"  Row {row_idx + 1}: {row}")
                        
                        if len(table) > 3:
                            print(f"  ... and {len(table) - 3} more rows")
                else:
                    print("No tables found")
                    
            except Exception as e:
                print(f"Error: {e}")
            
            print(f"\n--- End Test {i} ---")
