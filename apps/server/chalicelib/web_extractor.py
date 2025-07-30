"""
Web Data Extraction Module for MAGK Excel Backend

This module provides functionality to extract tabular data from web pages
using Selenium WebDriver for dynamic content handling.
"""

import logging
import re
import os
from typing import List, Optional, Any
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    TimeoutException, WebDriverException, NoSuchElementException
)

# Set up logging
logger = logging.getLogger(__name__)


class WebExtractor:
    """
    Web data extraction class using Selenium WebDriver.
    
    Handles dynamic web content extraction with proper error handling
    and CloudWatch logging integration.
    """
    
    def __init__(self, headless: bool = True, timeout: int = 30):
        """
        Initialize the WebExtractor with Chrome WebDriver.
        
        Args:
            headless: Run browser in headless mode (default: True)
            timeout: Page load timeout in seconds (default: 30)
        """
        self.timeout = timeout
        self.driver = None
        self._setup_driver(headless)
    
    def _setup_driver(self, headless: bool = True):
        """Set up the Chrome WebDriver with appropriate options."""
        try:
            # Configure Chrome options
            chrome_options = Options()
            if headless:
                chrome_options.add_argument('--headless')
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-gpu')
            chrome_options.add_argument('--window-size=1920,1080')
            
            # Use Lambda Chrome binary if available
            chrome_binary = os.environ.get('CHROME_BINARY_PATH')
            if chrome_binary:
                chrome_options.binary_location = chrome_binary
            
            # Initialize WebDriver
            self.driver = webdriver.Chrome(options=chrome_options)
            self.driver.set_page_load_timeout(self.timeout)
            
            logger.info("WebExtractor initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize WebExtractor: {str(e)}")
            raise
    
    def _navigate_to_url(self, url: str):
        """Navigate to the specified URL."""
        try:
            self.driver.get(url)
            # Wait for page to load
            WebDriverWait(self.driver, self.timeout).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
        except TimeoutException:
            raise TimeoutException(f"Page load timeout for URL: {url}")
        except Exception as e:
            raise WebDriverException(f"Failed to navigate to URL: {url} - {str(e)}")
    
    def _find_table_element(self, identifier: str) -> Optional[Any]:
        """Find table element using various selectors."""
        return self._find_table_by_identifier(identifier)
    
    def _cleanup(self):
        """Clean up resources."""
        if self.driver:
            try:
                self.driver.quit()
            except Exception as e:
                logger.warning(f"Error during driver cleanup: {str(e)}")
            finally:
                self.driver = None
    
    def extract_table_data(self, url: str, table_identifier: str) -> List[List[str]]:
        """
        Extract table data from a web page.
        
        Args:
            url: The URL of the web page containing the table
            table_identifier: String to identify the specific table
            
        Returns:
            List of lists representing table data (rows and columns)
            
        Raises:
            WebDriverException: If web driver fails
            TimeoutException: If page load times out
            ValueError: If table cannot be found or parsed
        """
        try:
            logger.info(f"Extracting table from URL: {url}")
            
            # Load the page
            self.driver.get(url)
            
            # Wait for page to load
            WebDriverWait(self.driver, self.timeout).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # Find the table using the identifier
            table_element = self._find_table_by_identifier(table_identifier)
            
            if not table_element:
                raise ValueError(f"Table with identifier '{table_identifier}' not found")
            
            # Extract table data
            table_data = self._parse_table_element(table_element)
            
            logger.info(f"Successfully extracted {len(table_data)} rows from table")
            return table_data
            
        except TimeoutException:
            logger.error(f"Page load timeout for URL: {url}")
            raise
        except WebDriverException as e:
            logger.error(f"WebDriver error for URL {url}: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error extracting table from {url}: {str(e)}")
            raise
    
    def _find_table_by_identifier(self, identifier: str) -> Optional[Any]:
        """
        Find table element using various identification strategies.
        
        Args:
            identifier: String to identify the table
            
        Returns:
            WebElement if found, None otherwise
        """
        try:
            # Strategy 1: Look for table with matching text in headers
            tables = self.driver.find_elements(By.TAG_NAME, "table")
            
            for table in tables:
                # Check table headers for the identifier
                headers = table.find_elements(By.TAG_NAME, "th")
                for header in headers:
                    if identifier.lower() in header.text.lower():
                        return table
                
                # Check table caption
                try:
                    caption = table.find_element(By.TAG_NAME, "caption")
                    if identifier.lower() in caption.text.lower():
                        return table
                except NoSuchElementException:
                    pass
                
                # Check for aria-label or title attributes
                aria_label = table.get_attribute("aria-label")
                title = table.get_attribute("title")
                
                if (aria_label and identifier.lower() in aria_label.lower()) or \
                   (title and identifier.lower() in title.lower()):
                    return table
            
            # Strategy 2: Look for div with table-like structure
            divs = self.driver.find_elements(By.CSS_SELECTOR, "div[class*='table'], div[class*='grid']")
            for div in divs:
                if identifier.lower() in div.text.lower():
                    return div
            
            # Strategy 3: Look for any element containing the identifier
            elements = self.driver.find_elements(By.XPATH, f"//*[contains(text(), '{identifier}')]")
            for element in elements:
                # Look for nearby table
                parent = element.find_element(By.XPATH, "./ancestor::table")
                if parent:
                    return parent
            
            return None
            
        except Exception as e:
            logger.error(f"Error finding table with identifier '{identifier}': {str(e)}")
            return None
    
    def _parse_table_element(self, table_element) -> List[List[str]]:
        """
        Parse table element and extract data as list of lists.
        
        Args:
            table_element: WebElement representing the table
            
        Returns:
            List of lists representing table data
        """
        try:
            table_data = []
            
            # Handle different table structures
            if table_element.tag_name == "table":
                # Standard HTML table
                rows = table_element.find_elements(By.TAG_NAME, "tr")
                
                for row in rows:
                    row_data = []
                    cells = row.find_elements(By.TAG_NAME, "td") + row.find_elements(By.TAG_NAME, "th")
                    
                    for cell in cells:
                        cell_text = cell.text.strip()
                        row_data.append(cell_text)
                    
                    if row_data:  # Only add non-empty rows
                        table_data.append(row_data)
            
            else:
                # Non-table element (div with grid-like structure)
                # This is a simplified approach - in production, you might need more sophisticated parsing
                text_content = table_element.text
                lines = text_content.split('\n')
                
                for line in lines:
                    if line.strip():
                        # Split by common delimiters
                        row_data = re.split(r'\s{2,}|\t|,', line.strip())
                        row_data = [cell.strip() for cell in row_data if cell.strip()]
                        if row_data:
                            table_data.append(row_data)
            
            return table_data
            
        except Exception as e:
            logger.error(f"Error parsing table element: {str(e)}")
            raise
    
    def close(self):
        """Close the WebDriver and clean up resources."""
        if self.driver:
            try:
                self.driver.quit()
                logger.info("WebDriver closed successfully")
            except Exception as e:
                logger.error(f"Error closing WebDriver: {str(e)}")
    
    def __enter__(self):
        """Context manager entry."""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.close()


def extract_web_table(url: str, table_identifier: str) -> List[List[str]]:
    """
    Convenience function to extract table data from a web page.
    
    Args:
        url: The URL of the web page containing the table
        table_identifier: String to identify the specific table
        
    Returns:
        List of lists representing table data
        
    Raises:
        ValueError: If table cannot be found or extracted
        WebDriverException: If web driver fails
    """
    extractor = None
    try:
        extractor = WebExtractor()
        return extractor.extract_table_data(url, table_identifier)
    finally:
        if extractor:
            extractor.close()