# MAGK Excel Services

A comprehensive Excel operation library designed to make Excel operations easy and intuitive for both developers and AI systems. This library provides specialized templates, helper functions, and AI-powered code generation capabilities.

## 📁 Library Structure

```
src/services/excel/
├── templates/              # Pre-built templates for common operations
│   ├── ReadExcelTemplate.ts       # Reading Excel files
│   ├── WriteExcelTemplate.ts      # Creating Excel files
│   ├── UpdateExcelTemplate.ts     # Updating existing files
│   ├── TransformExcelTemplate.ts  # Data transformation
│   ├── AnalysisExcelTemplate.ts   # Statistical analysis
│   └── PDFToExcelTemplate.ts      # PDF to Excel conversion
├── helpers/                # Utility functions and helpers
│   ├── ExcelHelpers.ts            # Common Excel utilities
│   ├── DataExtractor.ts           # Data extraction methods
│   ├── DataValidator.ts           # Data validation
│   └── FormatHelper.ts            # Formatting and styling
├── codeGen/                # AI-powered code generation
│   ├── ExcelCodeGenerator.ts      # Natural language to code
│   └── TemplateSelector.ts        # Template selection logic
└── index.ts                # Main export file
```

## 🚀 Quick Start

### Installation

```bash
npm install exceljs
```

### Basic Usage

```typescript
import { ExcelService } from './services/excel';

// Generate code from natural language
const result = ExcelService.generateCode('Create an Excel file with sales data');
console.log(result.code);

// Use templates directly
const writer = ExcelService.createWriter();
await writer.writeFromObjects('Sales', salesData, { headers: true });
await writer.saveToFile('sales_report.xlsx');

// Read and validate data
const reader = ExcelService.createReader();
await reader.loadFile('data.xlsx');
const data = await reader.readAsObjects(0);
```

## 📋 Templates Overview

### 1. ReadExcelTemplate
**Purpose**: Reading and extracting data from existing Excel files

**Key Features**:
- Auto-detect headers and data types
- Extract data as objects or arrays
- Handle multiple worksheets
- Support for different cell value types
- Comprehensive metadata extraction

**Example Usage**:
```typescript
import { ReadExcelTemplate } from './templates/ReadExcelTemplate';

const reader = new ReadExcelTemplate();
await reader.loadFile('data.xlsx');
const data = await reader.readAsObjects(0, {
  headers: true,
  skipEmptyRows: true
});
```

### 2. WriteExcelTemplate
**Purpose**: Creating new Excel files from scratch

**Key Features**:
- Write data from objects or arrays
- Professional formatting and styling
- Auto-fit columns
- Support for formulas and tables
- Multiple worksheet support

**Example Usage**:
```typescript
import { WriteExcelTemplate } from './templates/WriteExcelTemplate';

const writer = new WriteExcelTemplate();
await writer.writeFromObjects('Sales', salesData, {
  headers: true,
  autoFitColumns: true,
  headerStyle: { font: { bold: true } }
});
await writer.saveToFile('sales.xlsx');
```

### 3. UpdateExcelTemplate
**Purpose**: Updating and modifying existing Excel files

**Key Features**:
- Update individual cells or ranges
- Insert/delete rows and columns
- Append new data
- Preserve existing formatting
- Bulk update operations

**Example Usage**:
```typescript
import { UpdateExcelTemplate } from './templates/UpdateExcelTemplate';

const updater = new UpdateExcelTemplate();
await updater.loadFile('existing.xlsx');
updater.updateCell(0, 'A1', 'Updated Value');
updater.appendData(0, newRecords);
await updater.saveToFile('updated.xlsx');
```

### 4. TransformExcelTemplate
**Purpose**: Data transformation and processing operations

**Key Features**:
- Filter, sort, and group data
- Pivot table creation
- Data aggregation and calculations
- Column transformations
- Advanced data manipulation

