import { useRef, useEffect, useCallback } from 'react';

interface DeduplicationOptions {
  windowMs?: number; // Time window for deduplication (default: 500ms)
  includePayload?: boolean; // Include payload in hash (default: true)
}

/**
 * Custom hook for request deduplication and abort management
 * Prevents duplicate requests and manages request lifecycle
 */
export function useRequestDeduplication(options: DeduplicationOptions = {}) {
  const { windowMs = 500, includePayload = true } = options;
  
  const activeRequestRef = useRef<AbortController | null>(null);
  const lastRequestHashRef = useRef<string>('');
  const lastRequestTimeRef = useRef<number>(0);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (activeRequestRef.current) {
        activeRequestRef.current.abort();
        activeRequestRef.current = null;
      }
    };
  }, []);
  
  /**
   * Check if request is duplicate
   */
  const isDuplicate = useCallback((requestHash: string): boolean => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTimeRef.current;
    
    return requestHash === lastRequestHashRef.current && timeSinceLastRequest < windowMs;
  }, [windowMs]);
  
  /**
   * Create request hash for deduplication
   */
  const createRequestHash = useCallback((data: any): string => {
    if (!includePayload) {
      return JSON.stringify({ timestamp: Date.now() });
    }
    
    // Create deterministic hash of request data
    if (typeof data === 'object' && data !== null) {
      // Sort object keys for consistent hashing
      const sortedData = Object.keys(data)
        .sort()
        .reduce((obj, key) => {
          obj[key] = data[key];
          return obj;
        }, {} as any);
      return JSON.stringify(sortedData);
    }
    
    return JSON.stringify(data);
  }, [includePayload]);
  
  /**
   * Execute request with deduplication and abort management
   */
  const executeRequest = useCallback(async <T>(
    requestData: any,
    requestFn: (signal: AbortSignal) => Promise<T>
  ): Promise<T | null> => {
    const requestHash = createRequestHash(requestData);
    
    // Check for duplicate
    if (isDuplicate(requestHash)) {
      console.log('⚠️ Duplicate request detected, ignoring');
      return null;
    }
    
    // Cancel any active request
    if (activeRequestRef.current) {
      console.log('🚫 Canceling previous request');
      activeRequestRef.current.abort();
    }
    
    // Update tracking
    lastRequestHashRef.current = requestHash;
    lastRequestTimeRef.current = Date.now();
    
    // Create new abort controller
    const abortController = new AbortController();
    activeRequestRef.current = abortController;
    
    try {
      const result = await requestFn(abortController.signal);
      
      // Clear active request on success
      if (activeRequestRef.current === abortController) {
        activeRequestRef.current = null;
      }
      
      return result;
    } catch (error) {
      // Check if request was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('⚠️ Request was aborted');
        return null;
      }
      
      // Clear active request on error
      if (activeRequestRef.current === abortController) {
        activeRequestRef.current = null;
      }
      
      throw error;
    }
  }, [createRequestHash, isDuplicate]);
  
  /**
   * Abort current request if any
   */
  const abortCurrentRequest = useCallback(() => {
    if (activeRequestRef.current) {
      activeRequestRef.current.abort();
      activeRequestRef.current = null;
    }
  }, []);
  
  return {
    executeRequest,
    abortCurrentRequest,
    isRequestActive: () => activeRequestRef.current !== null
  };
}