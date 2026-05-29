// ----------------------------------------------------------------------
// useAiProvidersDynamic Hook - Dynamic AI Provider management from Backend
// Simplified structure - all providers come from GetAIProvidersService
// ----------------------------------------------------------------------

import type { IAiProvider, IAiProviderModel } from 'src/types/ai-provider';

import { useMemo, useState, useEffect, useCallback } from 'react';

import {
  GetProvidersByCapability,
  GetCachedProvidersService,
} from 'src/services/ai/GetAiProviders.service';

import { parseCapabilities } from 'src/types/ai-provider';

// ----------------------------------------------------------------------

// Legacy type for backwards compatibility
export type AiProviderType = 'openai' | 'gemini' | 'minimax' | 'proprietary';

// Map provider names to legacy types
const PROVIDER_NAME_TO_TYPE: Record<string, AiProviderType> = {
  OpenAI: 'openai',
  'Google AI': 'gemini',
  MiniMax: 'minimax',
  Propietario: 'proprietary',
};

// Map provider names to API routes
const PROVIDER_NAME_TO_ROUTE: Record<string, string> = {
  OpenAI: '/api/ai/openai',
  'Google AI': '/api/ai/gemini',
  MiniMax: '/api/ai/minimax',
  Propietario: '/api/ai/proprietary',
};

// ----------------------------------------------------------------------

interface UseAiProvidersDynamicOptions {
  defaultProviderId?: string;
  defaultModelId?: string;
  capability?: 'text' | 'image' | 'video' | 'audio';
  autoLoad?: boolean;
}

interface UseAiProvidersDynamicReturn {
  // State
  isLoading: boolean;
  error: string | null;

  // Providers
  providers: IAiProvider[];
  textProviders: IAiProvider[];
  imageProviders: IAiProvider[];
  videoProviders: IAiProvider[];

  // Selected provider
  selectedProvider: IAiProvider | null;
  selectedModel: IAiProviderModel | null;

  // Settings
  temperature: number;
  maxTokens: number;

  // Available models for current provider (filtered by capability)
  availableModels: IAiProviderModel[];

  // Actions
  selectProvider: (providerId: string) => void;
  selectModel: (modelId: string) => void;
  setTemperature: (temp: number) => void;
  setMaxTokens: (tokens: number) => void;
  refreshProviders: () => Promise<void>;

  // Helpers
  getProviderName: (providerId: string) => string;
  getModelName: (modelId: string) => string;
  getProviderByName: (name: string) => IAiProvider | undefined;
  getProviderConfig: () => IAiProviderConfig;
  getLegacyProviderType: (provider: IAiProvider) => AiProviderType;
}

// Configuration object to pass to streaming/generation functions
export interface IAiProviderConfig {
  providerId: string;
  providerName: string;
  modelId: string;
  modelKey: string;
  endpoint: string;
  temperature: number;
  maxTokens: number;
  supportsStreaming: boolean;
  legacyType: AiProviderType;
}

// ----------------------------------------------------------------------

