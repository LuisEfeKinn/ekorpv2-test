import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

import { PROVIDER_NAMES, getModelConfig } from '../../config/helper';

// Changed to nodejs to support dynamic config fetching
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contents, generationConfig, model } = body;

    // Get authorization token from request headers
    const authToken = req.headers.get('Authorization');

    // Get model config from backend (includes endpoint and API key)
    const modelConfig = await getModelConfig(PROVIDER_NAMES.GOOGLE, model, authToken || undefined);
    
    if (!modelConfig.apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured. Please configure it in AI Provider Settings.' },
        { status: 500 }
      );
    }

    if (!modelConfig.endpoint) {
      return NextResponse.json(
        { error: 'Gemini endpoint not configured. Please check AI Provider Settings.' },
        { status: 500 }
      );
    }

    const modelName = model || modelConfig.model?.modelKey || 'gemini-pro';
    
    // Build endpoint with streaming params and API key
    // The backend stores base endpoint, we add streaming params
    let endpoint = modelConfig.endpoint;
    if (!endpoint.includes('?')) {
      endpoint += `?alt=sse&key=${modelConfig.apiKey}`;
    } else {
      endpoint += `&alt=sse&key=${modelConfig.apiKey}`;
    }
    
    // Replace model placeholder if exists
    endpoint = endpoint.replace('{model}', modelName);

    console.log('[Gemini Chat] Using endpoint:', endpoint.replace(modelConfig.apiKey, '***'));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error?.message || 'Gemini API error' },
        { status: response.status }
      );
    }

    // Return the stream directly
    return new NextResponse(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Gemini API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