**Example Usage**:
```typescript
import { TransformExcelTemplate } from './templates/TransformExcelTemplate';

const transformer = new TransformExcelTemplate();
await transformer.loadFile('source.xlsx');
const sourceData = await transformer.extractSourceData();

const filteredData = transformer.filterData(sourceData, [
  { field: 'Status', operator: 'equals', value: 'Active' }
]);

const groupedData = transformer.groupData(filteredData, ['Category'], [
  { field: 'Sales', function: 'sum' }
]);

await transformer.writeTransformedData(groupedData);
await transformer.saveToFile('transformed.xlsx');
```

### 5. AnalysisExcelTemplate
**Purpose**: Statistical analysis and reporting

**Key Features**:
- Descriptive statistics (mean, median, std dev, etc.)
- Correlation analysis
- Trend analysis
- Professional report generation
- Multiple analysis types

**Example Usage**:
```typescript
import { AnalysisExcelTemplate } from './templates/AnalysisExcelTemplate';

const analyzer = new AnalysisExcelTemplate();
await analyzer.loadFile('data.xlsx');
analyzer.setSourceWorksheet(0);

await analyzer.generateAnalysisReport([
  { name: 'Sales Statistics', type: 'descriptive', columnX: 'C' },
  { name: 'Price vs Sales Correlation', type: 'correlation', columnX: 'B', columnY: 'C' }
]);

await analyzer.saveToFile('analysis.xlsx');
```

### 6. PDFToExcelTemplate
**Purpose**: Converting PDF content to Excel format

**Key Features**:
- Extract tables from PDFs
- Process text content
- Handle metadata
- Smart data type detection
- Structured output formatting

**Example Usage**:
```typescript
import { PDFToExcelTemplate } from './templates/PDFToExcelTemplate';

const converter = new PDFToExcelTemplate();
await converter.processPDFData(extractedPDFData, {
  tableProcessing: { autoDetectHeaders: true },
  formatting: { autoFit: true }
});
await converter.saveToFile('converted.xlsx');
```

## 🔧 Helper Functions

### ExcelHelpers
Common utilities for Excel operations:

```typescript
import { ExcelHelpers } from './helpers/ExcelHelpers';

// Column conversions
const colNum = ExcelHelpers.columnLetterToNumber('AB'); // 28
const colLetter = ExcelHelpers.columnNumberToLetter(28); // 'AB'

// Cell address parsing
const cellInfo = ExcelHelpers.parseCellAddress('B10');
// { row: 10, column: 2, columnLetter: 'B' }

// Auto-resize columns
ExcelHelpers.autoResizeColumns(worksheet, { minWidth: 10, maxWidth: 50 });
```

### DataExtractor
Specialized data extraction methods:

```typescript
import { DataExtractor } from './helpers/DataExtractor';

// Extract table with auto-detection
const tableData = DataExtractor.extractTable(worksheet, {
  autoDetectHeaders: true,
  skipEmptyRows: true
});

// Find columns by pattern
const numericColumns = DataExtractor.extractColumnsByPattern(worksheet, {
  dataType: 'number',
  minimumDataPercentage: 0.8
});

// Extract key-value pairs
const keyValues = DataExtractor.extractKeyValuePairs(worksheet, {
  autoDetect: true,
  keyPattern: /^[A-Za-z\s]+:?$/
});
```

### DataValidator
Comprehensive data validation:

```typescript
import { DataValidator } from './helpers/DataValidator';

// Validate data types
const typeValidation = DataValidator.validateDataTypes(worksheet, 'A1:D100', {
  'A': 'string',  // Column A should be strings
  'B': 'number',  // Column B should be numbers
  'C': 'date',    // Column C should be dates
  'D': 'email'    // Column D should be email addresses
});

// Generate comprehensive report
const report = DataValidator.generateValidationReport(worksheet, {
  dataTypes: { 'A': 'string', 'B': 'number' },
  requiredFields: [
    { column: 'A', name: 'Name', allowEmpty: false }
  ],
  formatRules: {
    'D': { pattern: /^\d{3}-\d{3}-\d{4}$/, description: 'Phone number format' }
  }
});
```

### FormatHelper
Professional formatting and styling:

