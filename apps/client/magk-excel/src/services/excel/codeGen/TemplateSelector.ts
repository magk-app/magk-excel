/**
 * Template selection logic for Excel operations
 * Analyzes user intent and selects the most appropriate template
 */
export class TemplateSelector {

  /**
   * Template definitions with their characteristics
   */
  private static readonly TEMPLATES = {
    read: {
      keywords: [
        'read', 'load', 'import', 'extract', 'open', 'parse', 'get data',
        'fetch', 'retrieve', 'access', 'view', 'examine', 'analyze existing'
      ],
      patterns: [
        /read.*(?:excel|xlsx|xls|spreadsheet|file)/i,
        /load.*(?:data|file|spreadsheet)/i,
        /import.*(?:from|excel|csv)/i,
        /extract.*(?:data|information)/i,
        /get.*(?:data|information).*(?:from|out of)/i
      ],
      confidence: 0,
      description: 'Reading and extracting data from existing Excel files'
    },
    
    write: {
      keywords: [
        'create', 'generate', 'make', 'build', 'new', 'write', 'save',
        'export', 'produce', 'construct', 'develop', 'establish'
      ],
      patterns: [
        /create.*(?:excel|spreadsheet|file|workbook)/i,
        /generate.*(?:report|excel|spreadsheet)/i,
        /make.*(?:new|excel|spreadsheet)/i,
        /(?:new|fresh).*(?:excel|spreadsheet|file)/i,
        /write.*(?:to|excel|file|spreadsheet)/i,
        /save.*(?:as|to).*(?:excel|xlsx)/i
      ],
      confidence: 0,
      description: 'Creating new Excel files from scratch'
    },
    
    update: {
      keywords: [
        'update', 'modify', 'change', 'edit', 'alter', 'revise', 'amend',
        'adjust', 'correct', 'fix', 'replace', 'insert', 'add to existing'
      ],
      patterns: [
        /update.*(?:excel|spreadsheet|file|data)/i,
        /modify.*(?:existing|current|spreadsheet)/i,
        /change.*(?:values|data|cells)/i,
        /edit.*(?:excel|spreadsheet|file)/i,
        /(?:add|insert).*(?:row|column|data).*(?:to|into)/i,
        /replace.*(?:values|data|content)/i
      ],
      confidence: 0,
      description: 'Updating and modifying existing Excel files'
    },
    
    transform: {
      keywords: [
        'transform', 'convert', 'process', 'manipulate', 'reorganize',
        'restructure', 'filter', 'sort', 'group', 'aggregate', 'pivot',
        'clean', 'normalize', 'format data'
      ],
      patterns: [
        /(?:transform|convert).*data/i,
        /(?:filter|sort|group).*(?:data|by)/i,
        /(?:pivot|aggregate|summarize).*data/i,
        /(?:clean|normalize|process).*(?:data|spreadsheet)/i,
        /(?:restructure|reorganize).*(?:data|format)/i,
        /calculate.*(?:totals|sums|averages)/i
      ],
      confidence: 0,
      description: 'Transforming and processing Excel data'
    },
    
    analysis: {
      keywords: [
        'analyze', 'analysis', 'statistics', 'stats', 'summary', 'report',
        'insights', 'trends', 'correlation', 'compare', 'evaluate',
        'assess', 'measure', 'calculate stats', 'data analysis'
      ],
      patterns: [
        /(?:analyze|analysis).*data/i,
        /(?:statistics|stats|statistical)/i,
        /(?:summary|summarize).*(?:data|report)/i,
        /(?:correlation|trend).*analysis/i,
        /(?:insights|patterns).*(?:from|in).*data/i,
        /(?:calculate|compute).*(?:statistics|metrics)/i
      ],
      confidence: 0,
      description: 'Performing statistical analysis and generating reports'
    },
    
    pdf_to_excel: {
      keywords: [
        'pdf', 'convert pdf', 'extract from pdf', 'pdf to excel',
        'pdf tables', 'pdf data', 'import pdf', 'pdf extraction'
      ],
      patterns: [
        /(?:convert|extract).*pdf.*(?:to|into).*excel/i,
        /pdf.*(?:to|into).*(?:excel|spreadsheet)/i,
        /(?:extract|get).*(?:data|tables).*(?:from|out of).*pdf/i,
        /import.*pdf.*(?:data|tables)/i,
        /pdf.*(?:extraction|conversion)/i
      ],
      confidence: 0,
      description: 'Converting PDF content to Excel format'
    }
  };

