import { NextResponse } from 'next/server';

import { CONFIG } from 'src/global-config';

import { clearConfigCache, fetchAllProviders } from '../config/helper';

export const runtime = 'nodejs';

/**
 * Debug endpoint to check AI provider configuration
 * GET /api/ai/debug
 */
export async function GET() {
  try {
    // Clear cache first to force a fresh fetch
    clearConfigCache();

    const backendUrl = CONFIG.serverUrl 
      || process.env.NEXT_PUBLIC_HOST_API 
      || process.env.NEXT_PUBLIC_SERVER_URL;

    // Fetch providers
    const providers = await fetchAllProviders();

    // Build debug info
    const debugInfo = {
      config: {
        serverUrl: CONFIG.serverUrl ? '***configured***' : 'NOT SET',
        NEXT_PUBLIC_HOST_API: process.env.NEXT_PUBLIC_HOST_API ? '***configured***' : 'NOT SET',
        NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL ? '***configured***' : 'NOT SET',
        resolvedBackendUrl: backendUrl ? `${backendUrl.substring(0, 30)}...` : 'NOT SET',
      },
      providers: providers.map(p => ({
        id: p.id,
        name: p.name,
        isActive: p.isActive,
        isAvailable: p.isAvailable,
        parametersCount: p.parameters.length,
        parametersLabels: p.parameters.map(param => param.label),
        hasApiKey: p.parameters.some(param => param.label === 'API_KEY' && param.value),
        modelsCount: p.models.length,
      })),
      totalProviders: providers.length,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(debugInfo, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