export function useAiProvidersDynamic(
  options?: UseAiProvidersDynamicOptions
): UseAiProvidersDynamicReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [providers, setProviders] = useState<IAiProvider[]>([]);
  const [textProviders, setTextProviders] = useState<IAiProvider[]>([]);
  const [imageProviders, setImageProviders] = useState<IAiProvider[]>([]);
  const [videoProviders, setVideoProviders] = useState<IAiProvider[]>([]);

  const [selectedProviderId, setSelectedProviderId] = useState<string>(
    options?.defaultProviderId || ''
  );
  const [selectedModelId, setSelectedModelId] = useState<string>(options?.defaultModelId || '');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(4096);

  // Load providers from backend
  const loadProviders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load all providers and categorized ones in parallel
      const [allProviders, text, image, video] = await Promise.all([
        GetCachedProvidersService(),
        GetProvidersByCapability('text'),
        GetProvidersByCapability('image'),
        GetProvidersByCapability('video'),
      ]);

      setProviders(allProviders);
      setTextProviders(text);
      setImageProviders(image);
      setVideoProviders(video);

      // Auto-select provider with default model if none selected
      if (!selectedProviderId && allProviders.length > 0) {
        let providerToSelect: IAiProvider | null = null;
        let modelToSelect: IAiProviderModel | null = null;

        // Try to find a provider with a default model for the specified capability
        const providersToSearch = options?.capability === 'text' ? text : 
                                 options?.capability === 'image' ? image :
                                 options?.capability === 'video' ? video :
                                 text.length > 0 ? text : allProviders;

        // Search through providers to find one with isDefault model
        for (const provider of providersToSearch) {
          const models = provider.models || [];
          
          // Filter by capability if specified
          const filteredModels = options?.capability 
            ? models.filter((m) => {
                const caps = parseCapabilities(m.capabilities);
                return caps.includes(options.capability!);
              })
            : models;

          // Look for default model
          const defaultModel = filteredModels.find((m: IAiProviderModel) => m.isDefault);
          if (defaultModel) {
            providerToSelect = provider;
            modelToSelect = defaultModel;
            break; // Found first provider with default model
          }
        }

        // If no provider with default model found, use first available
        if (!providerToSelect && providersToSearch.length > 0) {
          providerToSelect = providersToSearch[0];
          const models = providerToSelect.models || [];
          const filteredModels = options?.capability 
            ? models.filter((m) => {
                const caps = parseCapabilities(m.capabilities);
                return caps.includes(options.capability!);
              })
            : models;
          modelToSelect = filteredModels[0] || models[0];
        }

        // Set selected provider and model
        if (providerToSelect) {
          setSelectedProviderId(providerToSelect.id);
          
          if (modelToSelect) {
            setSelectedModelId(modelToSelect.id);
            setMaxTokens(modelToSelect.maxTokens || 4096);
          }
        }
      }
    } catch (err: any) {
      console.error('Error loading AI providers:', err);
      setError(err?.message || 'Error loading AI providers');
    } finally {
      setIsLoading(false);
    }
  }, [selectedProviderId, options?.capability]);

  // Auto-load on mount
  useEffect(() => {
    if (options?.autoLoad !== false) {
      loadProviders();
    }
  }, [loadProviders, options?.autoLoad]);

  // Current selected provider
  const selectedProvider = useMemo(
    () => providers.find((p) => p.id === selectedProviderId) || null,
    [providers, selectedProviderId]
  );

  // Available models for current provider (filtered by capability if specified)
  const availableModels = useMemo(() => {
    if (!selectedProvider) return [];

    // Defensive check for models array
    const models = selectedProvider.models || [];

    if (options?.capability) {
      return models.filter((m) => {
        const caps = parseCapabilities(m.capabilities);
        return caps.includes(options.capability!);
      });
    }

    return models;
  }, [selectedProvider, options?.capability]);

  // Current selected model
  const selectedModel = useMemo(
    () => availableModels.find((m) => m.id === selectedModelId) || availableModels[0] || null,
    [availableModels, selectedModelId]
  );

  // Select provider
  const selectProvider = useCallback(
    (providerId: string) => {
      const provider = providers.find((p) => p.id === providerId);
      if (provider) {
        setSelectedProviderId(providerId);

        // Auto-select default model (with defensive check)
        const models = provider.models || [];
        const defaultModel =
          models.find((m: IAiProviderModel) => m.isDefault) || models[0];
        if (defaultModel) {
          setSelectedModelId(defaultModel.id);
          setMaxTokens(defaultModel.maxTokens || 4096);
        }
      }
    },
    [providers]
  );

  // Select model
  const selectModel = useCallback(
    (modelId: string) => {
      const model = availableModels.find((m) => m.id === modelId);
      if (model) {
        setSelectedModelId(modelId);
        setMaxTokens(model.maxTokens || 4096);
      }
    },
    [availableModels]
  );

  // Get provider display name
  const getProviderName = useCallback(
    (providerId: string): string => {
      const provider = providers.find((p) => p.id === providerId);
      return provider?.name || providerId;
    },
    [providers]
  );

  // Get model display name
  const getModelName = useCallback(
    (modelId: string): string => {
      for (const provider of providers) {
        const model = provider.models.find((m) => m.id === modelId);
        if (model) return model.name;
      }
      return modelId;
    },
    [providers]
  );

  // Get provider by name
  const getProviderByName = useCallback(
    (name: string): IAiProvider | undefined =>
      providers.find((p) => p.name.toLowerCase() === name.toLowerCase()),
    [providers]
  );

  // Get legacy provider type
  const getLegacyProviderType = useCallback(
    (provider: IAiProvider): AiProviderType => PROVIDER_NAME_TO_TYPE[provider.name] || 'openai',
    []
  );

  // Get configuration object
  const getProviderConfig = useCallback((): IAiProviderConfig => {
    if (!selectedProvider || !selectedModel) {
      return {
        providerId: '',
        providerName: '',
        modelId: '',
        modelKey: '',
        endpoint: '',
        temperature,
        maxTokens,
        supportsStreaming: false,
        legacyType: 'openai',
      };
    }

    return {
      providerId: selectedProvider.id,
      providerName: selectedProvider.name,
      modelId: selectedModel.id,
      modelKey: selectedModel.modelKey,
      endpoint: selectedModel.endpoint,
      temperature,
      maxTokens,
      supportsStreaming: selectedProvider.supportsStreaming,
      legacyType: getLegacyProviderType(selectedProvider),
    };
  }, [selectedProvider, selectedModel, temperature, maxTokens, getLegacyProviderType]);

  return {
    // State
    isLoading,
    error,

    // Providers
    providers,
    textProviders,
    imageProviders,
    videoProviders,

    // Selected
    selectedProvider,
    selectedModel,

    // Settings
    temperature,
    maxTokens,

    // Available models
    availableModels,

    // Actions
    selectProvider,
    selectModel,
    setTemperature,
    setMaxTokens,
    refreshProviders: loadProviders,

    // Helpers
    getProviderName,
    getModelName,
    getProviderByName,
    getProviderConfig,
    getLegacyProviderType,
  };
}