  /**
   * Select the most appropriate template based on user intent
   * @param intent - Analyzed user intent
   * @returns Template selection result
   */
  static selectTemplate(intent: any): {
    template: string;
    confidence: number;
    reasoning: string;
    alternatives: Array<{ template: string; confidence: number }>;
  } {
    const scores: Record<string, number> = {};
    const reasoningDetails: Record<string, string[]> = {};

    // Calculate scores for each template
    for (const [templateName, templateDef] of Object.entries(this.TEMPLATES)) {
      scores[templateName] = 0;
      reasoningDetails[templateName] = [];

      // Direct operation match (highest priority)
      if (intent.operation === templateName) {
        scores[templateName] += 50;
        reasoningDetails[templateName].push(`Direct operation match: ${intent.operation}`);
      }

      // Keyword matching
      const keywordScore = this.calculateKeywordScore(intent, templateDef.keywords);
      scores[templateName] += keywordScore;
      if (keywordScore > 0) {
        reasoningDetails[templateName].push(`Keyword matches (${keywordScore} points)`);
      }

      // Pattern matching
      const patternScore = this.calculatePatternScore(intent, templateDef.patterns);
      scores[templateName] += patternScore;
      if (patternScore > 0) {
        reasoningDetails[templateName].push(`Pattern matches (${patternScore} points)`);
      }

      // Context-based scoring
      const contextScore = this.calculateContextScore(intent, templateName);
      scores[templateName] += contextScore;
      if (contextScore > 0) {
        reasoningDetails[templateName].push(`Context matches (${contextScore} points)`);
      }

      // Feature-based scoring
      const featureScore = this.calculateFeatureScore(intent, templateName);
      scores[templateName] += featureScore;
      if (featureScore > 0) {
        reasoningDetails[templateName].push(`Feature matches (${featureScore} points)`);
      }
    }

    // Sort templates by score
    const sortedTemplates = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .map(([template, score]) => ({
        template,
        confidence: Math.min(score / 100, 1.0) // Normalize to 0-1
      }));

    const selectedTemplate = sortedTemplates[0];
    const alternatives = sortedTemplates.slice(1, 4); // Top 3 alternatives

    return {
      template: selectedTemplate.template,
      confidence: selectedTemplate.confidence,
      reasoning: this.buildReasoning(
        selectedTemplate.template,
        reasoningDetails[selectedTemplate.template],
        selectedTemplate.confidence
      ),
      alternatives
    };
  }

  /**
   * Calculate keyword-based score
   * @param intent - User intent
   * @param keywords - Template keywords
   * @returns Keyword score
   */
  private static calculateKeywordScore(intent: any, keywords: string[]): number {
    let score = 0;
    const promptLower = (intent.prompt || '').toLowerCase();
    
    for (const keyword of keywords) {
      if (promptLower.includes(keyword.toLowerCase())) {
        score += keyword.split(' ').length; // Multi-word keywords get higher scores
      }
    }
    
    return Math.min(score * 5, 30); // Cap at 30 points
  }

  /**
   * Calculate pattern-based score
   * @param intent - User intent
   * @param patterns - Template regex patterns
   * @returns Pattern score
   */
  private static calculatePatternScore(intent: any, patterns: RegExp[]): number {
    let score = 0;
    const prompt = intent.prompt || '';
    
    for (const pattern of patterns) {
      if (pattern.test(prompt)) {
        score += 10; // Each pattern match is worth 10 points
      }
    }
    
    return Math.min(score, 40); // Cap at 40 points
  }

