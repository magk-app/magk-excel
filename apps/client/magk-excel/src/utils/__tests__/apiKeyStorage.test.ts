/**
 * Tests for API Key Storage utility
 */

import { 
  loadApiKeys, 
  saveApiKeys, 
  updateApiKey, 
  removeApiKey, 
  getApiKey, 
  hasApiKey, 
  getConfiguredProviders,
  initializeApiKeyStorage 
} from '../apiKeyStorage';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

describe('API Key Storage', () => {
  beforeEach(() => {
    localStorageMock.clear();
    sessionStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('saveApiKeys and loadApiKeys', () => {
    it('should save and load API keys correctly', () => {
      const keys = {
        anthropic: 'test-anthropic-key',
        openai: 'test-openai-key',
        smithery: 'test-smithery-key'
      };

      saveApiKeys(keys);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'magk-api-keys', 
        JSON.stringify(keys)
      );
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        'magk-api-keys', 
        JSON.stringify(keys)
      );

      const loadedKeys = loadApiKeys();
      expect(loadedKeys).toEqual(keys);
    });

    it('should migrate from legacy storage', () => {
      // Set up legacy storage
      localStorageMock.setItem('magk_api_keys', JSON.stringify({
        anthropic: 'legacy-anthropic-key',
        openai: 'legacy-openai-key'
      }));
      localStorageMock.setItem('smithery_api_key', 'legacy-smithery-key');

      const keys = loadApiKeys();

      expect(keys).toEqual({
        anthropic: 'legacy-anthropic-key',
        openai: 'legacy-openai-key',
        smithery: 'legacy-smithery-key'
      });

      // Should clean up legacy keys
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('magk_api_keys');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('smithery_api_key');
    });
  });

  describe('updateApiKey', () => {
    it('should update a specific API key', () => {
      const initialKeys = { anthropic: 'old-key' };
      saveApiKeys(initialKeys);

      const updatedKeys = updateApiKey('anthropic', 'new-key');
      
      expect(updatedKeys).toEqual({ anthropic: 'new-key' });
      expect(loadApiKeys()).toEqual({ anthropic: 'new-key' });
    });

    it('should add a new API key', () => {
      const initialKeys = { anthropic: 'anthropic-key' };
      saveApiKeys(initialKeys);

      const updatedKeys = updateApiKey('smithery', 'smithery-key');
      
      expect(updatedKeys).toEqual({ 
        anthropic: 'anthropic-key',
        smithery: 'smithery-key' 
      });
    });
  });

  describe('removeApiKey', () => {
    it('should remove a specific API key', () => {
      const initialKeys = { 
        anthropic: 'anthropic-key',
        smithery: 'smithery-key' 
      };
      saveApiKeys(initialKeys);

      const updatedKeys = removeApiKey('smithery');
      
      expect(updatedKeys).toEqual({ anthropic: 'anthropic-key' });
      expect(loadApiKeys()).toEqual({ anthropic: 'anthropic-key' });
    });
  });

  describe('getApiKey', () => {
    it('should get a specific API key', () => {
      const keys = { anthropic: 'test-key' };
      saveApiKeys(keys);

      expect(getApiKey('anthropic')).toBe('test-key');
      expect(getApiKey('nonexistent')).toBeUndefined();
    });
  });

  describe('hasApiKey', () => {
    it('should check if API key exists and is not empty', () => {
      const keys = { 
        anthropic: 'valid-key',
        openai: '',
        smithery: '   '
      };
      saveApiKeys(keys);

      expect(hasApiKey('anthropic')).toBe(true);
      expect(hasApiKey('openai')).toBe(false);
      expect(hasApiKey('smithery')).toBe(false);
      expect(hasApiKey('nonexistent')).toBe(false);
    });
  });

  describe('getConfiguredProviders', () => {
    it('should return only providers with valid keys', () => {
      const keys = { 
        anthropic: 'valid-key',
        openai: '',
        smithery: 'another-valid-key',
        firecrawl: '   '
      };
      saveApiKeys(keys);

      const providers = getConfiguredProviders();
      expect(providers).toEqual(['anthropic', 'smithery']);
    });
  });

  describe('initializeApiKeyStorage', () => {
    it('should initialize and return migrated keys', () => {
      // Set up legacy storage
      localStorageMock.setItem('magk_api_keys', JSON.stringify({
        anthropic: 'legacy-key'
      }));
      localStorageMock.setItem('smithery_api_key', 'legacy-smithery');

      const keys = initializeApiKeyStorage();

      expect(keys).toEqual({
        anthropic: 'legacy-key',
        smithery: 'legacy-smithery'
      });

      // Should have saved to new format
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'magk-api-keys',
        JSON.stringify({
          anthropic: 'legacy-key',
          smithery: 'legacy-smithery'
        })
      );
    });
  });
});