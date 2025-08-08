/**
 * Test script for the enhanced Excel MCP Tool
 * This script tests various file path resolution scenarios
 */

import { excelMCPTool } from '../services/excel/ExcelMCPTool';

/**
 * Test the Excel MCP tool with various file path scenarios
 */
export async function testExcelMCPTool(): Promise<void> {
  console.log('🧪 Starting Excel MCP Tool Tests...');
  
  // Enable diagnostics for detailed logging
  excelMCPTool.setDiagnosticsEnabled(true);
  
  // Test scenarios with different path formats
  const testPaths = [
    // Filename only (most common scenario)
    'data.xlsx',
    'sample.xls',
    'report.csv',
    
    // Paths with common prefixes
    'file_data.xlsx',
    'upload_sample.xlsx',
    'temp_report.xlsx',
    
    // Relative paths
    './data.xlsx',
    'files/sample.xlsx',
    'uploads/report.xlsx',
    
    // Absolute paths (these should work as-is)
    '/tmp/test.xlsx',
    'C:\\Users\\Test\\Downloads\\data.xlsx',
    
    // Non-existent files (should fallback gracefully)
    'nonexistent.xlsx',
    'missing_file.xls'
  ];
  
  try {
    // Test path resolution
    console.log('📍 Testing file path resolution...');
    const resolutionTest = await excelMCPTool.testPathResolution(testPaths, 'test-session');
    
    console.log('📊 Test Results Summary:');
    console.log(`- Total paths tested: ${resolutionTest.summary.total}`);
    console.log(`- Paths resolved: ${resolutionTest.summary.resolved}`);
    console.log(`- Files actually exist: ${resolutionTest.summary.existing}`);
    
    // Show detailed results for first few paths
    console.log('\n📋 Detailed Results (first 5):');
    resolutionTest.results.slice(0, 5).forEach((result, index) => {
      const status = result.exists ? '✅ EXISTS' : result.error ? '❌ ERROR' : '⚠️ NOT FOUND';
      console.log(`${index + 1}. ${result.inputPath}`);
      console.log(`   → ${result.resolvedPath}`);
      console.log(`   Status: ${status}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      console.log('');
    });
    
    // Test actual Excel operations
    console.log('📊 Testing Excel operations...');
    await testExcelOperations();
    
    console.log('✅ All Excel MCP Tool tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

/**
 * Test actual Excel operations with error handling
 */
async function testExcelOperations(): Promise<void> {
  // Test reading a non-existent file (should show good error messages)
  console.log('🔍 Testing read operation with non-existent file...');
  try {
    const readResult = await excelMCPTool.handleToolCall({
      name: 'excel_read_sheet',
      arguments: {
        file_path: 'nonexistent.xlsx',
        _filePathMap: {
          'test.xlsx': '/tmp/test.xlsx',
          'sample': '/home/user/Downloads/sample.xlsx'
        }
      }
    });
    
    console.log('Read operation result:', readResult);
  } catch (error) {
    console.log('Read operation error (expected):', error);
  }
  
  // Test creating a sample file
  console.log('📄 Testing sample creation...');
  try {
    const createResult = await excelMCPTool.handleToolCall({
      name: 'excel_sample',
      arguments: {
        filePath: 'test-sample.xlsx'
      }
    });
    
    console.log('Sample creation result:', createResult.isError ? 'Failed' : 'Success');
    if (createResult.isError) {
      console.log('Error details:', createResult.content[0]?.text);
    }
  } catch (error) {
    console.log('Sample creation error:', error);
  }
  
  // Test getting info for various file patterns
  console.log('📋 Testing info operation...');
  const infoTestPaths = ['data.xlsx', 'sample', 'report.xls'];
  for (const testPath of infoTestPaths) {
    try {
      const infoResult = await excelMCPTool.handleToolCall({
        name: 'excel_describe_sheets',
        arguments: {
          file_path: testPath,
          _filePathMap: {
            'data.xlsx': '/tmp/data.xlsx',
            'sample': '/home/user/sample.xlsx'
          }
        }
      });
      
      console.log(`Info for "${testPath}":`, infoResult.isError ? 'Failed' : 'Success');
    } catch (error) {
      console.log(`Info error for "${testPath}":`, error);
    }
  }
}

/**
 * Test file path mapping scenarios
 */
export function testFilePathMappingScenarios(): void {
  console.log('🗂️ Testing file path mapping scenarios...');
  
  const scenarios = [
    {
      name: 'Exact filename match',
      inputPath: 'data.xlsx',
      mapping: { 'data.xlsx': '/home/user/Downloads/data.xlsx' },
      expected: '/home/user/Downloads/data.xlsx'
    },
    {
      name: 'Fuzzy match (name without extension)',
      inputPath: 'data',
      mapping: { 'data.xlsx': '/home/user/Downloads/data.xlsx' },
      expected: '/home/user/Downloads/data.xlsx'
    },
    {
      name: 'Partial match (input contains mapped name)',
      inputPath: 'report_final',
      mapping: { 'report': '/tmp/report.xlsx' },
      expected: '/tmp/report.xlsx'
    },
    {
      name: 'No match (fallback behavior)',
      inputPath: 'missing.xlsx',
      mapping: { 'other.xlsx': '/tmp/other.xlsx' },
      expected: 'fallback path'
    }
  ];
  
  scenarios.forEach((scenario, index) => {
    console.log(`${index + 1}. ${scenario.name}:`);
    console.log(`   Input: "${scenario.inputPath}"`);
    console.log(`   Mapping: ${JSON.stringify(scenario.mapping)}`);
    console.log(`   Expected: ${scenario.expected}`);
    console.log('');
  });
}

// Export for use in development/debugging
if (require.main === module) {
  testExcelMCPTool().catch(console.error);
}