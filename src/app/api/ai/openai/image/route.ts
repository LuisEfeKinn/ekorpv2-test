import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

import { PROVIDER_NAMES, getModelByCapability } from '../../config/helper';

// Changed to nodejs to support dynamic config fetching
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, model, size, quality, style, n } = body;

    // Get authorization token from request headers
    const authToken = req.headers.get('Authorization');

    // Get image model config from OpenAI provider
    const modelConfig = await getModelByCapability(PROVIDER_NAMES.OPENAI, 'image', authToken || undefined);

    if (!modelConfig.apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please configure it in AI Provider Settings.' },
        { status: 500 }
      );
    }

    if (!modelConfig.endpoint) {
      return NextResponse.json(
        { error: 'OpenAI Image endpoint not configured. Please check AI Provider Settings.' },
        { status: 500 }
      );
    }

    console.log('[OpenAI Image] Using endpoint:', modelConfig.endpoint);

    // USE ENDPOINT FROM BACKEND
    const response = await fetch(modelConfig.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${modelConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: model || modelConfig.model?.modelKey || 'dall-e-3',
        prompt,
        size: size || '1024x1024',
        quality: quality || 'standard',
        style: style || 'vivid',
        n: n || 1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error?.message || 'OpenAI image generation error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Return the first image URL
    return NextResponse.json({
      url: data.data[0].url,
      revisedPrompt: data.data[0].revised_prompt,
    });
  } catch (error: any) {
    console.error('OpenAI image generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
