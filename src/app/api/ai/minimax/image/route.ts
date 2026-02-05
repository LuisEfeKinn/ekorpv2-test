import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

import { PROVIDER_NAMES, getModelByCapability } from '../../config/helper';

// Changed to nodejs to support dynamic config fetching
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, model, size } = body;

    // Get authorization token from request headers
    const authToken = req.headers.get('Authorization');

    // Get image model config from MiniMax provider
    const modelConfig = await getModelByCapability(PROVIDER_NAMES.MINIMAX, 'image', authToken || undefined);

    if (!modelConfig.apiKey) {
      return NextResponse.json(
        { error: 'MiniMax API key not configured. Please configure it in AI Provider Settings.' },
        { status: 500 }
      );
    }

    if (!modelConfig.endpoint) {
      return NextResponse.json(
        { error: 'MiniMax Image endpoint not configured. Please check AI Provider Settings.' },
        { status: 500 }
      );
    }
    
    // Parse size to aspect_ratio (default 1:1)
    let aspectRatio = '1:1';
    if (size) {
      if (size.includes('1024x1024')) aspectRatio = '1:1';
      else if (size.includes('1792x1024')) aspectRatio = '16:9';
      else if (size.includes('1024x1792')) aspectRatio = '9:16';
    }
    
    const payload = {
      model: model || modelConfig.model?.modelKey || 'image-01',
      prompt,
      aspect_ratio: aspectRatio,
      num_images: 1,
      prompt_optimizer: true
    };
    
    console.log('[MiniMax Image] Using endpoint:', modelConfig.endpoint);
    console.log('[MiniMax Image] Request payload:', JSON.stringify(payload, null, 2));

    // USE ENDPOINT FROM BACKEND
    const response = await fetch(modelConfig.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${modelConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[MiniMax Image] Error:', errorData);
      return NextResponse.json(
        { error: errorData.base_resp?.status_msg || 'MiniMax image generation failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    console.log('[MiniMax Image] Full response:', JSON.stringify(data, null, 2));
    
    const imageUrl = 
      data.data?.image_urls?.[0] ||
      data.data?.images?.[0]?.url || 
      data.data?.file_url || 
      data.file_url ||
      data.images?.[0]?.url ||
      data.url;

    if (!imageUrl) {
      console.error('[MiniMax Image] No image URL found in response structure');
      return NextResponse.json(
        { error: 'No image URL in response', responseData: data },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: imageUrl,
      revisedPrompt: prompt,
    });
  } catch (error: any) {
    console.error('MiniMax image generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
