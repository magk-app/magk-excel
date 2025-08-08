import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PersistedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string; // Base64 encoded content
  uploadedAt: Date;
  sessionId: string;
  isPersistent: boolean;
  tags?: string[];
  description?: string;
}

export interface FilePersistenceState {
  // Files stored temporarily (session-only)
  temporaryFiles: Map<string, PersistedFile>;
  
  // Files stored persistently (conversation-wide)
  persistentFiles: Map<string, PersistedFile>;
  
  // Current session ID
  currentSessionId: string;
  
  // Settings
  autoPersistedTypes: string[]; // File types to auto-persist
  maxTemporaryFiles: number;
  maxPersistentFiles: number;
  maxFileSize: number; // In bytes for temporary files
  maxPersistentFileSize: number; // In bytes for persistent files (2.5MB)
  
  // Actions
  addFile: (file: File, isPersistent: boolean, sessionId: string) => Promise<string>;
  removeFile: (fileId: string) => void;
  toggleFilePersistence: (fileId: string) => void;
  getFile: (fileId: string) => PersistedFile | undefined;
  getSessionFiles: (sessionId: string) => PersistedFile[];
  getAllPersistentFiles: () => PersistedFile[];
  clearTemporaryFiles: (sessionId?: string) => void;
  clearAllFiles: () => void;
  updateFileMetadata: (fileId: string, updates: Partial<PersistedFile>) => void;
  
  // Utility functions
  isFilePersisted: (fileId: string) => boolean;
  getFileStats: () => { temporary: number; persistent: number; totalSize: number };
  canAddFile: (size: number, isPersistent: boolean) => boolean;
  
  // Mock Supabase integration (for future implementation)
  syncWithSupabase: () => Promise<void>;
  downloadFromSupabase: (fileId: string) => Promise<PersistedFile | null>;
}

// Helper function to convert File to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix to get just base64
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

