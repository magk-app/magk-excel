# Web Extraction Component Bugs - MAGK Excel

**Component**: Web Extraction | **Owner**: Backend Team | **Last Updated**: 2025-07-30

## Critical Issues

### BUG-001: XPath Syntax Error
**Status**: Open | **Severity**: Critical | **Priority**: P0

**Summary**: Invalid XPath syntax causes 100% failure rate for data attribute table detection
**File**: `/apps/server/chalicelib/web_extractor.py:302`
**Impact**: Complete failure of web extraction for tables with data attributes

**Quick Fix**: Replace `@data-*` with proper XPath syntax
```python
# Current (broken)
xpath = f"//table[@data-*[contains(., '{table_identifier}')]]"

# Fixed
xpath = f"//table[@*[starts-with(name(), 'data-') and contains(., '{table_identifier}')]]"
```

### BUG-002: WebDriver Resource Leak  
**Status**: Open | **Severity**: Critical | **Priority**: P0

**Summary**: WebDriver instances leak when initialization fails after Chrome creation
**File**: `/apps/server/chalicelib/web_extractor.py:187-195`
**Impact**: Memory exhaustion in Lambda containers

**Root Cause**: Exception during `set_page_load_timeout()` leaves Chrome process running

### BUG-003: Race Condition in Table Detection
**Status**: Open | **Severity**: Critical | **Priority**: P0

**Summary**: Sequential strategy timeouts miss dynamically loaded tables
**File**: `/apps/server/chalicelib/web_extractor.py:256-315`
**Impact**: False negatives for AJAX-loaded content

## High Priority Issues

### BUG-004: Generic Error Messages
**Status**: Open | **Severity**: High | **Priority**: P1

**Summary**: Error messages lack debugging context (URL, page title, available elements)
**Files**: Multiple locations in web_extractor.py
**Impact**: Difficult troubleshooting and support

**Enhancement**: Add debug context to all error messages:
```python
def _create_debug_context(self, url=None, table_identifier=None):
    context = {
        'current_url': self.driver.current_url if self.driver else 'N/A',
        'page_title': self.driver.title if self.driver else 'N/A',
        'tables_found': len(self.driver.find_elements(By.TAG_NAME, "table")) if self.driver else 0,
        'requested_url': url,
        'table_identifier': table_identifier
    }
    return context
```

### BUG-005: Strategy Selection Logic Gaps
**Status**: Open | **Severity**: High | **Priority**: P2

**Summary**: StrategyFactory doesn't handle edge cases or provide fallback mechanisms
**File**: `/apps/server/chalicelib/extraction_strategies.py:254-277`
**Impact**: Suboptimal strategy selection for complex sites

**Analysis**:
- No fallback when primary strategy fails
- URL pattern matching is too simplistic
- No dynamic strategy switching based on page content

**Proposed Enhancement**:
```python
@staticmethod
def get_strategy_with_fallback(url: str, data_identifier: str = None) -> List[ExtractionStrategy]:
    """Return ordered list of strategies to try."""
    strategies = []
    
    # Primary strategy based on URL
    primary = StrategyFactory.get_strategy(url, data_identifier)
    strategies.append(primary)
    
    # Add fallback strategies
    if not isinstance(primary, DynamicTableStrategy):
        strategies.append(DynamicTableStrategy())
    
    if not isinstance(primary, ProtectedSiteStrategy):
        strategies.append(ProtectedSiteStrategy())
    
    return strategies
```

## Medium Priority Issues

### BUG-300: Inefficient Element Finding
**Status**: Open | **Severity**: Medium | **Priority**: P3

**Summary**: Multiple WebDriverWait instances created unnecessarily
**File**: `/apps/server/chalicelib/web_extractor.py:253-315`
**Impact**: Performance degradation

**Optimization**: Reuse WebDriverWait instance across strategies

### BUG-301: Limited CSS Selector Support
**Status**: Open | **Severity**: Medium | **Priority**: P3

**Summary**: CSS selector detection logic is overly simplistic
**File**: `/apps/server/chalicelib/web_extractor.py:274-284`
**Impact**: Misses valid CSS selectors

**Current Logic**:
```python
if (table_identifier.startswith('.') or
    table_identifier.startswith('#') or
    ' ' in table_identifier):
```

**Enhancement**: Use regex for better CSS selector detection

### BUG-302: Table Parsing Inefficiency
**Status**: Open | **Severity**: Medium | **Priority**: P3

