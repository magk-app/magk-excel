"""
Lambda-compatible Web Extractor using Requests and BeautifulSoup
A simplified version for AWS Lambda deployment
"""

import logging
import os
import time
import re
from typing import List, Dict, Any, Optional, Union
from functools import wraps
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

logger = logging.getLogger(__name__)


class WebExtractionError(Exception):
    """Base exception for web extraction errors."""
    pass


class SecurityError(WebExtractionError):
    """Exception raised for security-related issues."""
    pass


class TimeoutError(WebExtractionError):
    """Exception raised for timeout-related issues."""
    pass


class ElementNotFoundError(WebExtractionError):
    """Exception raised when required elements cannot be found."""
    pass


def retry_with_backoff(max_retries: int = 3, base_delay: float = 1.0):
    """Decorator to retry operations with exponential backoff."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    if attempt < max_retries - 1:
                        delay = base_delay * (2 ** attempt)
                        logger.warning(f"Attempt {attempt + 1} failed: {e}. Retrying in {delay}s...")
                        time.sleep(delay)
                    else:
                        logger.error(f"All {max_retries} attempts failed. Last error: {e}")
            raise last_exception
        return wrapper
    return decorator


def sanitize_data(data: Union[str, List, Dict]) -> Union[str, List, Dict]:
    """Sanitize extracted data to prevent XSS and formula injection."""
    if isinstance(data, str):
        # Remove potential XSS vectors
        data = re.sub(r'<script[^>]*>.*?</script>', '', data, flags=re.IGNORECASE | re.DOTALL)
        data = re.sub(r'javascript:', '', data, flags=re.IGNORECASE)
        data = re.sub(r'on\w+\s*=', '', data, flags=re.IGNORECASE)
        
        # Prevent formula injection in Excel
        if data.startswith(('=', '+', '-', '@')):
            data = "'" + data  # Prefix with single quote to make it text
        
        return data.strip()
    
    elif isinstance(data, list):
        return [sanitize_data(item) for item in data]
    
    elif isinstance(data, dict):
        return {key: sanitize_data(value) for key, value in data.items()}
    
    return data


class LambdaWebExtractor:
    """Lambda-compatible web extractor using requests and BeautifulSoup."""
    
    def __init__(self, timeout: int = 30, max_retries: int = 3):
        """
        Initialize the Lambda web extractor.
        
        Args:
            timeout: Request timeout in seconds
            max_retries: Maximum number of retry attempts
        """
        self.timeout = timeout
        self.max_retries = max_retries
        self.session = requests.Session()
        
        # Set up session headers to mimic a real browser
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
    
    def extract_table(self, url: str, table_identifier: str = None) -> List[List[str]]:
        """
        Extract table data from a webpage.
        
        Args:
            url: The URL to scrape
            table_identifier: CSS selector or table index to identify specific table
            
        Returns:
            List of rows, where each row is a list of cell values
        """
        try:
            logger.info(f"Extracting table from: {url}")
            
            # Fetch the page content
            response = self._fetch_url(url)
            if not response:
                raise WebExtractionError(f"Failed to fetch URL: {url}")
            
            # Parse the HTML
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find the target table
            table_element = self._find_table_element(soup, table_identifier)
            if not table_element:
                raise ElementNotFoundError(f"Table not found with identifier: {table_identifier}")
            
            # Extract table data
            table_data = self._parse_table_element(table_element)
            
            # Sanitize the data
            table_data = sanitize_data(table_data)
            
            logger.info(f"Successfully extracted table with {len(table_data)} rows")
            return table_data
            
        except Exception as e:
            logger.error(f"Error extracting table from {url}: {e}")
            raise WebExtractionError(f"Failed to extract table: {e}")
    
    def extract_data_advanced(self, url: str, table_identifier: str = None) -> Dict[str, Any]:
        """
        Extract advanced data including metadata from a webpage.
        
        Args:
            url: The URL to scrape
            table_identifier: CSS selector or table index to identify specific table
            
        Returns:
            Dictionary containing table data and metadata
        """
        try:
            logger.info(f"Extracting advanced data from: {url}")
            
            # Fetch the page content
            response = self._fetch_url(url)
            if not response:
                raise WebExtractionError(f"Failed to fetch URL: {url}")
            
            # Parse the HTML
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract metadata
            metadata = {
                'url': url,
                'title': soup.title.string if soup.title else '',
                'status_code': response.status_code,
                'content_type': response.headers.get('content-type', ''),
                'extraction_timestamp': time.time()
            }
            
            # Find and extract table data
            table_element = self._find_table_element(soup, table_identifier)
            if table_element:
                table_data = self._parse_table_element(table_element)
                table_data = sanitize_data(table_data)
            else:
                table_data = []
                logger.warning(f"Table not found with identifier: {table_identifier}")
            
            result = {
                'metadata': metadata,
                'table_data': table_data,
                'success': True
            }
            
            logger.info(f"Successfully extracted advanced data with {len(table_data)} rows")
            return result
            
        except Exception as e:
            logger.error(f"Error extracting advanced data from {url}: {e}")
            return {
                'metadata': {'url': url, 'error': str(e)},
                'table_data': [],
                'success': False
            }
    
    @retry_with_backoff(max_retries=3, base_delay=1.0)
    def _fetch_url(self, url: str) -> Optional[requests.Response]:
        """Fetch URL content with retry logic."""
        try:
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()
            return response
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch {url}: {e}")
            raise
    
    def _find_table_element(self, soup: BeautifulSoup, table_identifier: str = None):
        """Find the target table element."""
        if not table_identifier:
            # Return the first table found
            return soup.find('table')
        
        # Try CSS selector first
        if table_identifier.startswith('.') or table_identifier.startswith('#'):
            table = soup.select_one(table_identifier)
            if table:
                return table
        
        # Try by table index
        try:
            index = int(table_identifier)
            tables = soup.find_all('table')
            if 0 <= index < len(tables):
                return tables[index]
        except ValueError:
            pass
        
        # Try by table attributes
        table = soup.find('table', {'id': table_identifier})
        if table:
            return table
        
        table = soup.find('table', {'class': table_identifier})
        if table:
            return table
        
        # Try by table caption or summary
        table = soup.find('table', {'summary': table_identifier})
        if table:
            return table
        
        # Try by caption text
        caption = soup.find('caption', string=re.compile(table_identifier, re.IGNORECASE))
        if caption and caption.find_parent('table'):
            return caption.find_parent('table')
        
        return None
    
    def _parse_table_element(self, table_element) -> List[List[str]]:
        """Parse table element and extract data."""
        rows = []
        
        # Find all rows (tr elements)
        table_rows = table_element.find_all('tr')
        
        for row in table_rows:
            # Find all cells in the row (td and th elements)
            cells = row.find_all(['td', 'th'])
            
            if cells:
                # Extract text from each cell and clean it
                row_data = []
                for cell in cells:
                    # Get text content and clean it
                    cell_text = cell.get_text(strip=True)
                    # Remove extra whitespace and newlines
                    cell_text = ' '.join(cell_text.split())
                    row_data.append(cell_text)
                
                # Only add rows that have content
                if any(cell for cell in row_data):
                    rows.append(row_data)
        
        return rows
    
    def close(self):
        """Close the session."""
        if self.session:
            self.session.close()
            logger.info("Session closed")


def extract_web_table(url: str, table_identifier: str = None) -> List[List[str]]:
    """
    Convenience function to extract table data from a URL.
    
    Args:
        url: The URL to scrape
        table_identifier: CSS selector or table index to identify specific table
        
    Returns:
        List of rows, where each row is a list of cell values
    """
    extractor = LambdaWebExtractor()
    try:
        return extractor.extract_table(url, table_identifier)
    finally:
        extractor.close()


def extract_web_data_advanced(url: str, table_identifier: str = None) -> Dict[str, Any]:
    """
    Convenience function to extract advanced data from a URL.
    
    Args:
        url: The URL to scrape
        table_identifier: CSS selector or table index to identify specific table
        
    Returns:
        Dictionary containing table data and metadata
    """
    extractor = LambdaWebExtractor()
    try:
        return extractor.extract_data_advanced(url, table_identifier)
    finally:
        extractor.close() 