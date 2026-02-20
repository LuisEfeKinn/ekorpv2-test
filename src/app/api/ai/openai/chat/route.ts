import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

import { PROVIDER_NAMES, getModelConfig } from '../../config/helper';

// Changed to nodejs to support dynamic config fetching
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, model, temperature, max_tokens, max_completion_tokens, stream, top_p, frequency_penalty, presence_penalty } = body;

    // Get authorization token from request headers
    const authToken = req.headers.get('Authorization');

    // Get model config from backend (includes endpoint and API key)
    const modelConfig = await getModelConfig(PROVIDER_NAMES.OPENAI, model, authToken || undefined);
    
    if (!modelConfig.apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please configure it in AI Provider Settings.' },
        { status: 500 }
      );
    }

    if (!modelConfig.endpoint) {
      return NextResponse.json(
        { error: 'OpenAI endpoint not configured. Please check AI Provider Settings.' },
        { status: 500 }
      );
    }

    // Use max_completion_tokens if provided, otherwise fall back to max_tokens
    const tokenLimit = max_completion_tokens ?? max_tokens ?? modelConfig.model?.maxTokens ?? 4096;

    // Build request body
    const requestPayload: any = {
      messages,
      model: model || modelConfig.model?.modelKey || 'gpt-4',
      max_completion_tokens: tokenLimit,
      stream: stream ?? true,
    };

    // Only include temperature if explicitly set to 1, otherwise omit it
    if (temperature === 1) {
      requestPayload.temperature = 1;
    }

    // Add optional parameters if provided
    if (top_p !== undefined) requestPayload.top_p = top_p;
    if (frequency_penalty !== undefined) requestPayload.frequency_penalty = frequency_penalty;
    if (presence_penalty !== undefined) requestPayload.presence_penalty = presence_penalty;

    // USE ENDPOINT FROM BACKEND
    const response = await fetch(modelConfig.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${modelConfig.apiKey}`,
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error?.message || 'OpenAI API error' },
        { status: response.status }
      );
    }

    // If streaming, return the stream directly
    if (stream) {
      return new NextResponse(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // If not streaming, return JSON
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
