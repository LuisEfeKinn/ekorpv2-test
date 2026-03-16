// ----------------------------------------------------------------------
// AI Provider Configuration Helper
// Fetches provider configuration from backend
// Simplified structure - parameters come directly with label/value
// ----------------------------------------------------------------------

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

export interface IProviderModel {
  id: string;
  modelKey: string;
  name: string;
  endpoint: string;
  maxTokens: number;
  contextWindow: number;
  capabilities: string[];
  isDefault: boolean;
}

export interface IProviderParameter {
  id: string;
  label: string;
  value: string;
}

export interface IProvider {
  id: string;
  name: string;
  logo: string | null;
  isActive: boolean;
  isAvailable: boolean;
  requiresApiKey: boolean;
  supportsStreaming: boolean;
  parameters: IProviderParameter[];
  models: IProviderModel[];
}

export interface IProviderConfig {
  provider: IProvider | null;
  models: IProviderModel[];
  parameters: Record<string, string>;
  // Convenience accessors
  apiKey: string | null;
  groupId: string | null;
  webhookUrl: string | null;
  json2VideoApiKey: string | null;
  json2VideoWebhookUrl: string | null;
}

export interface IModelConfig {
  model: IProviderModel | null;
  endpoint: string | null;
  apiKey: string | null;
  groupId: string | null;
  supportsStreaming: boolean;
}

// ----------------------------------------------------------------------
// Cache
// ----------------------------------------------------------------------

let providersCache: IProvider[] = [];
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// ----------------------------------------------------------------------
// Provider Names (for matching)
// ----------------------------------------------------------------------

export const PROVIDER_NAMES = {
  OPENAI: 'OpenAI',
  GOOGLE: 'Google AI',
  MINIMAX: 'MiniMax',
  PROPRIETARY: 'Propietario',
} as const;

// ----------------------------------------------------------------------
// Core Functions
// ----------------------------------------------------------------------

/**
 * Parse capabilities from JSON string or array
 */
function parseCapabilities(capabilities: string | string[]): string[] {
  if (Array.isArray(capabilities)) {
    return capabilities;
  }
  try {
    return JSON.parse(capabilities);
  } catch {
    return [];
  }
}

// Store authorization token for server-side requests
let authToken: string | null = null;

/**
 * Set the authorization token for backend requests
 * This should be called from API routes with the token from the request headers
 */
export function setAuthToken(token: string | null): void {
  authToken = token;
}

/**
 * Get the current auth token
 */
export function getAuthToken(): string | null {
  return authToken;
}

/**
 * Fetch all providers from backend
 */
export async function fetchAllProviders(token?: string): Promise<IProvider[]> {
  try {
    const now = Date.now();

    // Check if cache is still valid
    if (now - cacheTimestamp < CACHE_DURATION && providersCache.length > 0) {
      return providersCache;
    }

    // Try multiple sources for backend URL
    const backendUrl = CONFIG.serverUrl 
      || process.env.NEXT_PUBLIC_HOST_API 
      || process.env.NEXT_PUBLIC_SERVER_URL;

    if (!backendUrl) {
      console.error('[AI Config] SERVER_URL is not configured');
      return [];
    }

    // Use provided token, stored token, or none
    const authorizationToken = token || authToken;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (authorizationToken) {
      headers.Authorization = authorizationToken.startsWith('Bearer ') 
        ? authorizationToken 
        : `Bearer ${authorizationToken}`;
    }

    const response = await fetch(`${backendUrl}/ai-providers/complete`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('[AI Config] Failed to fetch providers:', response.status);
      return [];
    }

    const data = await response.json();
    const providers = data.data || [];

    // Map and normalize providers
    providersCache = providers.map((p: any) => ({
      id: p.id,
      name: p.name,
      logo: p.logo,
      isActive: p.isActive,
      isAvailable: p.isAvailable,
      requiresApiKey: p.requiresApiKey,
      supportsStreaming: p.supportsStreaming,
      parameters: (p.parameters || []).map((param: any) => ({
        id: param.id,
        label: param.label,
        value: param.value || '',
      })),
      models: (p.models || []).map((m: any) => ({
        id: m.id,
        modelKey: m.modelKey,
        name: m.name,
        endpoint: m.endpoint,
        maxTokens: m.maxTokens,
        contextWindow: m.contextWindow,
        capabilities: parseCapabilities(m.capabilities),
        isDefault: m.isDefault,
      })),
    }));

    cacheTimestamp = now;

    return providersCache;
  } catch (error) {
    console.error('[AI Config] Error fetching providers:', error);
    return [];
  }
}

