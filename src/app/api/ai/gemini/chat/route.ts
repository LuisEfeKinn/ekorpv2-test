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
    
    // Build endpoint: strip trailing slash from base URL, then append
    // /{model}:streamGenerateContent if the endpoint doesn't already include it.
    let endpoint = modelConfig.endpoint.replace(/\/$/, '');
    if (!endpoint.includes(':streamGenerateContent') && !endpoint.includes(':generateContent')) {
      endpoint = `${endpoint}/${modelName}:streamGenerateContent`;
    }
    // Replace {model} placeholder if the backend stores it that way
    endpoint = endpoint.replace('{model}', modelName);

    if (!endpoint.includes('?')) {
      endpoint += `?alt=sse&key=${modelConfig.apiKey}`;
    } else {
      endpoint += `&alt=sse&key=${modelConfig.apiKey}`;
    }

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
      let errorMessage = 'Gemini API error';
      try {
        const errorText = await response.text();
        const errorData = errorText ? JSON.parse(errorText) : {};
        errorMessage = errorData.error?.message || errorMessage;
      } catch {
        // ignore parse errors — keep default message
      }
      return NextResponse.json(
        { error: errorMessage },
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
