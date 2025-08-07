/**
 * Complete MCP Integration Test
 * Tests Excel and PDF tool registration and execution
 */

// Test configuration
const TEST_CONFIG = {
  excelFile: 'test-data.xlsx',
  pdfUrl: 'https://example.com/test.pdf',
  outputPath: './test-output.xlsx'
};

// Mock window.mcpAPI for testing
if (typeof window === 'undefined') {
  global.window = {
    mcpAPI: {
      loadConfig: async () => {
        console.log('📋 Loading MCP config...');
        return {
          availableServers: ['excel', 'pdf'],
          enabledServers: ['excel', 'pdf']
        };
      },
      
      toggleServer: async (serverName, enabled) => {
        console.log(`🔄 Toggling ${serverName}: ${enabled}`);
        return {
          enabledServers: enabled ? ['excel', 'pdf'] : ['pdf']
        };
      },
      
      listTools: async (serverName) => {
        console.log(`📜 Listing tools for: ${serverName || 'all servers'}`);
        
        const excelTools = [
          { name: 'excel_read_sheet', server: 'excel', description: 'Read Excel sheet data' },
          { name: 'excel_write_to_sheet', server: 'excel', description: 'Write data to Excel sheet' },
          { name: 'excel_describe_sheets', server: 'excel', description: 'Get sheet information' }
        ];
        
        const pdfTools = [
          { name: 'pdf_extract_tables', server: 'pdf', description: 'Extract tables from PDF' },
          { name: 'pdf_extract_text', server: 'pdf', description: 'Extract text from PDF' },
          { name: 'pdf_read', server: 'pdf', description: 'Read PDF information' }
        ];
        
        if (serverName === 'excel') return excelTools;
        if (serverName === 'pdf') return pdfTools;
        return [...excelTools, ...pdfTools];
      },
      
      callTool: async (serverName, toolName, args) => {
        console.log(`🔧 Calling tool: ${serverName}/${toolName}`);
        console.log('   Args:', args);
        
        // Simulate tool responses
        if (serverName === 'excel') {
          switch (toolName) {
            case 'excel_describe_sheets':
              return {
                content: [{
                  type: 'text',
                  text: '📊 Workbook has 2 sheets: Sheet1 (100 rows), Sheet2 (50 rows)'
                }]
              };
            case 'excel_read_sheet':
              return {
                content: [{
                  type: 'text',
                  text: '📋 Sheet data:\n| Name | Value |\n|------|-------|\n| Row1 | 100   |\n| Row2 | 200   |'
                }]
              };
            case 'excel_write_to_sheet':
              return {
                content: [{
                  type: 'text',
                  text: `✅ Excel file created: ${args.file_path}`
                }]
              };
          }
        }
        
        if (serverName === 'pdf') {
          switch (toolName) {
            case 'pdf_extract_tables':
              return {
                content: [{
                  type: 'text',
                  text: '📄 Extracted 3 tables from PDF'
                }]
              };
            case 'pdf_read':
              return {
                content: [{
                  type: 'text',
                  text: '📄 PDF: 10 pages, 5 tables, 2000 words'
                }]
              };
          }
        }
        
        return { error: 'Unknown tool' };
      }
    }
  };
}

// Test functions
async function testExcelTools() {
  console.log('\n🧪 Testing Excel MCP Tools...\n');
  
  try {
    // Test describe sheets
    const describeResult = await window.mcpAPI.callTool(
      'excel',
      'excel_describe_sheets',
      { file_path: TEST_CONFIG.excelFile }
    );
    console.log('✅ Describe sheets:', describeResult.content[0].text);
    
    // Test read sheet
    const readResult = await window.mcpAPI.callTool(
      'excel',
      'excel_read_sheet',
      { 
        file_path: TEST_CONFIG.excelFile,
        sheet_name: 'Sheet1',
        limit: 10
      }
    );
    console.log('✅ Read sheet:', readResult.content[0].text);
    
    // Test write sheet
    const writeResult = await window.mcpAPI.callTool(
      'excel',
      'excel_write_to_sheet',
      {
        file_path: TEST_CONFIG.outputPath,
        sheet_name: 'TestSheet',
        values: [
          ['Name', 'Department', 'Salary'],
          ['John', 'IT', 75000],
          ['Jane', 'HR', 65000]
        ]
      }
    );
    console.log('✅ Write sheet:', writeResult.content[0].text);
    
    return true;
  } catch (error) {
    console.error('❌ Excel test failed:', error);
    return false;
  }
}

async function testPDFTools() {
  console.log('\n🧪 Testing PDF MCP Tools...\n');
  
  try {
    // Test PDF read
    const readResult = await window.mcpAPI.callTool(
      'pdf',
      'pdf_read',
      { file_path: TEST_CONFIG.pdfUrl }
    );
    console.log('✅ PDF read:', readResult.content[0].text);
    
    // Test extract tables
    const extractResult = await window.mcpAPI.callTool(
      'pdf',
      'pdf_extract_tables',
      { 
        file_path: TEST_CONFIG.pdfUrl,
        prompt: 'Extract financial data'
      }
    );
    console.log('✅ Extract tables:', extractResult.content[0].text);
    
    return true;
  } catch (error) {
    console.error('❌ PDF test failed:', error);
    return false;
  }
}

async function testServerManagement() {
  console.log('\n🧪 Testing Server Management...\n');
  
  try {
    // Load config
    const config = await window.mcpAPI.loadConfig();
    console.log('✅ Available servers:', config.availableServers);
    console.log('✅ Enabled servers:', config.enabledServers);
    
    // List all tools
    const allTools = await window.mcpAPI.listTools();
    console.log('✅ Total tools available:', allTools.length);
    console.log('   Excel tools:', allTools.filter(t => t.server === 'excel').length);
    console.log('   PDF tools:', allTools.filter(t => t.server === 'pdf').length);
    
    // Toggle server
    const toggleResult = await window.mcpAPI.toggleServer('excel', false);
    console.log('✅ After disabling Excel:', toggleResult.enabledServers);
    
    // Re-enable
    const reEnableResult = await window.mcpAPI.toggleServer('excel', true);
    console.log('✅ After re-enabling Excel:', reEnableResult.enabledServers);
    
    return true;
  } catch (error) {
    console.error('❌ Server management test failed:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting MCP Integration Tests');
  console.log('=' .repeat(50));
  
  const results = {
    serverManagement: await testServerManagement(),
    excelTools: await testExcelTools(),
    pdfTools: await testPDFTools()
  };
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results:');
  console.log('  Server Management:', results.serverManagement ? '✅ PASSED' : '❌ FAILED');
  console.log('  Excel Tools:', results.excelTools ? '✅ PASSED' : '❌ FAILED');
  console.log('  PDF Tools:', results.pdfTools ? '✅ PASSED' : '❌ FAILED');
  
  const allPassed = Object.values(results).every(r => r);
  console.log('\n' + (allPassed ? '🎉 All tests passed!' : '⚠️ Some tests failed'));
  
  return allPassed;
}

// Run tests if executed directly
if (typeof module !== 'undefined' && require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testMCP = {
    testExcelTools,
    testPDFTools,
    testServerManagement,
    runAllTests
  };
  
  console.log('🔧 MCP Test Suite Loaded!');
  console.log('Run tests with: window.testMCP.runAllTests()');
}