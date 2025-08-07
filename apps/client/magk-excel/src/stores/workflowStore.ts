/**
 * Workflow Store
 * State management for dual workflow types (temporary and permanent) using Zustand
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import { WorkflowNode, WorkflowEdge, Workflow, NodeStatus } from '@/types/workflow';

// Workflow type enum
export enum WorkflowType {
  TEMPORARY = 'temporary',
  PERMANENT = 'permanent'
}

// Extended workflow interface with type
export interface ExtendedWorkflow extends Workflow {
  type: WorkflowType;
  chatSessionId?: string; // Associated chat session for temporary workflows
  isTemplate?: boolean;
  version?: number;
  parentId?: string; // For versioning
  lastModifiedBy?: string;
}

// Workflow execution state
export interface WorkflowExecutionState {
  workflowId: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  startTime?: Date;
  endTime?: Date;
  currentNodeId?: string;
  progress: number; // 0-100
  logs: Array<{
    timestamp: Date;
    message: string;
    level: 'info' | 'warning' | 'error';
    nodeId?: string;
  }>;
}

// Workflow store state
export interface WorkflowStoreState {
  // Workflows
  temporaryWorkflows: Map<string, ExtendedWorkflow>;
  permanentWorkflows: Map<string, ExtendedWorkflow>;
  templates: Map<string, ExtendedWorkflow>;
  
  // Active workflow
  activeWorkflowId: string | null;
  activeWorkflow: ExtendedWorkflow | null;
  
  // Execution state
  executionStates: Map<string, WorkflowExecutionState>;
  
  // UI state
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  isEditing: boolean;
  isDirty: boolean;
  
  // Actions - Workflow Management
  createWorkflow: (name: string, type: WorkflowType, chatSessionId?: string) => string;
  loadWorkflow: (id: string) => void;
  saveWorkflow: (id: string) => void;
  deleteWorkflow: (id: string) => void;
  duplicateWorkflow: (id: string) => string;
  convertToPermament: (temporaryId: string) => string;
  exportWorkflow: (id: string) => ExtendedWorkflow;
  importWorkflow: (workflow: ExtendedWorkflow) => string;
  
  // Actions - Node Management
  addNode: (node: WorkflowNode) => void;
  updateNode: (nodeId: string, updates: Partial<WorkflowNode>) => void;
  deleteNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => string;
  
  // Actions - Edge Management
  addEdge: (edge: WorkflowEdge) => void;
  updateEdge: (edgeId: string, updates: Partial<WorkflowEdge>) => void;
  deleteEdge: (edgeId: string) => void;
  
  // Actions - Execution
  startExecution: (workflowId: string) => void;
  pauseExecution: (workflowId: string) => void;
  stopExecution: (workflowId: string) => void;
  updateNodeStatus: (workflowId: string, nodeId: string, status: NodeStatus) => void;
  addExecutionLog: (workflowId: string, message: string, level: 'info' | 'warning' | 'error', nodeId?: string) => void;
  
  // Actions - Templates
  saveAsTemplate: (workflowId: string, name: string) => string;
  createFromTemplate: (templateId: string, name: string, type: WorkflowType) => string;
  
  // Actions - Version Control
  createVersion: (workflowId: string) => string;
  revertToVersion: (workflowId: string, versionId: string) => void;
  
  // Actions - UI State
  selectNode: (nodeId: string | null) => void;
  selectEdge: (edgeId: string | null) => void;
  setEditing: (isEditing: boolean) => void;
  setDirty: (isDirty: boolean) => void;
  
  // Actions - Bulk Operations
  clearTemporaryWorkflows: (olderThan?: Date) => void;
  exportAllWorkflows: () => ExtendedWorkflow[];
  importBulkWorkflows: (workflows: ExtendedWorkflow[]) => void;
  
  // Getters
  getWorkflowById: (id: string) => ExtendedWorkflow | undefined;
  getWorkflowsByChatSession: (chatSessionId: string) => ExtendedWorkflow[];
  getWorkflowsByCategory: (category: string) => ExtendedWorkflow[];
  getRecentWorkflows: (limit: number) => ExtendedWorkflow[];
  searchWorkflows: (query: string) => ExtendedWorkflow[];
}

// Create the workflow store WITHOUT persist for now to fix the issue
export const useWorkflowStore = create<WorkflowStoreState>()(
  immer((set, get) => ({
    // Initial state
    temporaryWorkflows: new Map(),
    permanentWorkflows: new Map(),
    templates: new Map(),
    activeWorkflowId: null,
    activeWorkflow: null,
    executionStates: new Map(),
    selectedNodeId: null,
    selectedEdgeId: null,
    isEditing: false,
    isDirty: false,

    // Workflow Management
    createWorkflow: (name, type, chatSessionId) => {
      console.log('🔧 Creating workflow:', { name, type, chatSessionId });
      const id = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const workflow: ExtendedWorkflow = {
        id,
        name,
        type,
        chatSessionId,
        nodes: [],
        edges: [],
        status: 'draft',
        metadata: {
          created: new Date(),
          modified: new Date(),
          tags: [],
          category: 'general'
        },
        version: 1
      };

      set((state) => {
        if (type === WorkflowType.TEMPORARY) {
          // Create new Map to ensure immutability
          const newMap = new Map(state.temporaryWorkflows);
          newMap.set(id, workflow);
          state.temporaryWorkflows = newMap;
          console.log('✅ Added to temporary workflows:', id, 'Total:', newMap.size);
        } else {
          const newMap = new Map(state.permanentWorkflows);
          newMap.set(id, workflow);
          state.permanentWorkflows = newMap;
          console.log('✅ Added to permanent workflows:', id, 'Total:', newMap.size);
        }
      });

      return id;
    },

    loadWorkflow: (id) => {
      console.log('📂 Loading workflow:', id);
      set((state) => {
        // Get workflow directly from the maps within the set function to ensure we have the current state
        const workflow = state.temporaryWorkflows.get(id) ||
                        state.permanentWorkflows.get(id) ||
                        state.templates.get(id);
        
        if (workflow) {
          console.log('✅ Found workflow:', workflow.name);
          state.activeWorkflowId = id;
          // Create a shallow copy to ensure reactivity but maintain reference to arrays
          state.activeWorkflow = { ...workflow };
          state.isEditing = false;
          state.isDirty = false;
        } else {
          console.warn('⚠️ Workflow not found:', id);
        }
      });
    },

    saveWorkflow: (id) => {
      const state = get();
      if (state.activeWorkflow && state.activeWorkflowId === id) {
        const workflow = { ...state.activeWorkflow };
        workflow.metadata.modified = new Date();
        
        set((draft) => {
          if (workflow.type === WorkflowType.TEMPORARY) {
            const newMap = new Map(draft.temporaryWorkflows);
            newMap.set(id, workflow);
            draft.temporaryWorkflows = newMap;
          } else {
            const newMap = new Map(draft.permanentWorkflows);
            newMap.set(id, workflow);
            draft.permanentWorkflows = newMap;
          }
          draft.isDirty = false;
        });
      }
    },

    deleteWorkflow: (id) => {
      set((state) => {
        const tempMap = new Map(state.temporaryWorkflows);
        const permMap = new Map(state.permanentWorkflows);
        const templateMap = new Map(state.templates);
        
        tempMap.delete(id);
        permMap.delete(id);
        templateMap.delete(id);
        
        state.temporaryWorkflows = tempMap;
        state.permanentWorkflows = permMap;
        state.templates = templateMap;
        
        if (state.activeWorkflowId === id) {
          state.activeWorkflowId = null;
          state.activeWorkflow = null;
        }
      });
    },

    duplicateWorkflow: (id) => {
      const workflow = get().getWorkflowById(id);
      if (!workflow) return '';

      const newId = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const duplicated: ExtendedWorkflow = {
        ...workflow,
        id: newId,
        name: `${workflow.name} (Copy)`,
        metadata: {
          ...workflow.metadata,
          created: new Date(),
          modified: new Date()
        }
      };

      set((state) => {
        if (duplicated.type === WorkflowType.TEMPORARY) {
          const newMap = new Map(state.temporaryWorkflows);
          newMap.set(newId, duplicated);
          state.temporaryWorkflows = newMap;
        } else {
          const newMap = new Map(state.permanentWorkflows);
          newMap.set(newId, duplicated);
          state.permanentWorkflows = newMap;
        }
      });

      return newId;
    },

    convertToPermament: (temporaryId) => {
      const workflow = get().temporaryWorkflows.get(temporaryId);
      if (!workflow) return '';

      const newId = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const permanent: ExtendedWorkflow = {
        ...workflow,
        id: newId,
        type: WorkflowType.PERMANENT,
        chatSessionId: undefined,
        metadata: {
          ...workflow.metadata,
          modified: new Date()
        }
      };

      set((state) => {
        const permMap = new Map(state.permanentWorkflows);
        permMap.set(newId, permanent);
        state.permanentWorkflows = permMap;
        
        const tempMap = new Map(state.temporaryWorkflows);
        tempMap.delete(temporaryId);
        state.temporaryWorkflows = tempMap;
        
        if (state.activeWorkflowId === temporaryId) {
          state.activeWorkflowId = newId;
          state.activeWorkflow = permanent;
        }
      });

      return newId;
    },

    exportWorkflow: (id) => {
      const workflow = get().getWorkflowById(id);
      if (!workflow) throw new Error('Workflow not found');
      return workflow;
    },

    importWorkflow: (workflow) => {
      const id = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const imported: ExtendedWorkflow = {
        ...workflow,
        id,
        metadata: {
          ...workflow.metadata,
          created: new Date(),
          modified: new Date()
        }
      };

      set((state) => {
        if (imported.type === WorkflowType.TEMPORARY) {
          const newMap = new Map(state.temporaryWorkflows);
          newMap.set(id, imported);
          state.temporaryWorkflows = newMap;
        } else {
          const newMap = new Map(state.permanentWorkflows);
          newMap.set(id, imported);
          state.permanentWorkflows = newMap;
        }
      });

      return id;
    },

    // Node Management
    addNode: (node) => {
      set((state) => {
        if (state.activeWorkflow) {
          // Ensure nodes array exists
          if (!state.activeWorkflow.nodes) {
            state.activeWorkflow.nodes = [];
          }
          state.activeWorkflow.nodes.push(node);
          state.isDirty = true;
          
          // Also update the workflow in the appropriate map
          const workflowId = state.activeWorkflowId;
          if (workflowId) {
            if (state.activeWorkflow.type === WorkflowType.TEMPORARY) {
              const newMap = new Map(state.temporaryWorkflows);
              newMap.set(workflowId, state.activeWorkflow);
              state.temporaryWorkflows = newMap;
            } else {
              const newMap = new Map(state.permanentWorkflows);
              newMap.set(workflowId, state.activeWorkflow);
              state.permanentWorkflows = newMap;
            }
          }
        }
      });
    },

    updateNode: (nodeId, updates) => {
      set((state) => {
        if (state.activeWorkflow) {
          const nodeIndex = state.activeWorkflow.nodes.findIndex(n => n.id === nodeId);
          if (nodeIndex !== -1) {
            state.activeWorkflow.nodes[nodeIndex] = {
              ...state.activeWorkflow.nodes[nodeIndex],
              ...updates
            };
            state.isDirty = true;
          }
        }
      });
    },

    deleteNode: (nodeId) => {
      set((state) => {
        if (state.activeWorkflow) {
          state.activeWorkflow.nodes = state.activeWorkflow.nodes.filter(n => n.id !== nodeId);
          state.activeWorkflow.edges = state.activeWorkflow.edges.filter(
            e => e.source !== nodeId && e.target !== nodeId
          );
          state.isDirty = true;
        }
      });
    },

    duplicateNode: (nodeId) => {
      const state = get();
      if (!state.activeWorkflow) return '';

      const node = state.activeWorkflow.nodes.find(n => n.id === nodeId);
      if (!node) return '';

      const newId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const duplicated: WorkflowNode = {
        ...node,
        id: newId,
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50
        }
      };

      set((state) => {
        if (state.activeWorkflow) {
          state.activeWorkflow.nodes.push(duplicated);
          state.isDirty = true;
        }
      });

      return newId;
    },

    // Edge Management
    addEdge: (edge) => {
      set((state) => {
        if (state.activeWorkflow) {
          // Ensure edges array exists
          if (!state.activeWorkflow.edges) {
            state.activeWorkflow.edges = [];
          }
          state.activeWorkflow.edges.push(edge);
          state.isDirty = true;
          
          // Also update the workflow in the appropriate map
          const workflowId = state.activeWorkflowId;
          if (workflowId) {
            if (state.activeWorkflow.type === WorkflowType.TEMPORARY) {
              const newMap = new Map(state.temporaryWorkflows);
              newMap.set(workflowId, state.activeWorkflow);
              state.temporaryWorkflows = newMap;
            } else {
              const newMap = new Map(state.permanentWorkflows);
              newMap.set(workflowId, state.activeWorkflow);
              state.permanentWorkflows = newMap;
            }
          }
        }
      });
    },

    updateEdge: (edgeId, updates) => {
      set((state) => {
        if (state.activeWorkflow) {
          const edgeIndex = state.activeWorkflow.edges.findIndex(e => e.id === edgeId);
          if (edgeIndex !== -1) {
            state.activeWorkflow.edges[edgeIndex] = {
              ...state.activeWorkflow.edges[edgeIndex],
              ...updates
            };
            state.isDirty = true;
          }
        }
      });
    },

    deleteEdge: (edgeId) => {
      set((state) => {
        if (state.activeWorkflow) {
          state.activeWorkflow.edges = state.activeWorkflow.edges.filter(e => e.id !== edgeId);
          state.isDirty = true;
        }
      });
    },

    // Execution
    startExecution: (workflowId) => {
      set((state) => {
        const executionState: WorkflowExecutionState = {
          workflowId,
          status: 'running',
          startTime: new Date(),
          progress: 0,
          logs: []
        };
        const newMap = new Map(state.executionStates);
        newMap.set(workflowId, executionState);
        state.executionStates = newMap;
      });
    },

    pauseExecution: (workflowId) => {
      set((state) => {
        const execution = state.executionStates.get(workflowId);
        if (execution) {
          execution.status = 'paused';
          const newMap = new Map(state.executionStates);
          newMap.set(workflowId, execution);
          state.executionStates = newMap;
        }
      });
    },

    stopExecution: (workflowId) => {
      set((state) => {
        const execution = state.executionStates.get(workflowId);
        if (execution) {
          execution.status = 'completed';
          execution.endTime = new Date();
          const newMap = new Map(state.executionStates);
          newMap.set(workflowId, execution);
          state.executionStates = newMap;
        }
      });
    },

    updateNodeStatus: (workflowId, nodeId, status) => {
      const workflow = get().getWorkflowById(workflowId);
      if (workflow) {
        const node = workflow.nodes.find(n => n.id === nodeId);
        if (node && node.data) {
          set((state) => {
            node.data.status = status;
            state.isDirty = true;
          });
        }
      }
    },

    addExecutionLog: (workflowId, message, level, nodeId) => {
      set((state) => {
        const execution = state.executionStates.get(workflowId);
        if (execution) {
          execution.logs.push({
            timestamp: new Date(),
            message,
            level,
            nodeId
          });
          const newMap = new Map(state.executionStates);
          newMap.set(workflowId, execution);
          state.executionStates = newMap;
        }
      });
    },

    // Templates
    saveAsTemplate: (workflowId, name) => {
      const workflow = get().getWorkflowById(workflowId);
      if (!workflow) return '';

      const templateId = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const template: ExtendedWorkflow = {
        ...workflow,
        id: templateId,
        name,
        isTemplate: true,
        type: WorkflowType.PERMANENT,
        metadata: {
          ...workflow.metadata,
          created: new Date(),
          modified: new Date()
        }
      };

      set((state) => {
        const newMap = new Map(state.templates);
        newMap.set(templateId, template);
        state.templates = newMap;
      });

      return templateId;
    },

    createFromTemplate: (templateId, name, type) => {
      const template = get().templates.get(templateId);
      if (!template) return '';

      const newId = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const workflow: ExtendedWorkflow = {
        ...template,
        id: newId,
        name,
        type,
        isTemplate: false,
        metadata: {
          ...template.metadata,
          created: new Date(),
          modified: new Date()
        }
      };

      set((state) => {
        if (type === WorkflowType.TEMPORARY) {
          const newMap = new Map(state.temporaryWorkflows);
          newMap.set(newId, workflow);
          state.temporaryWorkflows = newMap;
        } else {
          const newMap = new Map(state.permanentWorkflows);
          newMap.set(newId, workflow);
          state.permanentWorkflows = newMap;
        }
      });

      return newId;
    },

    // Version Control
    createVersion: (workflowId) => {
      const workflow = get().getWorkflowById(workflowId);
      if (!workflow) return '';

      const versionId = `version-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const version: ExtendedWorkflow = {
        ...workflow,
        id: versionId,
        parentId: workflowId,
        version: (workflow.version || 1) + 1,
        metadata: {
          ...workflow.metadata,
          created: new Date(),
          modified: new Date()
        }
      };

      set((state) => {
        const newMap = new Map(state.permanentWorkflows);
        newMap.set(versionId, version);
        state.permanentWorkflows = newMap;
      });

      return versionId;
    },

    revertToVersion: (workflowId, versionId) => {
      const version = get().permanentWorkflows.get(versionId);
      if (!version || version.parentId !== workflowId) return;

      const current = get().getWorkflowById(workflowId);
      if (current) {
        const reverted = {
          ...version,
          id: workflowId,
          parentId: undefined,
          metadata: {
            ...version.metadata,
            modified: new Date()
          }
        };

        set((state) => {
          if (current.type === WorkflowType.TEMPORARY) {
            const newMap = new Map(state.temporaryWorkflows);
            newMap.set(workflowId, reverted);
            state.temporaryWorkflows = newMap;
          } else {
            const newMap = new Map(state.permanentWorkflows);
            newMap.set(workflowId, reverted);
            state.permanentWorkflows = newMap;
          }

          if (state.activeWorkflowId === workflowId) {
            state.activeWorkflow = reverted;
          }
        });
      }
    },

    // UI State
    selectNode: (nodeId) => {
      set((state) => {
        state.selectedNodeId = nodeId;
        state.selectedEdgeId = null;
      });
    },

    selectEdge: (edgeId) => {
      set((state) => {
        state.selectedEdgeId = edgeId;
        state.selectedNodeId = null;
      });
    },

    setEditing: (isEditing) => {
      set((state) => {
        state.isEditing = isEditing;
      });
    },

    setDirty: (isDirty) => {
      set((state) => {
        state.isDirty = isDirty;
      });
    },

    // Bulk Operations
    clearTemporaryWorkflows: (olderThan) => {
      set((state) => {
        if (olderThan) {
          const cutoff = olderThan.getTime();
          const newMap = new Map(
            Array.from(state.temporaryWorkflows.entries()).filter(
              ([_, workflow]) => workflow.metadata.modified.getTime() > cutoff
            )
          );
          state.temporaryWorkflows = newMap;
        } else {
          state.temporaryWorkflows = new Map();
        }
      });
    },

    exportAllWorkflows: () => {
      const state = get();
      return [
        ...Array.from(state.temporaryWorkflows.values()),
        ...Array.from(state.permanentWorkflows.values()),
        ...Array.from(state.templates.values())
      ];
    },

    importBulkWorkflows: (workflows) => {
      set((state) => {
        workflows.forEach(workflow => {
          const id = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const imported = {
            ...workflow,
            id,
            metadata: {
              ...workflow.metadata,
              created: new Date(),
              modified: new Date()
            }
          };

          if (imported.isTemplate) {
            const newMap = new Map(state.templates);
            newMap.set(id, imported);
            state.templates = newMap;
          } else if (imported.type === WorkflowType.TEMPORARY) {
            const newMap = new Map(state.temporaryWorkflows);
            newMap.set(id, imported);
            state.temporaryWorkflows = newMap;
          } else {
            const newMap = new Map(state.permanentWorkflows);
            newMap.set(id, imported);
            state.permanentWorkflows = newMap;
          }
        });
      });
    },

    // Getters
    getWorkflowById: (id) => {
      const state = get();
      return state.temporaryWorkflows.get(id) ||
             state.permanentWorkflows.get(id) ||
             state.templates.get(id);
    },

    getWorkflowsByChatSession: (chatSessionId) => {
      const state = get();
      return Array.from(state.temporaryWorkflows.values()).filter(
        w => w.chatSessionId === chatSessionId
      );
    },

    getWorkflowsByCategory: (category) => {
      const state = get();
      const all = [
        ...Array.from(state.temporaryWorkflows.values()),
        ...Array.from(state.permanentWorkflows.values())
      ];
      return all.filter(w => w.metadata.category === category);
    },

    getRecentWorkflows: (limit) => {
      const state = get();
      const all = [
        ...Array.from(state.temporaryWorkflows.values()),
        ...Array.from(state.permanentWorkflows.values())
      ];
      return all
        .sort((a, b) => b.metadata.modified.getTime() - a.metadata.modified.getTime())
        .slice(0, limit);
    },

    searchWorkflows: (query) => {
      const state = get();
      const all = [
        ...Array.from(state.temporaryWorkflows.values()),
        ...Array.from(state.permanentWorkflows.values()),
        ...Array.from(state.templates.values())
      ];
      const lowerQuery = query.toLowerCase();
      return all.filter(w => 
        w.name.toLowerCase().includes(lowerQuery) ||
        w.description?.toLowerCase().includes(lowerQuery) ||
        w.metadata.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }
  }))
);

export default useWorkflowStore;