// Helper function to generate unique file ID
function generateFileId(): string {
  return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const useFilePersistenceStore = create<FilePersistenceState>()(
  persist(
    (set, get) => ({
      // Initial state
      temporaryFiles: new Map(),
      persistentFiles: new Map(),
      currentSessionId: '',
      
      // Default settings
      autoPersistedTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      maxTemporaryFiles: 10,
      maxPersistentFiles: 50,
      maxFileSize: 10 * 1024 * 1024, // 10MB for temporary files
      maxPersistentFileSize: 2.5 * 1024 * 1024, // 2.5MB for persistent files
      
      // Add a file to storage
      addFile: async (file: File, isPersistent: boolean, sessionId: string) => {
        const state = get();
        
        // Check file size limit based on persistence type
        const sizeLimit = isPersistent ? state.maxPersistentFileSize : state.maxFileSize;
        if (file.size > sizeLimit) {
          throw new Error(`File size exceeds limit of ${sizeLimit / 1024 / 1024}MB for ${isPersistent ? 'persistent' : 'temporary'} files`);
        }
        
        // Check if we can add the file
        if (!state.canAddFile(file.size, isPersistent)) {
          throw new Error(`Maximum ${isPersistent ? 'persistent' : 'temporary'} file limit reached`);
        }
        
        // Convert file to base64
        const content = await fileToBase64(file);
        const fileId = generateFileId();
        
        // Check if file type should be auto-persisted
        const shouldAutoPersist = state.autoPersistedTypes.includes(file.type);
        const finalPersistence = isPersistent || shouldAutoPersist;
        
        const persistedFile: PersistedFile = {
          id: fileId,
          name: file.name,
          type: file.type,
          size: file.size,
          content,
          uploadedAt: new Date(),
          sessionId,
          isPersistent: finalPersistence
        };

        // If persistent, also save to app data directory via file API
        if (finalPersistence && window.fileAPI) {
          try {
            const dataUrl = `data:${file.type};base64,${content}`;
            const result = await window.fileAPI.writePersistentFile(file.name, dataUrl);
            if (result.success) {
              console.log('📁 File saved to app data directory:', result.filePath);
            } else {
              console.warn('⚠️ Failed to save to app data directory:', result.error);
            }
          } catch (error) {
            console.warn('⚠️ Error saving to app data directory:', error);
          }
        }
        
        set((state) => {
          const newState = { ...state };
          
          if (finalPersistence) {
            // Add to persistent storage
            const newPersistentFiles = new Map(state.persistentFiles);
            newPersistentFiles.set(fileId, persistedFile);
            newState.persistentFiles = newPersistentFiles;
          } else {
            // Add to temporary storage
            const newTemporaryFiles = new Map(state.temporaryFiles);
            newTemporaryFiles.set(fileId, persistedFile);
            newState.temporaryFiles = newTemporaryFiles;
          }
          
          return newState;
        });
        
        console.log(`📁 File added: ${file.name} (${finalPersistence ? 'persistent' : 'temporary'})`);
        return fileId;
      },
      
      // Remove a file from storage
      removeFile: (fileId: string) => {
        set((state) => {
          const newTemporaryFiles = new Map(state.temporaryFiles);
          const newPersistentFiles = new Map(state.persistentFiles);
          
          // Get file info before removing to delete from app data directory
          const tempFile = state.temporaryFiles.get(fileId);
          const persistFile = state.persistentFiles.get(fileId);
          const fileToRemove = tempFile || persistFile;
          
          newTemporaryFiles.delete(fileId);
          newPersistentFiles.delete(fileId);
          
          // If it was a persistent file, also delete from app data directory
          if (fileToRemove?.isPersistent && window.fileAPI) {
            window.fileAPI.deletePersistentFile(fileToRemove.name).catch(error => {
              console.warn('⚠️ Failed to delete from app data directory:', error);
            });
          }
          
          console.log(`🗑️ File removed: ${fileId}`);
          
          return {
            ...state,
            temporaryFiles: newTemporaryFiles,
            persistentFiles: newPersistentFiles
          };
        });
      },
      
      // Toggle file persistence
      toggleFilePersistence: (fileId: string) => {
        set((state) => {
          const tempFile = state.temporaryFiles.get(fileId);
          const persistFile = state.persistentFiles.get(fileId);
          
          if (tempFile) {
            // Move from temporary to persistent
            const newTemporaryFiles = new Map(state.temporaryFiles);
            const newPersistentFiles = new Map(state.persistentFiles);
            
            newTemporaryFiles.delete(fileId);
            tempFile.isPersistent = true;
            newPersistentFiles.set(fileId, tempFile);

            // Save to app data directory
            if (window.fileAPI) {
              const dataUrl = `data:${tempFile.type};base64,${tempFile.content}`;
              window.fileAPI.writePersistentFile(tempFile.name, dataUrl).catch(error => {
                console.warn('⚠️ Failed to save to app data directory:', error);
              });
            }
            
            console.log(`📌 File made persistent: ${tempFile.name}`);
            
            return {
              ...state,
              temporaryFiles: newTemporaryFiles,
              persistentFiles: newPersistentFiles
            };
          } else if (persistFile) {
            // Move from persistent to temporary
            const newTemporaryFiles = new Map(state.temporaryFiles);
            const newPersistentFiles = new Map(state.persistentFiles);
            
            newPersistentFiles.delete(fileId);
            persistFile.isPersistent = false;
            newTemporaryFiles.set(fileId, persistFile);

            // Delete from app data directory
            if (window.fileAPI) {
              window.fileAPI.deletePersistentFile(persistFile.name).catch(error => {
                console.warn('⚠️ Failed to delete from app data directory:', error);
              });
            }
            
            console.log(`📎 File made temporary: ${persistFile.name}`);
            
            return {
              ...state,
              temporaryFiles: newTemporaryFiles,
              persistentFiles: newPersistentFiles
            };
          }
          
          return state;
        });
      },
      
      // Get a specific file
      getFile: (fileId: string) => {
        const state = get();
        return state.temporaryFiles.get(fileId) || state.persistentFiles.get(fileId);
      },
      
      // Get all files for a session
      getSessionFiles: (sessionId: string) => {
        const state = get();
        const files: PersistedFile[] = [];
        
        // Get temporary files for this session
        state.temporaryFiles.forEach(file => {
          if (file.sessionId === sessionId) {
            files.push(file);
          }
        });
        
        // All persistent files are available to all sessions
        state.persistentFiles.forEach(file => {
          files.push(file);
        });
        
        // Sort by upload date (newest first) to ensure visibility
        return files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      },
      
      // Get all persistent files
      getAllPersistentFiles: () => {
        const state = get();
        return Array.from(state.persistentFiles.values());
      },
      
      // Clear temporary files
      clearTemporaryFiles: (sessionId?: string) => {
        set((state) => {
          if (sessionId) {
            // Clear only files from specific session
            const newTemporaryFiles = new Map();
            state.temporaryFiles.forEach((file, id) => {
              if (file.sessionId !== sessionId) {
                newTemporaryFiles.set(id, file);
              }
            });
            
            console.log(`🧹 Cleared temporary files for session: ${sessionId}`);
            
            return {
              ...state,
              temporaryFiles: newTemporaryFiles
            };
          } else {
            // Clear all temporary files
            console.log('🧹 Cleared all temporary files');
            return {
              ...state,
              temporaryFiles: new Map()
            };
          }
        });
      },
      
      // Clear all files
      clearAllFiles: () => {
        set((state) => {
          console.log('🗑️ Cleared all files (temporary and persistent)');
          return {
            ...state,
            temporaryFiles: new Map(),
            persistentFiles: new Map()
          };
        });
      },
      
      // Update file metadata
      updateFileMetadata: (fileId: string, updates: Partial<PersistedFile>) => {
        set((state) => {
          const newTemporaryFiles = new Map(state.temporaryFiles);
          const newPersistentFiles = new Map(state.persistentFiles);
          
          if (newTemporaryFiles.has(fileId)) {
            const file = newTemporaryFiles.get(fileId)!;
            newTemporaryFiles.set(fileId, { ...file, ...updates });
          } else if (newPersistentFiles.has(fileId)) {
            const file = newPersistentFiles.get(fileId)!;
            newPersistentFiles.set(fileId, { ...file, ...updates });
          }
          
          return {
            ...state,
            temporaryFiles: newTemporaryFiles,
            persistentFiles: newPersistentFiles
          };
        });
      },
      
      // Check if file is persisted
      isFilePersisted: (fileId: string) => {
        const state = get();
        return state.persistentFiles.has(fileId);
      },
      
      // Get file statistics
      getFileStats: () => {
        const state = get();
        let totalSize = 0;
        
        state.temporaryFiles.forEach(file => {
          totalSize += file.size;
        });
        
        state.persistentFiles.forEach(file => {
          totalSize += file.size;
        });
        
        return {
          temporary: state.temporaryFiles.size,
          persistent: state.persistentFiles.size,
          totalSize
        };
      },
      
      // Check if we can add a file
      canAddFile: (size: number, isPersistent: boolean) => {
        const state = get();
        
        if (isPersistent) {
          return state.persistentFiles.size < state.maxPersistentFiles;
        } else {
          return state.temporaryFiles.size < state.maxTemporaryFiles;
        }
      },
      
      // Mock Supabase sync (for future implementation)
      syncWithSupabase: async () => {
        console.log('📤 Syncing with Supabase (mock)...');
        // In the future, this would upload persistent files to Supabase
        // For now, it's just a placeholder
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('✅ Sync complete (mock)');
      },
      
      // Mock download from Supabase
      downloadFromSupabase: async (fileId: string) => {
        console.log(`📥 Downloading file ${fileId} from Supabase (mock)...`);
        // In the future, this would download a file from Supabase
        // For now, return null
        await new Promise(resolve => setTimeout(resolve, 500));
        return null;
      }
    }),
    {
      name: 'file-persistence-storage',
      // Custom storage to handle Map serialization
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          
          const state = JSON.parse(str);
          
          // Convert arrays back to Maps
          if (state.state.temporaryFiles) {
            state.state.temporaryFiles = new Map(state.state.temporaryFiles);
          }
          if (state.state.persistentFiles) {
            state.state.persistentFiles = new Map(state.state.persistentFiles);
          }
          
          return state;
        },
        setItem: (name, value) => {
          // Convert Maps to arrays for serialization
          const serializedState = {
            ...value,
            state: {
              ...value.state,
              temporaryFiles: value.state.temporaryFiles instanceof Map 
                ? Array.from(value.state.temporaryFiles.entries())
                : value.state.temporaryFiles,
              persistentFiles: value.state.persistentFiles instanceof Map
                ? Array.from(value.state.persistentFiles.entries())
                : value.state.persistentFiles
            }
          };
          
          localStorage.setItem(name, JSON.stringify(serializedState));
        },
        removeItem: (name) => localStorage.removeItem(name)
      }
    }
  )
);