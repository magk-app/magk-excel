## 1.3 Acceptance Criteria

1. The module can create a new Excel workbook.
2. The module can write a list of lists to a sheet. **In particular, the tables extracted from 1.1 and 1.2, from HTML-tables and PDFs, respectively**
3. The module can save in both .xlsx and .xls formats. 
4. (Nice to have) The module can update an Excel file in real-time.

## 2.4 Acceptance Criteria

1. A small AI model analyzes the workflow context.
2. Based on the context, it selects appropriate pre-built UI controls. **For example, a tool designed on extracting Alibaba's annual report data could be extended to other companies with a 'select annual report' feature, or a tool getting daily data from HK border crossing could have a date range selector.**
3. The selected controls are included in the final packaged UI.

## 3.5 Acceptance Criteria

1. Programs are able to standardize differing report data formats when the user desires this functionality.
2. **Ensure that** The same metrics (e.g., total assets, net cash from investing, operating profit) are consistently accessible and in the same place across different company reports **when we export them to Excel documents.**
3. The system can map varying terminology (e.g., "Operating profit" vs "EBIT", "Cost of goods sold" vs "Cost of sales") to standardized field names. **Additionally, it can recognize that for some companies, data may not be disclosed at all. eg. some companies may not have 'inventories'.**
4. Users can configure and customize standardization mappings for their specific analysis needs.

## Development Setup Requirements

### Chrome and ChromeDriver Setup

**TODO: Update developer setup documentation to include:**

1. **Chrome Browser Installation**: Local developers must install Google Chrome browser for web scraping functionality.
2. **ChromeDriver Installation**: Install ChromeDriver that matches the developer's operating system and Chrome browser version for automated browser control.
3. **Environment Configuration**: Set up environment variable paths in the `.env` file to point to Chrome and ChromeDriver installations.
4. **Documentation Updates**: Update the getting-started guide and setup documentation to reflect these new requirements.

**Impact**: This setup is required for development and testing of web extraction features that rely on browser automation.