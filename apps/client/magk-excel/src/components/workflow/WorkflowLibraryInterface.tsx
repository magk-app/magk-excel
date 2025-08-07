/**
 * Workflow Library Interface Component
 * Comprehensive workflow management with categories, search, and templates
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen,
  Clock,
  Star,
  Tag,
  Search,
  Plus,
  Grid,
  List,
  Filter,
  Download,
  Upload,
  Copy,
  Trash2,
  Edit,
  Play,
  Save,
  FileText,
  Archive,
  MoreVertical,
  ChevronRight,
  Calendar,
  User,
  Zap,
  Share2,
  Lock,
  Unlock,
  GitBranch,
  History,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useWorkflowStore, WorkflowType, ExtendedWorkflow } from '@/stores/workflowStore';

// Category definitions
const WORKFLOW_CATEGORIES = [
  { id: 'all', label: 'All Workflows', icon: <Grid className="h-4 w-4" />, color: 'text-gray-600' },
  { id: 'recent', label: 'Recent', icon: <Clock className="h-4 w-4" />, color: 'text-blue-600' },
  { id: 'favorites', label: 'Favorites', icon: <Star className="h-4 w-4" />, color: 'text-yellow-600' },
  { id: 'templates', label: 'Templates', icon: <FileText className="h-4 w-4" />, color: 'text-purple-600' },
  { id: 'shared', label: 'Shared', icon: <Share2 className="h-4 w-4" />, color: 'text-green-600' },
  { id: 'archived', label: 'Archived', icon: <Archive className="h-4 w-4" />, color: 'text-gray-500' }
];

// Filter options
const FILTER_OPTIONS = {
  type: ['All', 'Temporary', 'Permanent'],
  status: ['All', 'Draft', 'Ready', 'Running', 'Completed', 'Error'],
  dateRange: ['All Time', 'Today', 'This Week', 'This Month', 'Last 3 Months']
};

interface WorkflowLibraryInterfaceProps {
  onWorkflowSelect?: (workflow: ExtendedWorkflow) => void;
  onWorkflowCreate?: () => void;
  onWorkflowExecute?: (workflowId: string) => void;
  selectedWorkflowId?: string;
  viewMode?: 'grid' | 'list';
  className?: string;
}

export const WorkflowLibraryInterface: React.FC<WorkflowLibraryInterfaceProps> = ({
  onWorkflowSelect,
  onWorkflowCreate,
  onWorkflowExecute,
  selectedWorkflowId,
  viewMode: initialViewMode = 'grid',
  className
}) => {
  const {
    temporaryWorkflows,
    permanentWorkflows,
    templates,
    loadWorkflow,
    deleteWorkflow,
    duplicateWorkflow,
    convertToPermament,
    saveAsTemplate,
    exportWorkflow,
    importWorkflow,
    getRecentWorkflows,
    searchWorkflows
  } = useWorkflowStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode);
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDateRange, setFilterDateRange] = useState('All Time');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedWorkflows, setSelectedWorkflows] = useState<Set<string>>(new Set());
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Combine all workflows
  const allWorkflows = useMemo(() => {
    const workflows: ExtendedWorkflow[] = [
      ...Array.from(temporaryWorkflows.values()),
      ...Array.from(permanentWorkflows.values())
    ];

    if (selectedCategory === 'templates') {
      return Array.from(templates.values());
    }

    if (selectedCategory === 'recent') {
      return getRecentWorkflows(20);
    }

    return workflows;
  }, [temporaryWorkflows, permanentWorkflows, templates, selectedCategory, getRecentWorkflows]);

  // Filter workflows
  const filteredWorkflows = useMemo(() => {
    let filtered = allWorkflows;

    // Search filter
    if (searchQuery) {
      filtered = searchWorkflows(searchQuery);
    }

    // Type filter
    if (filterType !== 'All') {
      const typeValue = filterType === 'Temporary' ? WorkflowType.TEMPORARY : WorkflowType.PERMANENT;
      filtered = filtered.filter(w => w.type === typeValue);
    }

    // Status filter
    if (filterStatus !== 'All') {
      filtered = filtered.filter(w => w.status === filterStatus.toLowerCase());
    }

    // Date range filter
    if (filterDateRange !== 'All Time') {
      const now = new Date();
      let cutoffDate = new Date();
      
      switch (filterDateRange) {
        case 'Today':
          cutoffDate.setDate(now.getDate() - 1);
          break;
        case 'This Week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'This Month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'Last 3 Months':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      filtered = filtered.filter(w => w.metadata.modified >= cutoffDate);
    }

    return filtered;
  }, [allWorkflows, searchQuery, filterType, filterStatus, filterDateRange, searchWorkflows]);

  // Group workflows by category
  const groupedWorkflows = useMemo(() => {
    const groups: Record<string, ExtendedWorkflow[]> = {
      today: [],
      thisWeek: [],
      older: []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);

    filteredWorkflows.forEach(workflow => {
      const modified = new Date(workflow.metadata.modified);
      if (modified >= today) {
        groups.today.push(workflow);
      } else if (modified >= weekAgo) {
        groups.thisWeek.push(workflow);
      } else {
        groups.older.push(workflow);
      }
    });

    return groups;
  }, [filteredWorkflows]);

  // Workflow actions
  const handleWorkflowAction = useCallback((action: string, workflowId: string) => {
    switch (action) {
      case 'open':
        loadWorkflow(workflowId);
        const workflow = allWorkflows.find(w => w.id === workflowId);
        if (workflow) onWorkflowSelect?.(workflow);
        break;
      case 'execute':
        onWorkflowExecute?.(workflowId);
        break;
      case 'duplicate':
        duplicateWorkflow(workflowId);
        break;
      case 'convert':
        convertToPermament(workflowId);
        break;
      case 'template':
        const workflowToTemplate = allWorkflows.find(w => w.id === workflowId);
        if (workflowToTemplate) {
          saveAsTemplate(workflowId, `${workflowToTemplate.name} Template`);
        }
        break;
      case 'export':
        const workflowToExport = exportWorkflow(workflowId);
        // Create download link
        const dataStr = JSON.stringify(workflowToExport, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `${workflowToExport.name}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        break;
      case 'delete':
        deleteWorkflow(workflowId);
        break;
    }
  }, [allWorkflows, loadWorkflow, onWorkflowSelect, onWorkflowExecute, duplicateWorkflow, convertToPermament, saveAsTemplate, exportWorkflow, deleteWorkflow]);

  // Bulk actions
  const handleBulkAction = useCallback((action: string) => {
    selectedWorkflows.forEach(workflowId => {
      handleWorkflowAction(action, workflowId);
    });
    setSelectedWorkflows(new Set());
  }, [selectedWorkflows, handleWorkflowAction]);

  // Import workflow
  const handleImportWorkflow = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workflow = JSON.parse(e.target?.result as string) as ExtendedWorkflow;
        importWorkflow(workflow);
        setShowImportDialog(false);
      } catch (error) {
        console.error('Failed to import workflow:', error);
      }
    };
    reader.readAsText(file);
  }, [importWorkflow]);

  // Get workflow type badge
  const getWorkflowTypeBadge = (workflow: ExtendedWorkflow) => {
    if (workflow.isTemplate) {
      return <Badge variant="outline" className="text-xs"><FileText className="h-3 w-3 mr-1" />Template</Badge>;
    }
    if (workflow.type === WorkflowType.TEMPORARY) {
      return <Badge variant="secondary" className="text-xs"><Clock className="h-3 w-3 mr-1" />Temporary</Badge>;
    }
    return <Badge variant="default" className="text-xs"><Lock className="h-3 w-3 mr-1" />Permanent</Badge>;
  };

  // Get workflow status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-gray-500';
      case 'ready': return 'text-green-500';
      case 'running': return 'text-blue-500';
      case 'completed': return 'text-green-600';
      case 'error': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  // Render workflow card
  const renderWorkflowCard = (workflow: ExtendedWorkflow) => (
    <motion.div
      key={workflow.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'relative cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]',
          selectedWorkflowId === workflow.id && 'ring-2 ring-primary',
          selectedWorkflows.has(workflow.id) && 'bg-accent/50',
          'group'
        )}
        onClick={() => handleWorkflowAction('open', workflow.id)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-sm line-clamp-1">{workflow.name}</CardTitle>
              <CardDescription className="text-xs line-clamp-2 mt-1">
                {workflow.description || 'No description available'}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleWorkflowAction('open', workflow.id); }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Open
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleWorkflowAction('execute', workflow.id); }}>
                  <Play className="h-4 w-4 mr-2" />
                  Execute
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleWorkflowAction('duplicate', workflow.id); }}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                {workflow.type === WorkflowType.TEMPORARY && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleWorkflowAction('convert', workflow.id); }}>
                    <Lock className="h-4 w-4 mr-2" />
                    Convert to Permanent
                  </DropdownMenuItem>
                )}
                {!workflow.isTemplate && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleWorkflowAction('template', workflow.id); }}>
                    <FileText className="h-4 w-4 mr-2" />
                    Save as Template
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleWorkflowAction('export', workflow.id); }}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); handleWorkflowAction('delete', workflow.id); }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between mb-3">
            {getWorkflowTypeBadge(workflow)}
            <span className={cn('text-xs font-medium capitalize', getStatusColor(workflow.status))}>
              {workflow.status}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-1 mb-3">
            {workflow.metadata.tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs py-0">
                <Tag className="h-2 w-2 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(workflow.metadata.modified).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {workflow.nodes.length} nodes
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  // Render workflow list item
  const renderWorkflowListItem = (workflow: ExtendedWorkflow) => (
    <motion.div
      key={workflow.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className={cn(
          'flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/50 cursor-pointer transition-all',
          selectedWorkflowId === workflow.id && 'bg-accent border-primary',
          selectedWorkflows.has(workflow.id) && 'bg-accent/30',
          'group'
        )}
        onClick={() => handleWorkflowAction('open', workflow.id)}
      >
        <input
          type="checkbox"
          checked={selectedWorkflows.has(workflow.id)}
          onChange={(e) => {
            e.stopPropagation();
            const newSelection = new Set(selectedWorkflows);
            if (e.target.checked) {
              newSelection.add(workflow.id);
            } else {
              newSelection.delete(workflow.id);
            }
            setSelectedWorkflows(newSelection);
          }}
          className="h-4 w-4 rounded border-gray-300"
          onClick={(e) => e.stopPropagation()}
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm truncate">{workflow.name}</h4>
            {getWorkflowTypeBadge(workflow)}
            <span className={cn('text-xs font-medium capitalize', getStatusColor(workflow.status))}>
              {workflow.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {workflow.description || 'No description available'}
          </p>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex gap-1">
              {workflow.metadata.tags.slice(0, 3).map((tag, idx) => (
                <Badge key={idx} variant="outline" className="text-xs py-0">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(workflow.metadata.modified).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Zap className="h-3 w-3" />
              {workflow.nodes.length} nodes
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={(e) => { e.stopPropagation(); handleWorkflowAction('execute', workflow.id); }}
                >
                  <Play className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Execute Workflow</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleWorkflowAction('open', workflow.id); }}>
                <Edit className="h-4 w-4 mr-2" />
                Open
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleWorkflowAction('duplicate', workflow.id); }}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              {workflow.type === WorkflowType.TEMPORARY && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleWorkflowAction('convert', workflow.id); }}>
                  <Lock className="h-4 w-4 mr-2" />
                  Convert to Permanent
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleWorkflowAction('export', workflow.id); }}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); handleWorkflowAction('delete', workflow.id); }}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Workflow Library</h2>
          <div className="flex gap-2">
            <Button onClick={onWorkflowCreate}>
              <Plus className="h-4 w-4 mr-1" />
              New Workflow
            </Button>
            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-1" />
                  Import
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Workflow</DialogTitle>
                  <DialogDescription>
                    Select a workflow JSON file to import
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImportWorkflow(file);
                    }}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Search and View Controls */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant={showFilters ? 'default' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className="px-3"
          >
            <Filter className="h-4 w-4" />
          </Button>
          <div className="flex gap-1 border rounded-md">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              onClick={() => setViewMode('grid')}
              className="h-9 px-3 rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              onClick={() => setViewMode('list')}
              className="h-9 px-3 rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 mt-3 pt-3 border-t">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-1 text-sm border rounded-md"
                >
                  {FILTER_OPTIONS.type.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1 text-sm border rounded-md"
                >
                  {FILTER_OPTIONS.status.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <select
                  value={filterDateRange}
                  onChange={(e) => setFilterDateRange(e.target.value)}
                  className="px-3 py-1 text-sm border rounded-md"
                >
                  {FILTER_OPTIONS.dateRange.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setFilterType('All');
                    setFilterStatus('All');
                    setFilterDateRange('All Time');
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedWorkflows.size > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b bg-accent/50"
          >
            <div className="flex items-center justify-between p-3">
              <span className="text-sm font-medium">
                {selectedWorkflows.size} workflow{selectedWorkflows.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('export')}>
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('duplicate')}>
                  <Copy className="h-4 w-4 mr-1" />
                  Duplicate
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => handleBulkAction('delete')}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setSelectedWorkflows(new Set())}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Categories */}
        <div className="w-48 border-r bg-muted/30">
          <ScrollArea className="h-full">
            <div className="p-3">
              <h3 className="text-xs font-semibold text-muted-foreground mb-2">CATEGORIES</h3>
              <div className="space-y-1">
                {WORKFLOW_CATEGORIES.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
                      selectedCategory === category.id 
                        ? 'bg-accent text-accent-foreground' 
                        : 'hover:bg-accent/50'
                    )}
                  >
                    <span className={category.color}>{category.icon}</span>
                    <span className="flex-1 text-left">{category.label}</span>
                    <Badge variant="outline" className="text-xs">
                      {category.id === 'all' ? filteredWorkflows.length :
                       category.id === 'templates' ? templates.size :
                       category.id === 'recent' ? Math.min(20, filteredWorkflows.length) :
                       0}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Workflow List */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {filteredWorkflows.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm font-medium">No workflows found</p>
                <p className="text-xs mt-1">Try adjusting your filters or create a new workflow</p>
                <Button className="mt-4" onClick={onWorkflowCreate}>
                  <Plus className="h-4 w-4 mr-1" />
                  Create Workflow
                </Button>
              </div>
            ) : viewMode === 'list' ? (
              <div className="space-y-2">
                {/* Today's workflows */}
                {groupedWorkflows.today.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">TODAY</h3>
                    {groupedWorkflows.today.map(renderWorkflowListItem)}
                  </div>
                )}
                
                {/* This week's workflows */}
                {groupedWorkflows.thisWeek.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">THIS WEEK</h3>
                    {groupedWorkflows.thisWeek.map(renderWorkflowListItem)}
                  </div>
                )}
                
                {/* Older workflows */}
                {groupedWorkflows.older.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">OLDER</h3>
                    {groupedWorkflows.older.map(renderWorkflowListItem)}
                  </div>
                )}
              </div>
            ) : (
              <div>
                {/* Today's workflows */}
                {groupedWorkflows.today.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">TODAY</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {groupedWorkflows.today.map(renderWorkflowCard)}
                    </div>
                  </div>
                )}
                
                {/* This week's workflows */}
                {groupedWorkflows.thisWeek.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">THIS WEEK</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {groupedWorkflows.thisWeek.map(renderWorkflowCard)}
                    </div>
                  </div>
                )}
                
                {/* Older workflows */}
                {groupedWorkflows.older.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">OLDER</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {groupedWorkflows.older.map(renderWorkflowCard)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default WorkflowLibraryInterface;