// ----------------------------------------------------------------------
// Static helper functions (for use outside of React components)
// ----------------------------------------------------------------------

let cachedProviders: IAiProvider[] = [];

/**
 * Initialize providers cache (call this early in app lifecycle)
 */
export async function initializeProvidersCache(): Promise<void> {
  cachedProviders = await GetCachedProvidersService();
}

/**
 * Get provider by name (sync, uses cache)
 */
export function getProviderByNameSync(name: string): IAiProvider | undefined {
  return cachedProviders.find((p) => p.name.toLowerCase() === name.toLowerCase());
}

/**
 * Get legacy provider type from provider name
 */
export function getLegacyTypeFromName(providerName: string): AiProviderType {
  return PROVIDER_NAME_TO_TYPE[providerName] || 'openai';
}

/**
 * Get the API route path for a provider
 */
export function getApiRouteForProvider(providerName: string): string {
  return PROVIDER_NAME_TO_ROUTE[providerName] || '/api/ai/openai';
}

/**
 * Get the specific API route for a capability
 */
export function getApiRouteForCapability(
  providerName: string,
  capability: 'text' | 'image' | 'video' | 'audio'
): string {
  const baseRoute = getApiRouteForProvider(providerName);

  switch (capability) {
    case 'text':
      return `${baseRoute}/chat`;
    case 'image':
      return `${baseRoute}/image`;
    case 'video':
      return `${baseRoute}/video`;
    case 'audio':
      return `${baseRoute}/audio`;
    default:
      return `${baseRoute}/chat`;
  }
}