  /**
   * Calculate context-based score
   * @param intent - User intent
   * @param templateName - Template name
   * @returns Context score
   */
  private static calculateContextScore(intent: any, templateName: string): number {
    let score = 0;

    switch (templateName) {
      case 'read':
        if (intent.dataSource && !intent.targetFile) score += 15;
        if (intent.columns && intent.columns.length > 0) score += 10;
        if (!intent.transformations || intent.transformations.length === 0) score += 5;
        break;

      case 'write':
        if (intent.targetFile && !intent.dataSource) score += 15;
        if (intent.parameters.includeHeaders) score += 5;
        if (intent.formatting) score += 10;
        break;

      case 'update':
        if (intent.dataSource && intent.targetFile) score += 15;
        if (intent.dataSource === intent.targetFile) score += 10;
        break;

      case 'transform':
        if (intent.transformations && intent.transformations.length > 0) score += 20;
        if (intent.dataSource && intent.targetFile) score += 10;
        break;

      case 'analysis':
        if (intent.analysis && intent.analysis.length > 0) score += 20;
        if (intent.parameters.includeSum || intent.parameters.includeAverage) score += 10;
        break;

      case 'pdf_to_excel':
        if (intent.parameters.sourceType === 'pdf') score += 25;
        if (intent.parameters.fileType === 'xlsx') score += 5;
        break;
    }

    return score;
  }

  /**
   * Calculate feature-based score
   * @param intent - User intent
   * @param templateName - Template name
   * @returns Feature score
   */
  private static calculateFeatureScore(intent: any, templateName: string): number {
    let score = 0;

    // Check for specific feature indicators
    const features = {
      hasFilters: intent.transformations?.some((t: any) => t.type === 'filter'),
      hasSorting: intent.transformations?.some((t: any) => t.type === 'sort'),
      hasGrouping: intent.transformations?.some((t: any) => t.type === 'group'),
      hasPivot: intent.transformations?.some((t: any) => t.type === 'pivot'),
      hasAnalysis: intent.analysis?.length > 0,
      hasFormatting: !!intent.formatting,
      hasCharts: intent.parameters.includeChart,
      isNewFile: !intent.dataSource,
      isExistingFile: !!intent.dataSource,
      isPDFSource: intent.parameters.sourceType === 'pdf'
    };

    switch (templateName) {
      case 'read':
        if (features.isExistingFile && !features.hasFilters && !features.hasGrouping) score += 10;
        break;

      case 'write':
        if (features.isNewFile || features.hasFormatting) score += 10;
        if (features.hasCharts) score += 15;
        break;

      case 'update':
        if (features.isExistingFile && !features.hasAnalysis) score += 10;
        break;

      case 'transform':
        if (features.hasFilters) score += 15;
        if (features.hasSorting) score += 15;
        if (features.hasGrouping) score += 20;
        if (features.hasPivot) score += 25;
        break;

      case 'analysis':
        if (features.hasAnalysis) score += 25;
        if (features.hasGrouping && features.hasAnalysis) score += 10;
        break;

      case 'pdf_to_excel':
        if (features.isPDFSource) score += 30;
        break;
    }

    return score;
  }

  /**
   * Build reasoning explanation
   * @param templateName - Selected template
   * @param reasons - List of reasoning factors
   * @param confidence - Confidence score
   * @returns Formatted reasoning
   */
  private static buildReasoning(
    templateName: string,
    reasons: string[],
    confidence: number
  ): string {
    const templateDesc = this.TEMPLATES[templateName as keyof typeof this.TEMPLATES]?.description || 'Unknown template';
    
    let reasoning = `Selected '${templateName}' template (${Math.round(confidence * 100)}% confidence) for ${templateDesc}.`;
    
    if (reasons.length > 0) {
      reasoning += '\n\nFactors considered:\n';
      reasons.forEach((reason, index) => {
        reasoning += `${index + 1}. ${reason}\n`;
      });
    }

    // Add confidence interpretation
    if (confidence >= 0.8) {
      reasoning += '\nHigh confidence: Template selection is very likely correct.';
    } else if (confidence >= 0.6) {
      reasoning += '\nModerate confidence: Template selection is likely correct, but consider reviewing alternatives.';
    } else if (confidence >= 0.4) {
      reasoning += '\nLow confidence: Template selection is uncertain, strongly consider alternatives.';
    } else {
      reasoning += '\nVery low confidence: Template selection may not be optimal, manual review recommended.';
    }

    return reasoning;
  }

