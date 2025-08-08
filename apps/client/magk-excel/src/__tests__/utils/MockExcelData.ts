/**
 * Mock Excel Data - Sample data for testing
 */
export class MockExcelData {
  /**
   * Get sample sales data
   */
  static getSalesData(): any[][] {
    return [
      ['Date', 'Product', 'Category', 'Quantity', 'Unit Price', 'Total', 'Region', 'Sales Rep'],
      [new Date(2024, 0, 1), 'Widget A', 'Electronics', 10, 25.00, 250.00, 'North', 'John Smith'],
      [new Date(2024, 0, 2), 'Widget B', 'Electronics', 5, 50.00, 250.00, 'South', 'Jane Doe'],
      [new Date(2024, 0, 3), 'Widget C', 'Hardware', 15, 15.00, 225.00, 'East', 'Bob Johnson'],
      [new Date(2024, 0, 4), 'Widget A', 'Electronics', 8, 25.00, 200.00, 'West', 'Alice Brown'],
      [new Date(2024, 0, 5), 'Widget D', 'Software', 20, 10.00, 200.00, 'North', 'John Smith'],
      [new Date(2024, 0, 6), 'Widget B', 'Electronics', 12, 50.00, 600.00, 'South', 'Jane Doe'],
      [new Date(2024, 0, 7), 'Widget E', 'Hardware', 7, 35.00, 245.00, 'East', 'Bob Johnson'],
      [new Date(2024, 0, 8), 'Widget C', 'Hardware', 18, 15.00, 270.00, 'West', 'Alice Brown'],
      [new Date(2024, 0, 9), 'Widget A', 'Electronics', 25, 25.00, 625.00, 'North', 'John Smith'],
      [new Date(2024, 0, 10), 'Widget F', 'Software', 30, 8.00, 240.00, 'South', 'Jane Doe']
    ];
  }
  
  /**
   * Get sample financial data
   */
  static getFinancialData(): any[][] {
    return [
      ['Account', 'Q1 2023', 'Q2 2023', 'Q3 2023', 'Q4 2023', 'Q1 2024', 'YoY Growth'],
      ['Revenue', 1000000, 1100000, 1200000, 1300000, 1400000, '40%'],
      ['Cost of Goods Sold', 600000, 650000, 700000, 750000, 800000, '33%'],
      ['Gross Profit', 400000, 450000, 500000, 550000, 600000, '50%'],
      ['Operating Expenses', 200000, 210000, 220000, 230000, 240000, '20%'],
      ['EBITDA', 200000, 240000, 280000, 320000, 360000, '80%'],
      ['Depreciation', 20000, 20000, 20000, 20000, 25000, '25%'],
      ['Interest', 10000, 10000, 10000, 10000, 12000, '20%'],
      ['Tax', 50000, 60000, 70000, 80000, 90000, '80%'],
      ['Net Income', 120000, 150000, 180000, 210000, 233000, '94%']
    ];
  }
  
  /**
   * Get sample employee data
   */
  static getEmployeeData(): any[][] {
    return [
      ['Employee ID', 'Name', 'Department', 'Position', 'Hire Date', 'Salary', 'Performance Rating'],
      ['EMP001', 'John Smith', 'Engineering', 'Senior Developer', new Date(2020, 5, 15), 95000, 4.5],
      ['EMP002', 'Jane Doe', 'Marketing', 'Marketing Manager', new Date(2019, 2, 1), 85000, 4.2],
      ['EMP003', 'Bob Johnson', 'Sales', 'Sales Representative', new Date(2021, 8, 20), 65000, 3.8],
      ['EMP004', 'Alice Brown', 'HR', 'HR Specialist', new Date(2020, 11, 10), 60000, 4.0],
      ['EMP005', 'Charlie Wilson', 'Engineering', 'Junior Developer', new Date(2022, 3, 5), 55000, 3.5],
      ['EMP006', 'Diana Prince', 'Finance', 'Financial Analyst', new Date(2021, 1, 15), 70000, 4.3],
      ['EMP007', 'Edward Norton', 'Operations', 'Operations Manager', new Date(2018, 6, 1), 90000, 4.7],
      ['EMP008', 'Fiona Green', 'Marketing', 'Content Creator', new Date(2022, 9, 12), 50000, 3.9],
      ['EMP009', 'George Martin', 'Engineering', 'Tech Lead', new Date(2017, 4, 20), 110000, 4.8],
      ['EMP010', 'Helen Troy', 'Sales', 'Sales Director', new Date(2019, 7, 8), 120000, 4.6]
    ];
  }
  