```typescript
import { FormatHelper } from './helpers/FormatHelper';

// Apply professional theme
FormatHelper.applyTheme(worksheet, 'A1:D10', 'PROFESSIONAL', {
  hasHeaders: true,
  alternateRows: true,
  freezeHeader: true
});

// Format numbers
FormatHelper.formatNumbers(worksheet, 'B2:B10', 'CURRENCY_USD');

// Format dates
FormatHelper.formatDates(worksheet, 'C2:C10', 'SHORT_DATE');

// Apply conditional formatting
FormatHelper.applyConditionalFormatting(worksheet, 'D2:D10', [
  {
    type: 'cellValue',
    condition: { operator: 'greaterThan', value: 1000 },
    style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F3FF' } } }
  }
]);
```

## 🤖 AI-Powered Code Generation

### ExcelCodeGenerator
Generate ExcelJS code from natural language:

```typescript
import { ExcelCodeGenerator } from './codeGen/ExcelCodeGenerator';

const result = ExcelCodeGenerator.generateCode(
  'Read sales data from quarterly_report.xlsx and calculate totals by region',
  { outputFormat: 'typescript', includeComments: true }
);

console.log(result.code);        // Generated ExcelJS code
console.log(result.explanation); // What the code does
console.log(result.template);    // Template used
console.log(result.dependencies); // Required packages
console.log(result.executionSteps); // Step-by-step process
```

**Supported Operations**:
- Reading Excel files
- Creating new files
- Updating existing data
- Data transformation
- Statistical analysis
- PDF conversion

### TemplateSelector
Intelligent template selection based on user intent:

```typescript
import { TemplateSelector } from './codeGen/TemplateSelector';

const selection = TemplateSelector.selectTemplate({
  operation: 'transform',
  dataSource: 'sales.xlsx',
  transformations: [{ type: 'group' }]
});

console.log(selection.template);    // 'transform'
console.log(selection.confidence); // 0.85
console.log(selection.reasoning);  // Why this template was selected
console.log(selection.alternatives); // Other possible templates
```

## 📊 Usage Examples

### Complete Workflow Example

```typescript
import { ExcelService } from './services/excel';

async function processExcelData() {
  try {
    // 1. Generate code from natural language
    const codeResult = ExcelService.generateCode(
      'Read sales data, filter active customers, group by region, and create summary'
    );
    console.log('Generated approach:', codeResult.explanation);

    // 2. Read source data
    const reader = ExcelService.createReader();
    await reader.loadFile('sales_data.xlsx');
    const sourceData = await reader.readAsObjects(0, { headers: true });
    
    // 3. Transform data
    const transformer = ExcelService.createTransformer();
    await transformer.loadFile('sales_data.xlsx');
    transformer.setSourceWorksheet(0);
    
    const extractedData = await transformer.extractSourceData();
    const filteredData = transformer.filterData(extractedData, [
      { field: 'Status', operator: 'equals', value: 'Active' }
    ]);
    
    const groupedData = transformer.groupData(filteredData, ['Region'], [
      { field: 'Sales', function: 'sum', outputField: 'Total_Sales' },
      { field: 'Sales', function: 'avg', outputField: 'Avg_Sales' },
      { field: 'CustomerID', function: 'count', outputField: 'Customer_Count' }
    ]);

    // 4. Create output with formatting
    const writer = ExcelService.createWriter();
    await writer.writeFromObjects('Regional Summary', groupedData, {
      headers: true,
      autoFitColumns: true,
      headerStyle: {
        font: { bold: true, color: { argb: 'FFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '366092' } }
      }
    });

    // 5. Add analysis
    const analyzer = ExcelService.createAnalyzer();
    await analyzer.loadFile('sales_data.xlsx');
    analyzer.setSourceWorksheet(0);
    await analyzer.generateAnalysisReport([
      { name: 'Sales Statistics', type: 'descriptive', columnX: 'C' }
    ]);

    // 6. Save results
    await writer.saveToFile('regional_summary.xlsx');
    await analyzer.saveToFile('sales_analysis.xlsx');
    
    console.log('Excel processing completed successfully!');
    
  } catch (error) {
    console.error('Error processing Excel data:', error);
  }
}

// Run the workflow
processExcelData();
```

