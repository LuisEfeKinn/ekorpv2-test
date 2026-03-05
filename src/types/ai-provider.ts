// ----------------------------------------------------------------------
// AI Provider Types - Dynamic configuration from Backend
// Simplified structure - all in one endpoint
// ----------------------------------------------------------------------

/**
 * Parameter for AI Provider (API_KEY, GROUP_ID, etc.)
 */
export interface IAiProviderParameter {
  id: string;
  aiProviderId: string;
  label: 'API_KEY' | 'GROUP_ID' | 'WEBHOOK_URL' | 'JSON2VIDEO_API_KEY' | 'JSON2VIDEO_WEBHOOK_URL' | string;
  value: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * AI Model from backend
 */
export interface IAiProviderModel {
  id: string;
  aiProviderId: string;
  modelKey: string;
  name: string;
  description: string;
  maxTokens: number;
  contextWindow: number;
  capabilities: string | string[]; // Can come as JSON string or array
  endpoint: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

/**
 * AI Provider from backend - Simplified structure
 */
export interface IAiProvider {
  id: string;
  name: string;
  logo: string | null;
  isActive: boolean;
  isAvailable: boolean;
  requiresApiKey: boolean;
  supportsStreaming: boolean;
  parameters: IAiProviderParameter[];
  models: IAiProviderModel[];
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

/**
 * API Response wrapper
 */
export interface IAiProviderResponse {
  statusCode: number;
  message: string;
  data: IAiProvider[];
}

// ----------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------

/**
 * Get parameter value from provider by label
 */
export function getProviderParameter(
  provider: IAiProvider,
  label: string
): string | null {
  const param = provider.parameters.find((p) => p.label === label);
  return param?.value || null;
}

/**
 * Get API Key from provider
 */
export function getProviderApiKey(provider: IAiProvider): string | null {
  return getProviderParameter(provider, 'API_KEY');
}

/**
 * Get GROUP_ID from provider (for MiniMax)
 */
export function getProviderGroupId(provider: IAiProvider): string | null {
  return getProviderParameter(provider, 'GROUP_ID');
}

/**
 * Get all parameters as a key-value map
 */
export function getProviderParametersMap(provider: IAiProvider): Record<string, string> {
  const map: Record<string, string> = {};
  provider.parameters.forEach((p) => {
    if (p.label && p.value) {
      map[p.label] = p.value;
    }
  });
  return map;
}

/**
 * Get default model from provider
 */
export function getDefaultModel(provider: IAiProvider): IAiProviderModel | undefined {
  return provider.models.find((m) => m.isDefault) || provider.models[0];
}

/**
 * Parse capabilities (can come as JSON string or array)
 */
export function parseCapabilities(capabilities: string | string[]): string[] {
  if (Array.isArray(capabilities)) {
    return capabilities;
  }
  try {
    return JSON.parse(capabilities);
  } catch {
    return [];
  }
}

/**
 * Get models by capability
 */
export function getModelsByCapability(
  provider: IAiProvider,
  capability: 'text' | 'code' | 'reasoning' | 'image' | 'video' | 'audio'
): IAiProviderModel[] {
  return provider.models.filter((m) => {
    const caps = parseCapabilities(m.capabilities);
    return caps.includes(capability);
  });
}

/**
 * Check if provider supports a capability
 */
export function providerSupportsCapability(
  provider: IAiProvider,
  capability: 'text' | 'code' | 'reasoning' | 'image' | 'video' | 'audio'
): boolean {
  return provider.models.some((m) => {
    const caps = parseCapabilities(m.capabilities);
    return caps.includes(capability);
  });
}

/**
 * Find model by key
 */
export function findModelByKey(
  provider: IAiProvider,
  modelKey: string
): IAiProviderModel | undefined {
  return provider.models.find((m) => m.modelKey === modelKey);
}

/**
 * Capability type
 */
export type AiCapability = 'text' | 'code' | 'reasoning' | 'image' | 'video' | 'audio';
