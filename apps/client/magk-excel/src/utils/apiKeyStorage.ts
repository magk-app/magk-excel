/**
 * Utility functions for managing API key storage with consistency and migration support
 */

export interface ApiKeyConfig {
  anthropic?: string;
  openai?: string;
  firecrawl?: string;
  smithery?: string;
  [key: string]: string | undefined;
}

const UNIFIED_STORAGE_KEY = 'magk-api-keys';
const LEGACY_KEYS = ['magk_api_keys', 'smithery_api_key'];

/**
 * Load API keys from storage with automatic migration from legacy storage
 */
export function loadApiKeys(): ApiKeyConfig {
  // Try to load from unified storage first
  const unifiedStorage = localStorage.getItem(UNIFIED_STORAGE_KEY);
  let keys: ApiKeyConfig = {};

  if (unifiedStorage) {
    try {
      keys = JSON.parse(unifiedStorage);
    } catch (e) {
      console.error('Failed to parse unified API keys:', e);
    }
  }

  // Check for legacy storage and migrate
  let needsMigration = false;

  // Migrate from old magk_api_keys (underscore version)
  const legacyMagkKeys = localStorage.getItem('magk_api_keys');
  if (legacyMagkKeys && !unifiedStorage) {
    try {
      const legacyKeys = JSON.parse(legacyMagkKeys);
      keys = { ...keys, ...legacyKeys };
      needsMigration = true;
    } catch (e) {
      console.error('Failed to parse legacy magk API keys:', e);
    }
  }

  // Migrate standalone Smithery key
  const smitheryKey = localStorage.getItem('smithery_api_key');
  if (smitheryKey && !keys.smithery) {
    keys.smithery = smitheryKey;
    needsMigration = true;
  }

  // Save migrated keys and clean up legacy storage
  if (needsMigration) {
    saveApiKeys(keys);
    cleanupLegacyStorage();
  }

  return keys;
}

/**
 * Save API keys to unified storage
 */
export function saveApiKeys(keys: ApiKeyConfig): void {
  localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(keys));
  
  // Also save to sessionStorage for immediate use
  sessionStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(keys));
  
  // Clean up any legacy storage
  cleanupLegacyStorage();
}

/**
 * Update a specific API key
 */
export function updateApiKey(provider: string, apiKey: string): ApiKeyConfig {
  const keys = loadApiKeys();
  keys[provider] = apiKey;
  saveApiKeys(keys);
  return keys;
}

/**
 * Remove a specific API key
 */
export function removeApiKey(provider: string): ApiKeyConfig {
  const keys = loadApiKeys();
  delete keys[provider];
  saveApiKeys(keys);
  return keys;
}

/**
 * Get a specific API key
 */
export function getApiKey(provider: string): string | undefined {
  const keys = loadApiKeys();
  return keys[provider];
}

/**
 * Check if an API key exists for a provider
 */
export function hasApiKey(provider: string): boolean {
  const key = getApiKey(provider);
  return !!key && key.trim() !== '';
}

/**
 * Get all configured API key providers
 */
export function getConfiguredProviders(): string[] {
  const keys = loadApiKeys();
  return Object.keys(keys).filter(provider => keys[provider] && keys[provider]!.trim() !== '');
}

/**
 * Clean up legacy storage keys
 */
function cleanupLegacyStorage(): void {
  LEGACY_KEYS.forEach(key => {
    localStorage.removeItem(key);
  });
}

/**
 * Initialize API key storage (run once on app startup)
 * This ensures migration happens early in the application lifecycle
 */
export function initializeApiKeyStorage(): ApiKeyConfig {
  return loadApiKeys();
}