  /**
   * Suggest template based on file operations
   * @param hasInputFile - Whether input file is specified
   * @param hasOutputFile - Whether output file is specified
   * @param operations - List of operations detected
   * @returns Template suggestions
   */
  static suggestByFileOperations(
    hasInputFile: boolean,
    hasOutputFile: boolean,
    operations: string[]
  ): Array<{ template: string; reason: string; confidence: number }> {
    const suggestions: Array<{ template: string; reason: string; confidence: number }> = [];

    if (!hasInputFile && hasOutputFile) {
      suggestions.push({
        template: 'write',
        reason: 'No input file specified, but output file exists - likely creating new file',
        confidence: 0.8
      });
    }

    if (hasInputFile && !hasOutputFile) {
      suggestions.push({
        template: 'read',
        reason: 'Input file specified without output - likely reading existing file',
        confidence: 0.7
      });
    }

    if (hasInputFile && hasOutputFile) {
      if (operations.includes('transform')) {
        suggestions.push({
          template: 'transform',
          reason: 'Input and output files with transformation operations',
          confidence: 0.9
        });
      } else if (operations.includes('analysis')) {
        suggestions.push({
          template: 'analysis',
          reason: 'Input and output files with analysis operations',
          confidence: 0.8
        });
      } else {
        suggestions.push({
          template: 'update',
          reason: 'Input and output files specified - likely updating existing data',
          confidence: 0.6
        });
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get template recommendations based on data characteristics
   * @param dataInfo - Information about the data
   * @returns Template recommendations
   */
  static recommendByDataType(dataInfo: {
    hasNumericData?: boolean;
    hasDateData?: boolean;
    hasCategories?: boolean;
    recordCount?: number;
    columnCount?: number;
    dataComplexity?: 'simple' | 'moderate' | 'complex';
  }): Array<{ template: string; reason: string; suitability: number }> {
    const recommendations: Array<{ template: string; reason: string; suitability: number }> = [];

    const {
      hasNumericData = false,
      hasDateData = false,
      hasCategories = false,
      recordCount = 0,
      columnCount = 0,
      dataComplexity = 'simple'
    } = dataInfo;

    // Analysis template suitability
    if (hasNumericData && recordCount > 10) {
      recommendations.push({
        template: 'analysis',
        reason: 'Numeric data with sufficient records for statistical analysis',
        suitability: hasDateData ? 0.9 : 0.8
      });
    }

    // Transform template suitability
    if (hasCategories && recordCount > 5) {
      recommendations.push({
        template: 'transform',
        reason: 'Categorical data suitable for grouping and aggregation',
        suitability: 0.8
      });
    }

    // Write template suitability
    if (dataComplexity === 'simple' && columnCount <= 10) {
      recommendations.push({
        template: 'write',
        reason: 'Simple data structure suitable for basic Excel creation',
        suitability: 0.7
      });
    }

    // Read template suitability (always applicable)
    recommendations.push({
      template: 'read',
      reason: 'Reading data is suitable for any data structure',
      suitability: 0.6
    });

    return recommendations.sort((a, b) => b.suitability - a.suitability);
  }

  /**
   * Example usage of template selector
   */
  static exampleUsage(): void {
    console.log('Template Selector Examples:');
    
    const testCases = [
      {
        prompt: 'Read sales data from quarterly_report.xlsx',
        operation: 'read',
        dataSource: 'quarterly_report.xlsx'
      },
      {
        prompt: 'Create a new Excel file with customer information',
        operation: 'write',
        targetFile: 'customers.xlsx'
      },
      {
        prompt: 'Update existing inventory.xlsx with new stock levels',
        operation: 'update',
        dataSource: 'inventory.xlsx'
      },
      {
        prompt: 'Transform sales data by grouping by region and calculating totals',
        operation: 'transform',
        transformations: [{ type: 'group' }]
      },
      {
        prompt: 'Analyze financial data and generate statistics report',
        operation: 'analysis',
        analysis: [{ type: 'descriptive' }]
      }
    ];

    testCases.forEach((testCase, index) => {
      console.log(`\nTest Case ${index + 1}: "${testCase.prompt}"`);
      const result = TemplateSelector.selectTemplate(testCase);
      console.log(`Selected: ${result.template} (${Math.round(result.confidence * 100)}% confidence)`);
      console.log(`Reasoning: ${result.reasoning.split('\n')[0]}`);
    });
  }
}

export default TemplateSelector;