**Summary**: Redundant DOM queries in table parsing
**File**: `/apps/server/chalicelib/web_extractor.py:317-362`
**Impact**: Slower extraction for large tables

**Issue**: Multiple calls to `find_elements()` for same element types
**Fix**: Cache element queries and optimize DOM traversal

## Low Priority Issues

### BUG-400: Missing User-Agent Rotation
**Status**: Open | **Severity**: Low | **Priority**: P4

**Summary**: Static user agent may be blocked by anti-bot systems
**File**: `/apps/server/chalicelib/web_extractor.py:143`
**Impact**: Higher block rate on protected sites

### BUG-401: No Request Headers Customization
**Status**: Open | **Severity**: Low | **Priority**: P4

**Summary**: Cannot customize HTTP headers for specific sites
**Impact**: Limited compatibility with sites requiring specific headers

### BUG-402: Timeout Configuration Not Site-Specific
**Status**: Open | **Severity**: Low | **Priority**: P4

**Summary**: Single timeout value used for all sites
**Impact**: Inefficiency (too long for fast sites, too short for slow sites)

## Component Architecture Issues

### Current Architecture Problems
1. **Tight Coupling**: WebExtractor directly instantiates strategies
2. **Limited Extensibility**: Hard to add new extraction methods
3. **No Caching**: Repeated requests to same URL
4. **Single Responsibility Violation**: WebExtractor handles setup, extraction, and cleanup

### Recommended Refactoring
```python
class WebExtractionService:
    """Orchestrates web extraction with proper separation of concerns."""
    
    def __init__(self):
        self.driver_manager = WebDriverManager()
        self.strategy_selector = StrategySelector()
        self.result_processor = ExtractionResultProcessor()
    
    def extract(self, request: ExtractionRequest) -> ExtractionResult:
        driver = self.driver_manager.get_driver()
        try:
            strategies = self.strategy_selector.select_strategies(request)
            raw_result = self._try_strategies(driver, strategies, request)
            return self.result_processor.process(raw_result)
        finally:
            self.driver_manager.release_driver(driver)
```

## Testing Strategy

### Critical Bug Testing
- [ ] **BUG-001**: XPath syntax unit tests with mock elements
- [ ] **BUG-002**: Resource leak integration tests  
- [ ] **BUG-003**: Race condition timing tests

### Regression Testing
- [ ] All extraction strategies with real websites
- [ ] Error handling paths with network issues
- [ ] Memory usage profiling with large tables
- [ ] Performance benchmarks for common sites

### Integration Testing Needs
```python
@pytest.mark.integration
class TestWebExtractionIntegration:
    def test_wikipedia_extraction(self):
        """Test with known stable Wikipedia page."""
        pass
    
    def test_dynamic_content_extraction(self):
        """Test with JavaScript-heavy site."""
        pass
    
    def test_protected_site_handling(self):
        """Test anti-bot protection handling."""
        pass
```

## Performance Metrics

### Current Performance (Estimated)
- **Simple table extraction**: 5-10 seconds
- **Complex JavaScript site**: 15-30 seconds  
- **Large tables (>1000 rows)**: 30-60 seconds
- **Memory usage**: 200-400MB peak

### Performance Targets
- **Simple extraction**: <5 seconds
- **Complex sites**: <15 seconds
- **Large tables**: <30 seconds with streaming
- **Memory usage**: <300MB peak, proper cleanup

## Monitoring Requirements

### Key Metrics to Track
1. **Extraction Success Rate**: Overall success percentage
2. **Strategy Effectiveness**: Success rate by strategy type
3. **Performance Distribution**: P50, P90, P99 extraction times
4. **Error Pattern Analysis**: Most common failure types
5. **Memory Usage Trends**: Peak and average memory consumption

### Alerting Thresholds
- **Critical**: Success rate < 85% over 10 minutes
- **Warning**: P90 extraction time > 45 seconds  
- **Info**: Memory usage > 400MB consistently

## Resolution Timeline

### Week 1 (Critical Fixes)
- Fix XPath syntax error (BUG-001)
- Implement proper resource cleanup (BUG-002)
- Address race condition (BUG-003)

### Week 2 (Error Handling)
- Add debug context to errors (BUG-004)
- Improve strategy selection (BUG-005)
- Create integration test framework

### Week 3 (Performance)
- Optimize element finding (BUG-300)
- Enhance CSS selector support (BUG-301)
- Improve table parsing efficiency (BUG-302)

### Week 4 (Enhancement)
- Architecture refactoring
- Comprehensive testing
- Performance optimization
- Monitoring implementation