  /**
   * Get sample inventory data
   */
  static getInventoryData(): any[][] {
    return [
      ['SKU', 'Product Name', 'Category', 'Quantity', 'Unit Cost', 'Total Value', 'Reorder Level', 'Status'],
      ['SKU001', 'Widget A', 'Electronics', 150, 15.00, 2250.00, 50, 'In Stock'],
      ['SKU002', 'Widget B', 'Electronics', 45, 30.00, 1350.00, 60, 'Low Stock'],
      ['SKU003', 'Widget C', 'Hardware', 200, 8.00, 1600.00, 40, 'In Stock'],
      ['SKU004', 'Widget D', 'Software', 0, 5.00, 0.00, 20, 'Out of Stock'],
      ['SKU005', 'Widget E', 'Hardware', 75, 22.00, 1650.00, 30, 'In Stock'],
      ['SKU006', 'Widget F', 'Software', 15, 4.00, 60.00, 25, 'Critical'],
      ['SKU007', 'Widget G', 'Electronics', 120, 18.00, 2160.00, 45, 'In Stock'],
      ['SKU008', 'Widget H', 'Hardware', 90, 12.00, 1080.00, 35, 'In Stock'],
      ['SKU009', 'Widget I', 'Software', 5, 6.00, 30.00, 15, 'Critical'],
      ['SKU010', 'Widget J', 'Electronics', 180, 25.00, 4500.00, 70, 'In Stock']
    ];
  }
  
  /**
   * Get sample customer data
   */
  static getCustomerData(): any[][] {
    return [
      ['Customer ID', 'Company', 'Contact', 'Email', 'Phone', 'Country', 'Total Orders', 'Total Revenue'],
      ['CUST001', 'Acme Corp', 'John Doe', 'john@acme.com', '555-0100', 'USA', 45, 125000],
      ['CUST002', 'Tech Solutions', 'Jane Smith', 'jane@techsol.com', '555-0101', 'Canada', 32, 89000],
      ['CUST003', 'Global Industries', 'Bob Wilson', 'bob@global.com', '555-0102', 'UK', 67, 234000],
      ['CUST004', 'StartUp Inc', 'Alice Johnson', 'alice@startup.com', '555-0103', 'USA', 12, 34000],
      ['CUST005', 'Enterprise LLC', 'Charlie Brown', 'charlie@enterprise.com', '555-0104', 'Germany', 89, 456000],
      ['CUST006', 'Small Business Co', 'Diana Prince', 'diana@smallbiz.com', '555-0105', 'France', 23, 67000],
      ['CUST007', 'Mega Corp', 'Edward Davis', 'edward@mega.com', '555-0106', 'Japan', 156, 789000],
      ['CUST008', 'Local Shop', 'Fiona Miller', 'fiona@local.com', '555-0107', 'Australia', 8, 12000],
      ['CUST009', 'International Trade', 'George Wilson', 'george@intl.com', '555-0108', 'China', 234, 1234000],
      ['CUST010', 'Regional Supplier', 'Helen Garcia', 'helen@regional.com', '555-0109', 'Mexico', 45, 98000]
    ];
  }
  
