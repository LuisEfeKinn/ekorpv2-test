// ----------------------------------------------------------------------
// AI Providers Service - Single endpoint for all provider data
// ----------------------------------------------------------------------

import type { IAiProvider, IAiProviderResponse } from 'src/types/ai-provider';

import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

/**
 * Get all AI providers with their models and parameters
 * This is the ONLY service needed - returns everything
 */
export const GetAIProvidersService = async (): Promise<IAiProviderResponse> => {
  const response = await axios.get<IAiProviderResponse>(endpoints.ai.providers.all);
  return response.data;
};

// ----------------------------------------------------------------------
// Provider Cache (to avoid repeated API calls)
// ----------------------------------------------------------------------

let providersCache: IAiProvider[] | null = null;
let providersCacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get all providers with caching
 */
export const GetCachedProvidersService = async (): Promise<IAiProvider[]> => {
  const now = Date.now();

  if (providersCache && now - providersCacheTimestamp < CACHE_DURATION) {
    return providersCache;
  }

  const response = await GetAIProvidersService();
  providersCache = response.data;
  providersCacheTimestamp = now;

  return providersCache;
};

/**
 * Clear the providers cache (call after updating settings)
 */
export const ClearProvidersCache = (): void => {
  providersCache = null;
  providersCacheTimestamp = 0;
};

/**
 * Find a provider by name
 */
export const FindProviderByName = async (name: string): Promise<IAiProvider | undefined> => {
  const providers = await GetCachedProvidersService();
  return providers.find((p) => p.name.toLowerCase() === name.toLowerCase());
};

/**
 * Find a provider by ID
 */
export const FindProviderById = async (id: string): Promise<IAiProvider | undefined> => {
  const providers = await GetCachedProvidersService();
  return providers.find((p) => p.id === id);
};

/**
 * Get providers that support a specific capability
 */
export const GetProvidersByCapability = async (
  capability: 'text' | 'code' | 'reasoning' | 'image' | 'video' | 'audio'
): Promise<IAiProvider[]> => {
  const providers = await GetCachedProvidersService();
  return providers.filter((provider) => {
    // Defensive check - ensure models array exists
    if (!provider.models || !Array.isArray(provider.models)) {
      return false;
    }
    return provider.models.some((model) => {
      try {
        const caps =
          typeof model.capabilities === 'string'
            ? JSON.parse(model.capabilities)
            : model.capabilities || [];
        return Array.isArray(caps) && caps.includes(capability);
      } catch {
        return false;
      }
    });
  });
};
