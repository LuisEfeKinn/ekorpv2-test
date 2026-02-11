import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

import { PROVIDER_NAMES, getModelByCapability } from '../../config/helper';

// Changed to nodejs to support dynamic config fetching and binary handling
export const runtime = 'nodejs';

// Extended timeout for image generation
export const maxDuration = 300; // 5 minutes

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, model } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Get authorization token from request headers
    const authToken = req.headers.get('Authorization');

    // Get image model config from Proprietary provider
    const modelConfig = await getModelByCapability(PROVIDER_NAMES.PROPRIETARY, 'image', authToken || undefined);

    if (!modelConfig.endpoint) {
      return NextResponse.json(
        { error: 'Proprietary Image endpoint not configured. Please check AI Provider Settings.' },
        { status: 500 }
      );
    }

    console.log('[Proprietary Image] Using endpoint:', modelConfig.endpoint);
    console.log('[Proprietary Image] Request payload:', { prompt, model: model || modelConfig.model?.modelKey });

    // Send POST request to proprietary endpoint
    const response = await fetch(modelConfig.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add API key or additional headers if needed from modelConfig.parameters
        ...(modelConfig.apiKey ? { 'Authorization': `Bearer ${modelConfig.apiKey}` } : {}),
      },
      body: JSON.stringify({
        prompt,
        ...(model ? { model } : {}),
      }),
    });

    if (!response.ok) {
      console.error('[Proprietary Image] Generation failed:', response.status, response.statusText);
      
      // Try to get error details
      let errorMessage = 'Proprietary image generation failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        errorMessage = `${errorMessage}: ${response.statusText}`;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    // Response is a binary image
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';
    
    console.log('[Proprietary Image] Image received, size:', imageBuffer.byteLength, 'bytes');
    console.log('[Proprietary Image] Content-Type:', contentType);

    // Convert to base64
    const base64 = Buffer.from(imageBuffer).toString('base64');

    // Return as base64 (similar to upload-generated-image endpoint)
    return NextResponse.json({
      base64,
      contentType,
      fileName: `proprietary-${Date.now()}.${contentType.includes('png') ? 'png' : 'jpg'}`,
      size: imageBuffer.byteLength,
    });
  } catch (error: any) {
    console.error('[Proprietary Image] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
