import * as ExcelJS from 'exceljs';

/**
 * Template for Excel data analysis with statistical calculations, charts, and reporting
 * Supports descriptive statistics, trend analysis, and automated report generation
 */
export class AnalysisExcelTemplate {
  private workbook: ExcelJS.Workbook;
  private sourceWorksheet: ExcelJS.Worksheet | null = null;
  private analysisWorksheet: ExcelJS.Worksheet | null = null;

  constructor() {
    this.workbook = new ExcelJS.Workbook();
  }

  /**
   * Load source data for analysis
   * @param source - Buffer or file path
   * @returns Promise resolving to workbook
   */
  async loadFile(source: Buffer | string): Promise<ExcelJS.Workbook> {
    try {
      if (typeof source === 'string') {
        await this.workbook.xlsx.readFile(source);
      } else {
        await this.workbook.xlsx.load(source);
      }
      return this.workbook;
    } catch (error) {
      throw new Error(`Failed to load Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Set source worksheet for analysis
   * @param identifier - Worksheet name or index
   * @returns Source worksheet
   */
  setSourceWorksheet(identifier: string | number): ExcelJS.Worksheet {
    try {
      if (typeof identifier === 'string') {
        this.sourceWorksheet = this.workbook.getWorksheet(identifier);
      } else {
        this.sourceWorksheet = this.workbook.getWorksheet(identifier + 1);
      }
      
      if (!this.sourceWorksheet) {
        throw new Error(`Source worksheet '${identifier}' not found`);
      }
      
      return this.sourceWorksheet;
    } catch (error) {
      throw new Error(`Failed to set source worksheet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create analysis worksheet
   * @param name - Analysis worksheet name
   * @returns Analysis worksheet
   */
  createAnalysisWorksheet(name: string = 'Data Analysis'): ExcelJS.Worksheet {
    try {
      this.analysisWorksheet = this.workbook.addWorksheet(name);
      return this.analysisWorksheet;
    } catch (error) {
      throw new Error(`Failed to create analysis worksheet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract numeric data from a column
   * @param columnIdentifier - Column letter or number
   * @param options - Extraction options
   * @returns Array of numeric values
   */
  extractNumericColumn(
    columnIdentifier: string | number,
    options: {
      startRow?: number;
      endRow?: number;
      skipHeader?: boolean;
      excludeZeros?: boolean;
    } = {}
  ): number[] {
    try {
      if (!this.sourceWorksheet) {
        throw new Error('Source worksheet not set');
      }

      const {
        startRow = 1,
        endRow = this.sourceWorksheet.rowCount,
        skipHeader = true,
        excludeZeros = false
      } = options;

      const column = this.sourceWorksheet.getColumn(columnIdentifier);
      const values: number[] = [];
      const actualStartRow = skipHeader ? startRow + 1 : startRow;

      for (let rowNum = actualStartRow; rowNum <= endRow; rowNum++) {
        const cell = this.sourceWorksheet.getCell(rowNum, column.number!);
        const cellValue = this.processCellValue(cell.value);
        
        if (cellValue !== null && cellValue !== undefined) {
          const numValue = Number(cellValue);
          if (!isNaN(numValue)) {
            if (!excludeZeros || numValue !== 0) {
              values.push(numValue);
            }
          }
        }
      }

      return values;
    } catch (error) {
      throw new Error(`Failed to extract numeric column: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate descriptive statistics for a dataset
   * @param data - Numeric data array
   * @returns Statistical summary
   */
  calculateDescriptiveStats(data: number[]): {
    count: number;
    sum: number;
    mean: number;
    median: number;
    mode: number | null;
    min: number;
    max: number;
    range: number;
    variance: number;
    standardDeviation: number;
    skewness: number;
    kurtosis: number;
    quartiles: { q1: number; q2: number; q3: number };
    percentiles: { p5: number; p10: number; p25: number; p75: number; p90: number; p95: number };
  } {
    try {
      if (data.length === 0) {
        throw new Error('Dataset is empty');
      }

      const sortedData = [...data].sort((a, b) => a - b);
      const n = data.length;
      
      // Basic statistics
      const sum = data.reduce((acc, val) => acc + val, 0);
      const mean = sum / n;
      
      // Median
      const median = n % 2 === 0 
        ? (sortedData[n / 2 - 1] + sortedData[n / 2]) / 2
        : sortedData[Math.floor(n / 2)];
      
      // Mode
      const frequency = new Map<number, number>();
      data.forEach(val => frequency.set(val, (frequency.get(val) || 0) + 1));
      const maxFreq = Math.max(...frequency.values());
      const modes = Array.from(frequency.entries()).filter(([_, freq]) => freq === maxFreq).map(([val, _]) => val);
      const mode = modes.length === 1 ? modes[0] : null; // Only return mode if unique
      
      // Range
      const min = Math.min(...data);
      const max = Math.max(...data);
      const range = max - min;
      
      // Variance and standard deviation
      const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n - 1);
      const standardDeviation = Math.sqrt(variance);
      
      // Skewness
      const skewness = data.reduce((acc, val) => acc + Math.pow((val - mean) / standardDeviation, 3), 0) / n;
      
      // Kurtosis
      const kurtosis = data.reduce((acc, val) => acc + Math.pow((val - mean) / standardDeviation, 4), 0) / n - 3;
      
      // Quartiles
      const q1 = this.calculatePercentile(sortedData, 25);
      const q2 = median;
      const q3 = this.calculatePercentile(sortedData, 75);
      
      // Percentiles
      const p5 = this.calculatePercentile(sortedData, 5);
      const p10 = this.calculatePercentile(sortedData, 10);
      const p25 = q1;
      const p75 = q3;
      const p90 = this.calculatePercentile(sortedData, 90);
      const p95 = this.calculatePercentile(sortedData, 95);

      return {
        count: n,
        sum,
        mean,
        median,
        mode,
        min,
        max,
        range,
        variance,
        standardDeviation,
        skewness,
        kurtosis,
        quartiles: { q1, q2, q3 },
        percentiles: { p5, p10, p25, p75, p90, p95 }
      };
    } catch (error) {
      throw new Error(`Failed to calculate descriptive statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform correlation analysis between two datasets
   * @param dataX - First dataset
   * @param dataY - Second dataset
   * @returns Correlation analysis results
   */
  calculateCorrelation(dataX: number[], dataY: number[]): {
    pearsonCorrelation: number;
    spearmanCorrelation: number;
    covariance: number;
    rSquared: number;
    linearRegression: { slope: number; intercept: number; equation: string };
  } {
    try {
      if (dataX.length !== dataY.length) {
        throw new Error('Datasets must have the same length');
      }

      const n = dataX.length;
      const meanX = dataX.reduce((acc, val) => acc + val, 0) / n;
      const meanY = dataY.reduce((acc, val) => acc + val, 0) / n;

      // Pearson correlation
      let numerator = 0;
      let denomX = 0;
      let denomY = 0;

      for (let i = 0; i < n; i++) {
        const deltaX = dataX[i] - meanX;
        const deltaY = dataY[i] - meanY;
        numerator += deltaX * deltaY;
        denomX += deltaX * deltaX;
        denomY += deltaY * deltaY;
      }

      const pearsonCorrelation = numerator / Math.sqrt(denomX * denomY);

      // Spearman correlation (rank-based)
      const rankedX = this.getRanks(dataX);
      const rankedY = this.getRanks(dataY);
      const meanRankX = rankedX.reduce((acc, val) => acc + val, 0) / n;
      const meanRankY = rankedY.reduce((acc, val) => acc + val, 0) / n;

      let spearmanNum = 0;
      let spearmanDenomX = 0;
      let spearmanDenomY = 0;

      for (let i = 0; i < n; i++) {
        const deltaRankX = rankedX[i] - meanRankX;
        const deltaRankY = rankedY[i] - meanRankY;
        spearmanNum += deltaRankX * deltaRankY;
        spearmanDenomX += deltaRankX * deltaRankX;
        spearmanDenomY += deltaRankY * deltaRankY;
      }

      const spearmanCorrelation = spearmanNum / Math.sqrt(spearmanDenomX * spearmanDenomY);

      // Covariance
      const covariance = numerator / (n - 1);

      // R-squared
      const rSquared = pearsonCorrelation * pearsonCorrelation;

      // Linear regression
      const slope = numerator / denomX;
      const intercept = meanY - slope * meanX;
      const equation = `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}`;

      return {
        pearsonCorrelation,
        spearmanCorrelation,
        covariance,
        rSquared,
        linearRegression: { slope, intercept, equation }
      };
    } catch (error) {
      throw new Error(`Failed to calculate correlation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform trend analysis on time series data
   * @param data - Time series data
   * @param periods - Number of periods for moving average
   * @returns Trend analysis results
   */
  analyzeTrend(
    data: number[],
    periods: number = 3
  ): {
    trend: 'increasing' | 'decreasing' | 'stable';
    trendStrength: number;
    movingAverage: number[];
    growthRates: number[];
    volatility: number;
    cyclicalPattern: boolean;
  } {
    try {
      if (data.length < 2) {
        throw new Error('Insufficient data for trend analysis');
      }

      // Calculate moving average
      const movingAverage: number[] = [];
      for (let i = periods - 1; i < data.length; i++) {
        const sum = data.slice(i - periods + 1, i + 1).reduce((acc, val) => acc + val, 0);
        movingAverage.push(sum / periods);
      }

      // Calculate growth rates
      const growthRates: number[] = [];
      for (let i = 1; i < data.length; i++) {
        if (data[i - 1] !== 0) {
          growthRates.push((data[i] - data[i - 1]) / Math.abs(data[i - 1]) * 100);
        }
      }

      // Determine overall trend
      const firstValue = data[0];
      const lastValue = data[data.length - 1];
      const totalChange = (lastValue - firstValue) / Math.abs(firstValue) * 100;
      
      let trend: 'increasing' | 'decreasing' | 'stable';
      if (Math.abs(totalChange) < 5) {
        trend = 'stable';
      } else {
        trend = totalChange > 0 ? 'increasing' : 'decreasing';
      }

      // Trend strength (based on R-squared of linear regression against time)
      const timePoints = data.map((_, index) => index);
      const correlation = this.calculateCorrelation(timePoints, data);
      const trendStrength = Math.abs(correlation.pearsonCorrelation);

      // Volatility (coefficient of variation of growth rates)
      const avgGrowthRate = growthRates.reduce((acc, val) => acc + val, 0) / growthRates.length;
      const growthRateStd = Math.sqrt(growthRates.reduce((acc, val) => acc + Math.pow(val - avgGrowthRate, 2), 0) / growthRates.length);
      const volatility = Math.abs(avgGrowthRate) > 0 ? growthRateStd / Math.abs(avgGrowthRate) : 0;

      // Simple cyclical pattern detection (based on autocorrelation)
      const cyclicalPattern = this.detectCyclicalPattern(data);

      return {
        trend,
        trendStrength,
        movingAverage,
        growthRates,
        volatility,
        cyclicalPattern
      };
    } catch (error) {
      throw new Error(`Failed to analyze trend: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate comprehensive analysis report
   * @param analyses - Array of analysis configurations
   * @returns Promise resolving when report is created
   */
  async generateAnalysisReport(
    analyses: Array<{
      name: string;
      type: 'descriptive' | 'correlation' | 'trend';
      columnX?: string | number;
      columnY?: string | number;
      options?: any;
    }>
  ): Promise<void> {
    try {
      if (!this.analysisWorksheet) {
        this.createAnalysisWorksheet();
      }

      let currentRow = 1;
      const worksheet = this.analysisWorksheet!;

      // Report header
      worksheet.getCell(`A${currentRow}`).value = 'Data Analysis Report';
      worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 16 };
      worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
      currentRow += 2;

      worksheet.getCell(`A${currentRow}`).value = `Generated on: ${new Date().toLocaleDateString()}`;
      worksheet.getCell(`A${currentRow}`).font = { italic: true };
      currentRow += 3;

      // Process each analysis
      for (const analysis of analyses) {
        currentRow = await this.addAnalysisSection(worksheet, analysis, currentRow);
        currentRow += 2;
      }

      // Auto-fit columns
      for (let col = 1; col <= 6; col++) {
        const column = worksheet.getColumn(col);
        let maxLength = 0;
        column.eachCell({ includeEmpty: false }, (cell) => {
          const cellValue = cell.value?.toString() || '';
          maxLength = Math.max(maxLength, cellValue.length);
        });
        column.width = Math.min(Math.max(maxLength + 2, 12), 30);
      }

    } catch (error) {
      throw new Error(`Failed to generate analysis report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add analysis section to report
   * @param worksheet - Target worksheet
   * @param analysis - Analysis configuration
   * @param startRow - Starting row
   * @returns Next available row
   */
  private async addAnalysisSection(
    worksheet: ExcelJS.Worksheet,
    analysis: any,
    startRow: number
  ): Promise<number> {
    let currentRow = startRow;

    // Section header
    worksheet.getCell(`A${currentRow}`).value = analysis.name;
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
    worksheet.getCell(`A${currentRow}`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    currentRow += 2;

    if (analysis.type === 'descriptive') {
      const data = this.extractNumericColumn(analysis.columnX, analysis.options);
      const stats = this.calculateDescriptiveStats(data);
      
      // Basic statistics
      worksheet.getCell(`A${currentRow}`).value = 'Basic Statistics';
      worksheet.getCell(`A${currentRow}`).font = { bold: true };
      currentRow++;
      
      const basicStats = [
        ['Count', stats.count],
        ['Sum', stats.sum.toFixed(2)],
        ['Mean', stats.mean.toFixed(2)],
        ['Median', stats.median.toFixed(2)],
        ['Mode', stats.mode?.toFixed(2) || 'N/A'],
        ['Min', stats.min.toFixed(2)],
        ['Max', stats.max.toFixed(2)],
        ['Range', stats.range.toFixed(2)]
      ];

      for (const [label, value] of basicStats) {
        worksheet.getCell(`B${currentRow}`).value = label;
        worksheet.getCell(`C${currentRow}`).value = value;
        currentRow++;
      }
      
      currentRow++;
      
      // Variability measures
      worksheet.getCell(`A${currentRow}`).value = 'Variability Measures';
      worksheet.getCell(`A${currentRow}`).font = { bold: true };
      currentRow++;
      
      const variabilityStats = [
        ['Variance', stats.variance.toFixed(2)],
        ['Standard Deviation', stats.standardDeviation.toFixed(2)],
        ['Skewness', stats.skewness.toFixed(2)],
        ['Kurtosis', stats.kurtosis.toFixed(2)]
      ];

      for (const [label, value] of variabilityStats) {
        worksheet.getCell(`B${currentRow}`).value = label;
        worksheet.getCell(`C${currentRow}`).value = value;
        currentRow++;
      }
      
      currentRow++;
      
      // Quartiles and percentiles
      worksheet.getCell(`A${currentRow}`).value = 'Quartiles & Percentiles';
      worksheet.getCell(`A${currentRow}`).font = { bold: true };
      currentRow++;
      
      const quartileStats = [
        ['Q1 (25th percentile)', stats.quartiles.q1.toFixed(2)],
        ['Q2 (50th percentile)', stats.quartiles.q2.toFixed(2)],
        ['Q3 (75th percentile)', stats.quartiles.q3.toFixed(2)],
        ['5th percentile', stats.percentiles.p5.toFixed(2)],
        ['95th percentile', stats.percentiles.p95.toFixed(2)]
      ];

      for (const [label, value] of quartileStats) {
        worksheet.getCell(`B${currentRow}`).value = label;
        worksheet.getCell(`C${currentRow}`).value = value;
        currentRow++;
      }
      
    } else if (analysis.type === 'correlation') {
      const dataX = this.extractNumericColumn(analysis.columnX, analysis.options);
      const dataY = this.extractNumericColumn(analysis.columnY, analysis.options);
      const correlation = this.calculateCorrelation(dataX, dataY);
      
      worksheet.getCell(`A${currentRow}`).value = 'Correlation Analysis';
      worksheet.getCell(`A${currentRow}`).font = { bold: true };
      currentRow++;
      
      const correlationStats = [
        ['Pearson Correlation', correlation.pearsonCorrelation.toFixed(4)],
        ['Spearman Correlation', correlation.spearmanCorrelation.toFixed(4)],
        ['Covariance', correlation.covariance.toFixed(4)],
        ['R-Squared', correlation.rSquared.toFixed(4)],
        ['Linear Regression', correlation.linearRegression.equation]
      ];

      for (const [label, value] of correlationStats) {
        worksheet.getCell(`B${currentRow}`).value = label;
        worksheet.getCell(`C${currentRow}`).value = value;
        currentRow++;
      }
      
    } else if (analysis.type === 'trend') {
      const data = this.extractNumericColumn(analysis.columnX, analysis.options);
      const trend = this.analyzeTrend(data, analysis.options?.periods);
      
      worksheet.getCell(`A${currentRow}`).value = 'Trend Analysis';
      worksheet.getCell(`A${currentRow}`).font = { bold: true };
      currentRow++;
      
      const trendStats = [
        ['Overall Trend', trend.trend],
        ['Trend Strength', trend.trendStrength.toFixed(4)],
        ['Volatility', trend.volatility.toFixed(4)],
        ['Cyclical Pattern', trend.cyclicalPattern ? 'Yes' : 'No'],
        ['Data Points', data.length.toString()],
        ['Moving Average Points', trend.movingAverage.length.toString()]
      ];

      for (const [label, value] of trendStats) {
        worksheet.getCell(`B${currentRow}`).value = label;
        worksheet.getCell(`C${currentRow}`).value = value;
        currentRow++;
      }
    }

    return currentRow;
  }

  /**
   * Save analysis workbook to file
   * @param filename - Output filename
   */
  async saveToFile(filename: string): Promise<void> {
    try {
      await this.workbook.xlsx.writeFile(filename);
    } catch (error) {
      throw new Error(`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get analysis workbook as buffer
   * @returns Buffer containing Excel file
   */
  async toBuffer(): Promise<Buffer> {
    try {
      return await this.workbook.xlsx.writeBuffer() as Buffer;
    } catch (error) {
      throw new Error(`Failed to create buffer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper methods

  private processCellValue(value: any): any {
    if (value === null || value === undefined) return null;
    if (typeof value === 'object' && 'result' in value) return value.result;
    if (value instanceof Date) return value.getTime();
    if (typeof value === 'object' && 'richText' in value) {
      return value.richText.map((rt: any) => rt.text).join('');
    }
    return value;
  }

  private calculatePercentile(sortedData: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedData.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    
    return sortedData[lower] * (1 - weight) + sortedData[upper] * weight;
  }

  private getRanks(data: number[]): number[] {
    const indexed = data.map((value, index) => ({ value, index }));
    indexed.sort((a, b) => a.value - b.value);
    
    const ranks = new Array(data.length);
    for (let i = 0; i < indexed.length; i++) {
      ranks[indexed[i].index] = i + 1;
    }
    
    return ranks;
  }

  private detectCyclicalPattern(data: number[]): boolean {
    if (data.length < 6) return false;
    
    // Simple autocorrelation check at lag 1
    const n = data.length;
    const mean = data.reduce((acc, val) => acc + val, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n - 1; i++) {
      numerator += (data[i] - mean) * (data[i + 1] - mean);
    }
    
    for (let i = 0; i < n; i++) {
      denominator += Math.pow(data[i] - mean, 2);
    }
    
    const autocorrelation = numerator / denominator;
    
    // Consider cyclical if autocorrelation is above threshold
    return Math.abs(autocorrelation) > 0.3;
  }

  /**
   * Example usage for data analysis
   */
  static async example(): Promise<void> {
    const analyzer = new AnalysisExcelTemplate();
    
    try {
      // Load data
      await analyzer.loadFile('sales_data.xlsx');
      analyzer.setSourceWorksheet(0);
      
      // Generate comprehensive analysis report
      await analyzer.generateAnalysisReport([
        {
          name: 'Sales Data Analysis',
          type: 'descriptive',
          columnX: 'C', // Sales column
          options: { skipHeader: true }
        },
        {
          name: 'Price vs Sales Correlation',
          type: 'correlation',
          columnX: 'B', // Price column
          columnY: 'C', // Sales column
          options: { skipHeader: true }
        },
        {
          name: 'Sales Trend Over Time',
          type: 'trend',
          columnX: 'C', // Sales column
          options: { skipHeader: true, periods: 3 }
        }
      ]);
      
      // Save analysis report
      await analyzer.saveToFile('data_analysis_report.xlsx');
      console.log('Data analysis completed!');
      
    } catch (error) {
      console.error('Error performing data analysis:', error);
    }
  }
}

export default AnalysisExcelTemplate;