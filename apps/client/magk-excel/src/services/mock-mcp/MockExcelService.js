/**
 * Mock Excel MCP Service
 * Provides mock implementations for Excel operations
 */

class MockExcelService {
  constructor() {
    console.log('Mock Excel Service initialized');
  }

  async execute(params) {
    console.log('Executing Excel operation:', params);
    
    try {
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response based on operation
      switch (params?.operation) {
        case 'read':
          return this.mockReadOperation(params);
        case 'write':
          return this.mockWriteOperation(params);
        case 'format':
          return this.mockFormatOperation(params);
        case 'calculate':
          return this.mockCalculateOperation(params);
        default:
          console.log('Using default write operation for:', params);
          // Default to write operation if none specified
          return this.mockWriteOperation(params);
      }
    } catch (error) {
      console.error('Error in Excel execute operation:', error);
      throw error;
    }
  }

  async mockReadOperation(params) {
    console.log('Reading Excel file:', params.filePath);
    return {
      success: true,
      data: [
        ['Header 1', 'Header 2', 'Header 3'],
        ['Value 1', 'Value 2', 'Value 3'],
        ['Value 4', 'Value 5', 'Value 6'],
      ],
      sheetName: params.sheetName || 'Sheet1',
      totalRows: 3,
      totalColumns: 3
    };
  }

  async mockWriteOperation(params) {
    console.log('Writing to Excel file:', params.filePath);
    return {
      success: true,
      filePath: params.filePath,
      bytesWritten: 2048,
      message: 'File saved successfully'
    };
  }

  async mockFormatOperation(params) {
    console.log('Formatting Excel file:', params.filePath);
    return {
      success: true,
      affectedCells: 12,
      message: 'Formatting applied successfully'
    };
  }

  async mockCalculateOperation(params) {
    console.log('Calculating in Excel file:', params.filePath);
    return {
      success: true,
      result: 12345.67,
      message: 'Calculation completed successfully'
    };
  }

  // Service heartbeat
  async ping() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}

module.exports = new MockExcelService();