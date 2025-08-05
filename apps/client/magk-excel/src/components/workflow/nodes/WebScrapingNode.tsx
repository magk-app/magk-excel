/**
 * Web Scraping Node - Extract data from websites using Firecrawl MCP
 * Specialized for Excel workflow data extraction
 */

import React from 'react';
import { NodeProps } from 'reactflow';
import { Globe, Table, FileText, Layout, Activity, Clock, Search } from 'lucide-react';

import { Progress } from '@/components/ui/progress';
import { WebScrapingConfig, WorkflowNodeData } from '@/types/workflow';
import { BaseWorkflowNode } from '../BaseWorkflowNode';
import { cn } from '@/lib/utils';

interface WebScrapingNodeData extends WorkflowNodeData {
  config: WebScrapingConfig;
}

interface WebScrapingNodeProps extends NodeProps {
  data: WebScrapingNodeData;
}

// Format type icons
const FormatIcon: React.FC<{ format: WebScrapingConfig['extractFormat'] }> = ({ format }) => {
  const iconProps = { className: 'h-3 w-3' };
  
  switch (format) {
    case 'table':
      return <Table {...iconProps} />;
    case 'list':
      return <Layout {...iconProps} />;
    case 'text':
      return <FileText {...iconProps} />;
    case 'structured':
      return <Search {...iconProps} />;
    default:
      return <Globe {...iconProps} />;
  }
};

export const WebScrapingNode: React.FC<WebScrapingNodeProps> = (props) => {
  const { data } = props;
  const config = data.config as WebScrapingConfig;

  // Enhanced data with web scraping specific information
  const enhancedData: WebScrapingNodeData = {
    ...data,
    config: {
      ...config,
      description: config.description || `Extract ${config.extractFormat} data from ${config.url}`
    }
  };

  // Web scraping specific progress stages
  const getScrapingProgress = () => {
    if (data.status === 'running' && data.progress) {
      const stages = data.progress.stages || [];
      const pageLoadStage = stages.find(s => s.name === 'Loading page');
      const extractionStage = stages.find(s => s.name === 'Extracting data');
      
      return {
        pageLoading: pageLoadStage?.status === 'running',
        dataExtraction: extractionStage?.status === 'running',
        progress: data.progress
      };
    }
    return null;
  };

  const scrapingProgress = getScrapingProgress();

  return (
    <div className="relative">
      <BaseWorkflowNode {...props} data={enhancedData} />
      


      {/* URL display at bottom */}
      <div className="absolute -bottom-6 left-0 right-0 text-xs text-muted-foreground text-center truncate">
        <Globe className="inline h-3 w-3 mr-1" />
        {new URL(config.url).hostname}
      </div>



      {/* Progress overlay completely removed - handled by base node */}
    </div>
  );
};

export default WebScrapingNode;