### Natural Language Examples

The code generator can handle various natural language requests:

```typescript
// Reading data
ExcelService.generateCode('Read customer data from clients.xlsx');
ExcelService.generateCode('Load sales information from Q1 report');
ExcelService.generateCode('Import data from spreadsheet');

// Creating files
ExcelService.generateCode('Create new Excel file with employee records');
ExcelService.generateCode('Generate sales report with charts');
ExcelService.generateCode('Make spreadsheet for inventory tracking');

// Data transformation
ExcelService.generateCode('Filter active customers and group by region');
ExcelService.generateCode('Sort sales data by date and calculate monthly totals');
ExcelService.generateCode('Pivot table showing product sales by quarter');

// Analysis
ExcelService.generateCode('Analyze sales trends and create statistics report');
ExcelService.generateCode('Calculate correlation between price and sales');
ExcelService.generateCode('Generate financial analysis with key metrics');

// PDF conversion
ExcelService.generateCode('Convert PDF tables to Excel format');
ExcelService.generateCode('Extract data from PDF report to spreadsheet');
```

## 🔍 Advanced Features

### Template Customization

Each template can be extended or customized:

```typescript
class CustomAnalysisTemplate extends AnalysisExcelTemplate {
  async generateCustomReport(data: any[]) {
    // Add custom analysis logic
    const customMetrics = this.calculateCustomMetrics(data);
    await this.writeCustomReport(customMetrics);
  }
  
  private calculateCustomMetrics(data: any[]) {
    // Custom calculation logic
    return {};
  }
}
```

### Error Handling

All templates include comprehensive error handling:

```typescript
try {
  const reader = new ReadExcelTemplate();
  await reader.loadFile('nonexistent.xlsx');
} catch (error) {
  if (error.message.includes('Failed to load Excel file')) {
    console.log('File not found or corrupted');
  }
}
```

### Memory Management

Templates are designed to handle large files efficiently:

```typescript
// For large files, use streaming or chunking
const reader = new ReadExcelTemplate();
await reader.loadFile('large_file.xlsx');

// Process data in chunks to avoid memory issues
const chunkSize = 1000;
for (let i = 0; i < totalRows; i += chunkSize) {
  const chunk = await reader.readAsObjects(0, {
    startRow: i + 1,
    endRow: Math.min(i + chunkSize, totalRows)
  });
  await processChunk(chunk);
}
```

## 🛠️ Integration with MAGK Excel

This library is designed to work seamlessly with:

- **ExcelJS**: Full compatibility with ExcelJS operations
- **Executor Tool**: Can be called via the executor/run_ts tool
- **MCP Servers**: Integrates with MCP architecture
- **Chat Interface**: Responds to natural language requests
- **File Persistence**: Works with the file persistence system

### Using with Executor Tool

```typescript
// The executor can run any template code
const code = `
const { WriteExcelTemplate } = require('./templates/WriteExcelTemplate');

const writer = new WriteExcelTemplate();
await writer.writeFromObjects('Data', data, { headers: true });
await writer.saveToFile('output.xlsx');
`;

// This code can be executed by the executor tool
```

## 📈 Performance Considerations

- **Memory Usage**: Templates use streaming when possible to handle large files
- **Processing Speed**: Optimized for common operations with minimal overhead  
- **File Size**: Support for large Excel files (>100MB) with chunked processing
- **Concurrent Operations**: Safe for concurrent use across multiple files

## 🤝 Contributing

When adding new templates or helpers:

1. Follow the established patterns and interfaces
2. Include comprehensive JSDoc comments
3. Add example usage in the class
4. Update the main index.ts export
5. Add test cases for new functionality

## 📄 License

This library is part of the MAGK Excel project and follows the same licensing terms.

---

**MAGK Excel Services v1.0.0** - Comprehensive Excel operation library designed for both human developers and AI systems.