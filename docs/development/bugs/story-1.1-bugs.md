# Story 1.1 Bugs and Issues Tracking

## Critical Bugs (Must Fix)

### Bug #1: JavaScript-Required Sites Not Handled
**Status**: Critical  
**File**: `apps/server/chalicelib/web_extractor.py`  
**Source**: WebFetch analysis of https://tablebuilder.singstat.gov.sg/table/TS/M550241  
**Issue**: Page returns "You need to enable JavaScript to run this app" - current implementation doesn't wait for JS rendering  
**Impact**: Cannot scrape Singapore statistics table (primary test case)  
**Fix Required**:
```python
def _wait_for_content(self, timeout=30):
    """Wait for JavaScript content to load"""
    wait = WebDriverWait(self.driver, timeout)
    wait.until(lambda driver: driver.execute_script("return document.readyState") == "complete")
    # Additional wait for dynamic tables
    time.sleep(5)
```

### Bug #2: Anti-Bot Protection Not Handled  
**Status**: Critical  
**Source**: WebFetch analysis of https://www.macrotrends.net/ (403 error)  
**Issue**: Sites with anti-bot protection return 403 errors  
**Impact**: Cannot access Macrotrends tourism data  
**Fix Required**: Implement stealth mode and user agent rotation

### Bug #3: Invalid XPath Syntax
**Status**: Critical  
**File**: `apps/server/chalicelib/web_extractor.py:221`  
**Issue**: `xpath = f"//table[@data-*[contains(., '{table_identifier}')]]"` is invalid XPath  
**Fix Required**:
```python
xpath = f"//table[@data-testid='{table_identifier}' or @data-table='{table_identifier}']" 
```

## Medium Priority Bugs

### Bug #4: No Real Test Data
**Status**: Medium  
**Files**: All test files in `apps/server/tests/`  
**Issue**: Tests use dummy data like `['Name', 'Age', 'City']` instead of realistic web table data  
**Source**: Manual inspection of test files  
**Fix Required**: Create realistic test fixtures based on actual scraped data

### Bug #5: WebDriver Resource Leaks
**Status**: Medium  
**File**: `apps/server/chalicelib/web_extractor.py`  
**Issue**: If `_setup_driver()` fails, cleanup may not be called  
**Impact**: Resource leaks in AWS Lambda  
**Fix Required**: Implement proper cleanup in exception handlers

### Bug #6: Missing AWS Configuration
**Status**: Medium  
**Files**: `apps/server/.chalice/config.json`, environment setup  
**Issue**: No clear guidance for AWS setup without credentials  
**Impact**: Cannot test AWS integration locally  
**Fix Required**: LocalStack integration and better documentation

## Working URLs Analysis

### ✅ Wikipedia (Working)
**URL**: https://en.wikipedia.org/wiki/Economy_of_China  
**Table**: GDP by administrative division  
**Source**: WebFetch analysis successful  
**Data Sample**:
- Guangdong: CN¥ 13,911.86, US$ 2,119.67, 10.67%
- Jiangsu: CN¥ 12,287.56, US$ 1,826.85, 10.15%
- Shandong: CN¥ 8,743.51, US$ 1,299.94, 7.22%

**CSS Selectors**:
- `table.static-row-numbers.wikitable`
- `table tr td:nth-child(1)` (provinces)
- `table tr td:nth-child(2)` (CN¥ values)

### ❌ Singapore Statistics (JavaScript Required)
**URL**: https://tablebuilder.singstat.gov.sg/table/TS/M550241  
**Issue**: Returns "You need to enable JavaScript to run this app"  
**Source**: WebFetch analysis  
**Fix Required**: JavaScript rendering support

### ❌ Macrotrends (403 Blocked)
**URL**: https://www.macrotrends.net/global-metrics/countries/mys/malaysia/tourism-statistics  
**Issue**: 403 status code (anti-bot protection)  
**Source**: WebFetch analysis  
**Fix Required**: Stealth mode implementation

### ❓ DBS XML (Not Tested)
**URL**: https://www.dbs.com.hk/treasures/aics/stock-coverage/templatedata/article/equity/data/en/DBSV/012014/9988_HK.xml  
**Status**: Need to test XML parsing capability  
**Expected**: Key Statistics table in XML format

## MCP Browser Tools Investigation

**Status**: Browser tools require npm/playwright setup  
**Error**: "Chromium distribution 'chrome' is not found"  
**Alternative Suggestion**: Research **FireCrawl** or **Firecrawl** as mentioned in user request  
**Action**: Investigate if FireCrawl MCP tool available for better scraping

## Fix Priority Order

1. **Immediate (Today)**:
   - Fix XPath syntax error
   - Implement JavaScript waiting for Singapore stats
   - Create realistic test data from Wikipedia table

2. **This Week**:
   - Add stealth mode for anti-bot protection
   - Implement proper WebDriver cleanup
   - Create comprehensive test suite with real data

3. **Next Week**:
   - AWS LocalStack integration
   - Performance testing with large tables
   - Documentation improvements

## Test Cases to Implement

Based on working Wikipedia URL:
```python
def test_wikipedia_gdp_table():
    """Test real Wikipedia GDP table extraction"""
    url = "https://en.wikipedia.org/wiki/Economy_of_China"
    table_id = "GDP by administrative division"
    
    extractor = WebExtractor()
    result = extractor.extract_table(url, table_id)
    
    # Verify real data
    assert "Guangdong" in result[1][0]  # First province
    assert "13,911" in result[1][1]     # GDP value
    assert len(result) > 10             # Multiple provinces
```

## Status Summary

- **Critical Bugs**: 3 (JavaScript, Anti-bot, XPath)
- **Medium Bugs**: 3 (Test data, Resource leaks, AWS config)  
- **Working URLs**: 1/4 (25% success rate)
- **Immediate Actions**: Fix XPath, add JS support, create real tests