/**
 * Get provider by name
 */
export async function getProviderByName(providerName: string, token?: string): Promise<IProvider | null> {
  const providers = await fetchAllProviders(token);
  return providers.find((p) => p.name.toLowerCase() === providerName.toLowerCase()) || null;
}

/**
 * Get provider by ID
 */
export async function getProviderById(providerId: string, token?: string): Promise<IProvider | null> {
  const providers = await fetchAllProviders(token);
  return providers.find((p) => p.id === providerId) || null;
}

/**
 * Extract parameters as key-value map from provider
 * Uses label as key, value as value
 */
export function extractParameters(provider: IProvider): Record<string, string> {
  const params: Record<string, string> = {};
  provider.parameters.forEach((p) => {
    if (p.label && p.value) {
      params[p.label] = p.value;
    }
  });
  return params;
}

/**
 * Get complete provider configuration
 */
export async function getProviderConfig(providerName: string, token?: string): Promise<IProviderConfig> {
  const provider = await getProviderByName(providerName, token);

  if (!provider) {
    console.warn(`[AI Config] Provider not found: ${providerName}`);
    return {
      provider: null,
      models: [],
      parameters: {},
      apiKey: null,
      groupId: null,
      webhookUrl: null,
      json2VideoApiKey: null,
      json2VideoWebhookUrl: null,
    };
  }

  const parameters = extractParameters(provider);

  return {
    provider,
    models: provider.models,
    parameters,
    apiKey: parameters.API_KEY || null,
    groupId: parameters.GROUP_ID || null,
    webhookUrl: parameters.WEBHOOK_URL || null,
    json2VideoApiKey: parameters.JSON2VIDEO_API_KEY || null,
    json2VideoWebhookUrl: parameters.JSON2VIDEO_WEBHOOK_URL || null,
  };
}

/**
 * Get configuration for a specific model
 */
export async function getModelConfig(
  providerName: string,
  modelKey?: string,
  token?: string
): Promise<IModelConfig> {
  const config = await getProviderConfig(providerName, token);

  if (!config.provider || config.models.length === 0) {
    return {
      model: null,
      endpoint: null,
      apiKey: null,
      groupId: null,
      supportsStreaming: false,
    };
  }

  // Find the requested model or use default
  let model: IProviderModel | null = null;

  if (modelKey) {
    model = config.models.find((m) => m.modelKey === modelKey) || null;
  }

  if (!model) {
    // Use default model
    model = config.models.find((m) => m.isDefault) || config.models[0];
  }

  return {
    model,
    endpoint: model?.endpoint || null,
    apiKey: config.apiKey,
    groupId: config.groupId,
    supportsStreaming: config.provider.supportsStreaming,
  };
}

/**
 * Get model by capability from a provider
 */
export async function getModelByCapability(
  providerName: string,
  capability: 'text' | 'image' | 'video' | 'audio',
  token?: string
): Promise<IModelConfig> {
  const config = await getProviderConfig(providerName, token);

  if (!config.provider || config.models.length === 0) {
    return {
      model: null,
      endpoint: null,
      apiKey: null,
      groupId: null,
      supportsStreaming: false,
    };
  }

  // Find model with the requested capability
  const model = config.models.find((m) => m.capabilities.includes(capability));

  if (!model) {
    console.warn(`[AI Config] No model with capability '${capability}' found for ${providerName}`);
    return {
      model: null,
      endpoint: null,
      apiKey: config.apiKey,
      groupId: config.groupId,
      supportsStreaming: config.provider.supportsStreaming,
    };
  }

  return {
    model,
    endpoint: model.endpoint,
    apiKey: config.apiKey,
    groupId: config.groupId,
    supportsStreaming: config.provider.supportsStreaming,
  };
}

/**
 * Get providers that support a specific capability
 */
export async function getProvidersByCapability(
  capability: 'text' | 'image' | 'video' | 'audio',
  token?: string
): Promise<IProvider[]> {
  const providers = await fetchAllProviders(token);
  return providers.filter((p) => p.models.some((m) => m.capabilities.includes(capability)));
}

/**
 * Clear the configuration cache
 */
export function clearConfigCache(): void {
  providersCache = [];
  cacheTimestamp = 0;
}
