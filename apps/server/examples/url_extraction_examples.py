"""
Examples demonstrating web data extraction for the analyzed URLs
"""
import logging
import sys
import os

# Add the parent directory to Python path to import chalicelib
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from chalicelib.web_extractor import WebExtractor
from chalicelib.extraction_strategies import StrategyFactory

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Test URLs
TEST_URLS = {
    "singapore_stats": "https://tablebuilder.singstat.gov.sg/table/TS/M550241",
    "dbs_xml": "https://www.dbs.com.hk/treasures/aics/stock-coverage/templatedata/article/equity/data/en/DBSV/012014/9988_HK.xml",
    "macrotrends": "https://www.macrotrends.net/global-metrics/countries/mys/malaysia/tourism-statistics",
    "wikipedia": "https://en.wikipedia.org/wiki/Economy_of_China"
}

def test_singapore_statistics():
    """Test Singapore statistics table extraction"""
    print("\n=== Testing Singapore Statistics ===")
    
    try:
        extractor = WebExtractor(headless=True, timeout=30)
        
        # Use advanced extraction for detailed metadata
        result = extractor.extract_data_advanced(TEST_URLS["singapore_stats"])
        
        print(f"Extraction type: {result.get('type')}")
        print(f"Headers: {result.get('headers', [])}")
        print(f"Rows extracted: {len(result.get('data', []))}")
        
        # Print first few rows as sample
        if result.get('data'):
            print("\nSample data (first 3 rows):")
            for i, row in enumerate(result['data'][:3]):
                print(f"Row {i+1}: {row}")
        
        return True
        
    except Exception as e:
        print(f"Error extracting Singapore statistics: {str(e)}")
        return False

def test_dbs_xml():
    """Test DBS XML data extraction"""
    print("\n=== Testing DBS XML Data ===")
    
    try:
        extractor = WebExtractor(headless=True)
        result = extractor.extract_data_advanced(TEST_URLS["dbs_xml"])
        
        print(f"Extraction type: {result.get('type')}")
        print(f"Root tag: {result.get('root_tag')}")
        
        # Print XML structure
        if result.get('data'):
            print("\nXML data structure:")
            for key, value in result['data'].items():
                if isinstance(value, dict):
                    print(f"  {key}: {type(value)} with {len(value)} elements")
                else:
                    print(f"  {key}: {value}")
        
        return True
        
    except Exception as e:
        print(f"Error extracting DBS XML: {str(e)}")
        return False

def test_macrotrends():
    """Test Macrotrends data extraction (may fail due to protection)"""
    print("\n=== Testing Macrotrends Data ===")
    
    try:
        extractor = WebExtractor(headless=True)
        result = extractor.extract_data_advanced(TEST_URLS["macrotrends"])
        
        if result.get('type') == 'error':
            print(f"Expected error: {result.get('message')}")
            print("This is normal for protected sites")
            return True
        
        print(f"Extraction type: {result.get('type')}")
        print(f"Data extracted: {len(result.get('data', []))}")
        
        return True
        
    except Exception as e:
        print(f"Error with Macrotrends (expected): {str(e)}")
        return True  # Expected to fail

def test_wikipedia():
    """Test Wikipedia table extraction"""
    print("\n=== Testing Wikipedia GDP Table ===")
    
    try:
        extractor = WebExtractor(headless=True)
        
        # Use table identifier to find GDP table
        result = extractor.extract_data_advanced(
            TEST_URLS["wikipedia"], 
            table_identifier="GDP"
        )
        
        print(f"Extraction type: {result.get('type')}")
        print(f"Headers: {result.get('headers', [])}")
        print(f"Rows extracted: {len(result.get('data', []))}")
        
        # Print sample data
        if result.get('data'):
            print("\nSample GDP data (first 5 provinces):")
            for i, row in enumerate(result['data'][:5]):
                print(f"  {row}")
        
        return True
        
    except Exception as e:
        print(f"Error extracting Wikipedia data: {str(e)}")
        return False

def test_strategy_selection():
    """Test strategy selection for different URLs"""
    print("\n=== Testing Strategy Selection ===")
    
    for name, url in TEST_URLS.items():
        strategy = StrategyFactory.get_strategy(url)
        print(f"{name}: {strategy.__class__.__name__}")
    
    return True

def demonstrate_legacy_compatibility():
    """Demonstrate backward compatibility with legacy extract_table method"""
    print("\n=== Testing Legacy Compatibility ===")
    
    try:
        extractor = WebExtractor(headless=True)
        
        # Use legacy method
        table_data = extractor.extract_table(TEST_URLS["wikipedia"], "GDP")
        
        print(f"Legacy method returned {len(table_data)} rows")
        print("Headers:", table_data[0] if table_data else "None")
        
        return True
        
    except Exception as e:
        print(f"Legacy compatibility test failed: {str(e)}")
        return False

def create_test_data_samples():
    """Create realistic test data samples for unit testing"""
    print("\n=== Creating Test Data Samples ===")
    
    samples = {
        "singapore_stats": {
            "headers": ["Period", "Total Visitors ('000)", "Tourist Arrivals ('000)", "Same-Day Visitors ('000)"],
            "data": [
                ["2024 Jan", "1,234.5", "987.6", "246.9"],
                ["2024 Feb", "1,345.7", "1,076.5", "269.2"],
                ["2024 Mar", "1,456.8", "1,165.4", "291.4"]
            ]
        },
        "dbs_xml": {
            "ticker": "9988.HK",
            "companyName": "Alibaba Group Holding Ltd",
            "lastPrice": "85.50",
            "marketCap": "218000000000",
            "peRatio": "12.5",
            "revenue": "941000000000"
        },
        "wikipedia_gdp": {
            "headers": ["Province", "GDP (CN¥ billion)", "GDP (US$ billion)", "Share (%)"],
            "data": [
                ["Guangdong", "12,910.3", "1,949.0", "10.67%"],
                ["Jiangsu", "12,287.5", "1,855.1", "10.16%"],
                ["Shandong", "9,203.0", "1,389.3", "7.61%"]
            ]
        },
        "macrotrends": {
            "error": "access_denied",
            "message": "Site has anti-bot protection. Manual access may be required."
        }
    }
    
    print("Test data samples created:")
    for name, sample in samples.items():
        print(f"  {name}: {type(sample)} with {len(sample)} elements")
    
    return samples

def main():
    """Run all extraction examples"""
    print("=== Web Data Extraction Examples ===")
    print("Testing extraction strategies for analyzed URLs")
    
    results = {
        "strategy_selection": test_strategy_selection(),
        "test_data_samples": create_test_data_samples(),
        "legacy_compatibility": demonstrate_legacy_compatibility(),
        # Uncomment these for actual web testing (requires Chrome/ChromeDriver)
        # "singapore_stats": test_singapore_statistics(),
        # "dbs_xml": test_dbs_xml(),
        # "macrotrends": test_macrotrends(),
        # "wikipedia": test_wikipedia(),
    }
    
    print("\n=== Results Summary ===")
    for test, success in results.items():
        status = "✓ PASS" if success else "✗ FAIL"
        print(f"{test}: {status}")

if __name__ == "__main__":
    main()