  /**
   * Get sample time series data
   */
  static getTimeSeriesData(): any[][] {
    const data: any[][] = [['Date', 'Value', 'Moving Average', 'Trend']];
    const startDate = new Date(2023, 0, 1);
    
    for (let i = 0; i < 365; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const baseValue = 100;
      const trend = i * 0.5;
      const seasonal = Math.sin((i / 365) * 2 * Math.PI) * 20;
      const noise = (Math.random() - 0.5) * 10;
      const value = baseValue + trend + seasonal + noise;
      
      const movingAvg = i >= 7 
        ? value * 0.95 // Simplified moving average
        : value;
      
      data.push([
        date,
        Math.round(value * 100) / 100,
        Math.round(movingAvg * 100) / 100,
        Math.round(trend * 100) / 100
      ]);
    }
    
    return data;
  }
  
  /**
   * Get sample pivot table source data
   */
  static getPivotSourceData(): any[][] {
    const regions = ['North', 'South', 'East', 'West'];
    const products = ['Product A', 'Product B', 'Product C', 'Product D'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    
    const data: any[][] = [['Month', 'Region', 'Product', 'Sales', 'Units', 'Returns']];
    
    for (const month of months) {
      for (const region of regions) {
        for (const product of products) {
          data.push([
            month,
            region,
            product,
            Math.floor(Math.random() * 10000) + 1000,
            Math.floor(Math.random() * 100) + 10,
            Math.floor(Math.random() * 10)
          ]);
        }
      }
    }
    
    return data;
  }
  
  /**
   * Get sample data with formulas
   */
  static getFormulaData(): any[][] {
    return [
      ['Item', 'Quantity', 'Unit Price', 'Subtotal', 'Tax Rate', 'Tax Amount', 'Total'],
      ['Widget A', 10, 25.00, '=B2*C2', 0.08, '=D2*E2', '=D2+F2'],
      ['Widget B', 5, 50.00, '=B3*C3', 0.08, '=D3*E3', '=D3+F3'],
      ['Widget C', 15, 15.00, '=B4*C4', 0.08, '=D4*E4', '=D4+F4'],
      ['Widget D', 8, 30.00, '=B5*C5', 0.08, '=D5*E5', '=D5+F5'],
      ['Widget E', 12, 20.00, '=B6*C6', 0.08, '=D6*E6', '=D6+F6'],
      ['', '', '', '=SUM(D2:D6)', '', '=SUM(F2:F6)', '=SUM(G2:G6)']
    ];
  }
  
  /**
   * Get sample data with multiple data types
   */
  static getMixedTypeData(): any[][] {
    return [
      ['String', 'Number', 'Date', 'Boolean', 'Formula', 'Percentage', 'Currency'],
      ['Text Value', 42, new Date(2024, 0, 1), true, '=B2*2', 0.75, '$1,234.56'],
      ['Another Text', 3.14159, new Date(2024, 5, 15), false, '=B3+10', 0.25, '$999.99'],
      ['Special Chars: @#$', -100, new Date(2024, 11, 31), true, '=ABS(B4)', 1.00, '-$50.00'],
      ['Unicode: 你好', 0, new Date(2024, 2, 20), false, '=IF(B5=0,"Zero","Non-zero")', 0.00, '$0.00'],
      ['Empty Next', null, null, null, '=COUNTA(A2:A5)', 0.50, '$500.50']
    ];
  }
  
  /**
   * Generate random data of specified size
   */
  static generateRandomData(rows: number, cols: number): any[][] {
    const headers = [];
    for (let i = 0; i < cols; i++) {
      headers.push(`Column ${String.fromCharCode(65 + i)}`);
    }
    
    const data: any[][] = [headers];
    
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        const type = Math.floor(Math.random() * 4);
        switch (type) {
          case 0: // String
            row.push(`Text_${r}_${c}`);
            break;
          case 1: // Number
            row.push(Math.floor(Math.random() * 1000));
            break;
          case 2: // Date
            row.push(new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1));
            break;
          case 3: // Boolean
            row.push(Math.random() > 0.5);
            break;
        }
      }
      data.push(row);
    }
    
    return data;
  }
}