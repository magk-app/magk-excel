import logging
import os
import time
import re
import atexit
from typing import List, Dict, Any, Optional, Union
from functools import wraps
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    TimeoutException, WebDriverException, NoSuchElementException,
    StaleElementReferenceException
)
from selenium.webdriver.chrome.service import Service
from .extraction_strategies import StrategyFactory

from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

logger = logging.getLogger(__name__)

# Global registry for WebDriver cleanup
_active_drivers = set()


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


def cleanup_all_drivers():
    """Emergency cleanup function for all active drivers."""
    global _active_drivers
    logger.info(f"Emergency cleanup: closing {len(_active_drivers)} active drivers")
    for driver in list(_active_drivers):
        try:
            driver.quit()
        except Exception as e:
            logger.error(f"Error during emergency cleanup: {e}")
    _active_drivers.clear()


# Register emergency cleanup
atexit.register(cleanup_all_drivers)


def retry_with_backoff(max_retries: int = 3, base_delay: float = 1.0):
    """Decorator to retry operations with exponential backoff."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except (TimeoutException, WebDriverException, StaleElementReferenceException) as e:
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
        return {k: sanitize_data(v) for k, v in data.items()}
    else:
        return data


class WebExtractor:
    """Handles web data extraction using Selenium."""

    def __init__(self, headless: bool = True, timeout: int = 30, max_retries: int = 3):
        """
        Initialize the WebExtractor.

        Args:
            headless: Run browser in headless mode (required for Lambda)
            timeout: Default timeout for page operations in seconds
            max_retries: Maximum number of retry attempts for failed operations
        """
        self.headless = headless
        self.timeout = timeout
        self.max_retries = max_retries
        self.driver = None
        self._unified_wait = None

    def extract_table(self, url: str, table_identifier: str = None
                      ) -> List[List[str]]:
        """
        Extract table data from a web page using appropriate strategy.

        Args:
            url: The URL to navigate to
            table_identifier: String to identify the table
                (ID, class, or text to find) - optional for some strategies

        Returns:
            List of lists containing table data (rows and columns)

        Raises:
            WebDriverException: If there's an issue with the web driver
            TimeoutException: If the page or table takes too long to load
            ValueError: If the table cannot be found
        """
        try:
            logger.info(f"Starting extraction from URL: {url}")
            self._setup_driver()

            # Get appropriate extraction strategy
            strategy = StrategyFactory.get_strategy(url, table_identifier)
            logger.info(f"Using strategy: {strategy.__class__.__name__}")

            # Extract data using strategy
            result = strategy.extract(self.driver, url)

            if result is None:
                raise WebExtractionError("No data extracted from the page")
            
            if result.get("type") == "error":
                raise WebExtractionError(f"Extraction error: {result.get('message', 'Unknown error')}")

            # Convert result to legacy format for backward compatibility
            if "data" in result:
                table_data = result["data"]
                if "headers" in result and result["headers"]:
                    # Prepend headers if they exist and sanitize all data
                    sanitized_headers = sanitize_data(result["headers"])
                    sanitized_data = sanitize_data(table_data)
                    table_data = [sanitized_headers] + sanitized_data
                else:
                    table_data = sanitize_data(table_data)
                logger.info(f"Successfully extracted {len(table_data)} rows from {url}")
                return table_data
            else:
                raise WebExtractionError("Invalid data format returned from strategy")

        except TimeoutException as e:
            logger.error(f"Timeout during extraction: {str(e)}")
            raise TimeoutError(f"Extraction timed out: {str(e)}")
        except WebDriverException as e:
            logger.error(f"WebDriver error during extraction: {str(e)}")
            raise WebExtractionError(f"WebDriver error: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error during extraction: {str(e)}")
            raise WebExtractionError(f"Extraction failed: {str(e)}")
        finally:
            self._cleanup()

    def extract_data_advanced(self, url: str, table_identifier: str = None
                            ) -> Dict[str, Any]:
        """
        Extract data from a web page with detailed metadata.

        Args:
            url: The URL to navigate to
            table_identifier: String to identify the table/data

        Returns:
            Dictionary containing extracted data and metadata

        Raises:
            WebDriverException: If there's an issue with the web driver
            TimeoutException: If the page or table takes too long to load
            ValueError: If the data cannot be found
        """
        try:
            logger.info(f"Starting advanced extraction from URL: {url}")
            self._setup_driver()

            # Get appropriate extraction strategy
            strategy = StrategyFactory.get_strategy(url, table_identifier)
            logger.info(f"Using strategy: {strategy.__class__.__name__}")

            # Extract data using strategy
            result = strategy.extract(self.driver, url)

            if result is None:
                raise WebExtractionError("No data extracted from the page")

            # Sanitize the result data for security
            sanitized_result = sanitize_data(result)
            logger.info(f"Successfully extracted data of type: {sanitized_result.get('type', 'unknown')}")
            return sanitized_result

        except TimeoutException as e:
            logger.error(f"Timeout during advanced extraction: {str(e)}")
            raise TimeoutError(f"Advanced extraction timed out: {str(e)}")
        except WebDriverException as e:
            logger.error(f"WebDriver error during advanced extraction: {str(e)}")
            raise WebExtractionError(f"WebDriver error: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error during advanced extraction: {str(e)}")
            raise WebExtractionError(f"Advanced extraction failed: {str(e)}")
        finally:
            self._cleanup()

    @retry_with_backoff(max_retries=2, base_delay=1.0)
    def _setup_driver(self):
        """Set up Selenium WebDriver with appropriate options."""
        global _active_drivers
        try:
            options = webdriver.ChromeOptions()

            if self.headless:
                options.add_argument('--headless')

            # Lambda-compatible options
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            options.add_argument('--disable-gpu')
            options.add_argument('--disable-web-security')
            options.add_argument('--single-process')
            options.add_argument('--disable-dev-tools')
            options.add_argument('--no-zygote')
            options.add_argument('--window-size=1920,1080')
            
            # Add user agent for better compatibility
            options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

            # Lambda-specific binary paths
            chrome_binary_path = os.environ.get(
                'CHROME_BINARY_PATH', '/opt/chrome/chrome')
            chromedriver_path = os.environ.get(
                'CHROMEDRIVER_PATH', '/opt/chromedriver')

            # Check for Lambda environment first
            if os.path.exists(chrome_binary_path):
                options.binary_location = chrome_binary_path
                logger.info(
                    f"Using Lambda Chrome binary: {chrome_binary_path}")
            else:
                # Local development: try to find Chrome/Chromium
                local_chrome_paths = [
                    # Windows
                    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
                    # Linux
                    '/usr/bin/google-chrome',
                    '/usr/bin/chromium-browser',
                    '/usr/bin/chromium',
                    # macOS
                    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                ]
                
                for path in local_chrome_paths:
                    if os.path.exists(path):
                        options.binary_location = path
                        logger.info(f"Using local Chrome binary: {path}")
                        break

            # Set up ChromeDriver service
            service = None
            if os.path.exists(chromedriver_path):
                service = Service(chromedriver_path)
                logger.info(
                    f"Using Lambda ChromeDriver: {chromedriver_path}")
            else:
                # For local development, let Selenium find chromedriver in PATH
                logger.info("Using ChromeDriver from system PATH")

            # Initialize driver
            self.driver = webdriver.Chrome(service=service, options=options)
            self.driver.set_page_load_timeout(self.timeout)
            
            # Register driver for cleanup and create unified wait
            _active_drivers.add(self.driver)
            self._unified_wait = WebDriverWait(self.driver, self.timeout)

            logger.info("WebDriver initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize WebDriver: {str(e)}")
            if self.driver:
                try:
                    self.driver.quit()
                except:
                    pass
                self.driver = None
            raise WebExtractionError(f"Failed to initialize WebDriver: {str(e)}")

    @retry_with_backoff(max_retries=2, base_delay=1.0)
    def _navigate_to_url(self, url: str):
        """Navigate to the specified URL with error handling."""
        try:
            if not self.driver:
                raise WebExtractionError("WebDriver not initialized")
            logger.info(f"Navigating to URL: {url}")
            self.driver.get(url)

            # Wait for page to be ready using unified wait
            self._unified_wait.until(
                lambda driver: (
                    driver.execute_script("return document.readyState")
                    == "complete"
                )
            )

            logger.info("Page loaded successfully")

        except TimeoutException as e:
            logger.error(f"Timeout while loading page: {url}")
            raise TimeoutError(
                f"Page load timeout after {self.timeout} seconds for URL: {url}")
        except WebDriverException as e:
            logger.error(f"WebDriver error during navigation: {str(e)}")
            raise WebExtractionError(f"Failed to navigate to URL: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error during navigation: {str(e)}")
            raise WebExtractionError(f"Navigation failed: {str(e)}")

    def _extract_table_data(self, table_identifier: str) -> List[List[str]]:
        """Extract data from the identified table with retry logic."""
        try:
            logger.info(
                f"Looking for table with identifier: {table_identifier}")

            # Find table element using various strategies (includes retry logic)
            table_element = self._find_table_element(table_identifier)

            # Extract table data
            table_data = self._parse_table_element(table_element)

            logger.info(
                f"Successfully parsed table with {len(table_data)} rows")
            return table_data

        except ElementNotFoundError:
            logger.error(f"Table with identifier '{table_identifier}' not found")
            raise
        except Exception as e:
            logger.error(f"Error extracting table data: {str(e)}")
            raise WebExtractionError(f"Failed to extract table data: {str(e)}")

    @retry_with_backoff(max_retries=2, base_delay=1.0)
    def _find_table_element(self, table_identifier: str):
        """Find table element using multiple strategies with unified timeout."""
        if not self._unified_wait:
            raise WebExtractionError("WebDriver not properly initialized")
        
        # Sanitize the identifier to prevent XSS
        table_identifier = sanitize_data(table_identifier)
        logger.info(f"Searching for table with sanitized identifier: {table_identifier}")

        # Strategy 1: Find by ID
        try:
            table = self._unified_wait.until(EC.presence_of_element_located(
                (By.ID, table_identifier)))
            logger.info(f"Found table by ID: {table_identifier}")
            return table
        except TimeoutException:
            pass

        # Strategy 2: Find by class name
        try:
            table = self._unified_wait.until(EC.presence_of_element_located(
                (By.CLASS_NAME, table_identifier)))
            logger.info(f"Found table by class: {table_identifier}")
            return table
        except TimeoutException:
            pass

        # Strategy 3: Find by CSS selector
        if (table_identifier.startswith('.') or
                table_identifier.startswith('#') or
                ' ' in table_identifier):
            try:
                table = self._unified_wait.until(EC.presence_of_element_located(
                    (By.CSS_SELECTOR, table_identifier)))
                logger.info(
                    f"Found table by CSS selector: {table_identifier}")
                return table
            except TimeoutException:
                pass

        # Strategy 4: Find by partial text in table or nearby elements
        try:
            # Look for text content that might identify the table
            # Escape special characters to prevent XPath injection
            escaped_identifier = table_identifier.replace("'", "\'").replace('"', '\"')
            xpath = f"//table[contains(text(), '{escaped_identifier}')]"
            table = self._unified_wait.until(
                EC.presence_of_element_located((By.XPATH, xpath))
            )
            logger.info(
                f"Found table by text content: {table_identifier}")
            return table
        except TimeoutException:
            pass

        # Strategy 5: Find by data attributes (fixed XPath syntax)
        try:
            # Use proper XPath syntax for data attributes
            escaped_identifier = table_identifier.replace("'", "\'").replace('"', '\"')
            xpath = f"//table[@*[contains(., '{escaped_identifier}')]]"
            table = self._unified_wait.until(
                EC.presence_of_element_located((By.XPATH, xpath))
            )
            logger.info(
                f"Found table by data attribute: {table_identifier}")
            return table
        except TimeoutException:
            pass

        logger.warning(
            f"Could not find table with identifier: {table_identifier}")
        raise ElementNotFoundError(f"Table with identifier '{table_identifier}' not found")

    def _parse_table_element(self, table_element) -> List[List[str]]:
        """Parse table element and extract data with security sanitization."""
        table_data = []

        try:
            # Look for tbody first, fallback to table
            tbody = table_element.find_elements(By.TAG_NAME, "tbody")
            if tbody:
                rows = tbody[0].find_elements(By.TAG_NAME, "tr")
            else:
                rows = table_element.find_elements(By.TAG_NAME, "tr")

            # Extract header row if exists
            thead = table_element.find_elements(By.TAG_NAME, "thead")
            if thead:
                header_rows = thead[0].find_elements(By.TAG_NAME, "tr")
                for row in header_rows:
                    cells = (
                        row.find_elements(By.TAG_NAME, "th") or
                        row.find_elements(By.TAG_NAME, "td")
                    )
                    row_data = [sanitize_data(cell.text.strip()) for cell in cells]
                    if row_data and any(row_data):  # Only add non-empty rows
                        table_data.append(row_data)

            # Extract data rows
            for row in rows:
                cells = (
                    row.find_elements(By.TAG_NAME, "td") or
                    row.find_elements(By.TAG_NAME, "th")
                )
                row_data = [sanitize_data(cell.text.strip()) for cell in cells]
                if row_data and any(row_data):  # Only add non-empty rows
                    table_data.append(row_data)

            # Remove completely empty rows
            table_data = [
                row for row in table_data
                if any(cell for cell in row)
            ]

            return table_data

        except StaleElementReferenceException as e:
            logger.error(f"Stale element reference during parsing: {str(e)}")
            raise WebExtractionError(f"Table element became stale: {str(e)}")
        except Exception as e:
            logger.error(f"Error parsing table element: {str(e)}")
            raise WebExtractionError(f"Failed to parse table data: {str(e)}")

    def _cleanup(self):
        """Clean up resources with proper error handling."""
        global _active_drivers
        if self.driver:
            try:
                # Remove from active drivers registry
                _active_drivers.discard(self.driver)
                self.driver.quit()
                logger.info("WebDriver closed successfully")
            except Exception as e:
                logger.error(f"Error closing WebDriver: {str(e)}")
            finally:
                self.driver = None
                self._unified_wait = None


def extract_web_table(url: str,
                      table_identifier: str) -> List[List[str]]:
    """
    Convenience function to extract table data from a web page.

    Args:
        url: The URL to navigate to
        table_identifier: String to identify the table

    Returns:
        List of lists containing table data
    """
    extractor = WebExtractor()
    return extractor.extract_table(url, table_identifier)
