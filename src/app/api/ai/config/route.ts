import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------
// AI Provider Configuration Endpoint
// Fetches provider configuration from backend including API keys
// This endpoint is used by other API routes to get dynamic configuration
// ----------------------------------------------------------------------

export const runtime = 'nodejs';

// Cache for provider configurations
let providerConfigCache: Map<string, any> = new Map();
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get provider configuration from backend
 */
async function fetchProviderConfig(providerKey: string): Promise<any | null> {
  try {
    const now = Date.now();
    
    // Check cache
    if ((now - cacheTimestamp) < CACHE_DURATION && providerConfigCache.has(providerKey)) {
      return providerConfigCache.get(providerKey);
    }
    
    // Fetch from backend
    const backendUrl = CONFIG.serverUrl;
    const response = await fetch(`${backendUrl}/ai-providers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('[AI Config] Failed to fetch providers from backend:', response.status);
      return null;
    }
    
    const data = await response.json();
    const providers = data.data || [];
    
    // Update cache with all providers
    providerConfigCache = new Map();
    providers.forEach((provider: any) => {
      providerConfigCache.set(provider.key, provider);
    });
    cacheTimestamp = now;
    
    return providerConfigCache.get(providerKey) || null;
  } catch (error) {
    console.error('[AI Config] Error fetching provider config:', error);
    return null;
  }
}

/**
 * Get API key for a provider from ai-provider-configs
 */
async function fetchProviderApiKey(providerId: string): Promise<Record<string, string>> {
  try {
    const backendUrl = CONFIG.serverUrl;
    const response = await fetch(`${backendUrl}/ai-provider-configs?providerId=${providerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('[AI Config] Failed to fetch provider config:', response.status);
      return {};
    }
    
    const data = await response.json();
    const configs = data.data || [];
    
    // Build parameters map
    const parameters: Record<string, string> = {};
    
    configs.forEach((config: any) => {
      if (config.aiProviderParameter?.typeParameterAIProvider?.key && config.value) {
        parameters[config.aiProviderParameter.typeParameterAIProvider.key] = config.value;
      }
    });
    
    return parameters;
  } catch (error) {
    console.error('[AI Config] Error fetching provider API key:', error);
    return {};
  }
}

// ----------------------------------------------------------------------
// GET endpoint to retrieve provider configuration
// ----------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const providerKey = req.nextUrl.searchParams.get('providerKey');
    
    if (!providerKey) {
      return NextResponse.json(
        { error: 'providerKey is required' },
        { status: 400 }
      );
    }
    
    const provider = await fetchProviderConfig(providerKey);
    
    if (!provider) {
      return NextResponse.json(
        { error: `Provider ${providerKey} not found` },
        { status: 404 }
      );
    }
    
    // Get API keys for this provider
    const parameters = await fetchProviderApiKey(provider.id);
    
    return NextResponse.json({
      provider,
      parameters,
    });
  } catch (error: any) {
    console.error('[AI Config] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
