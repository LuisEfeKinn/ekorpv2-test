import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

import { PROVIDER_NAMES, getProviderConfig } from '../../../config/helper';

export const runtime = 'nodejs'; // Changed from 'edge' for better compatibility

export async function GET(req: NextRequest) {
  try {
    // Get config from backend
    const providerConfig = await getProviderConfig(PROVIDER_NAMES.OPENAI);
    const apiKey = providerConfig.apiKey;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const videoId = req.nextUrl.searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json(
        { error: 'videoId parameter is required' },
        { status: 400 }
      );
    }

    // Download video content
    const response = await fetch(`https://api.openai.com/v1/videos/${videoId}/content`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to download video' },
        { status: response.status }
      );
    }

    // Convert to base64 for client
    const videoBlob = await response.blob();
    const arrayBuffer = await videoBlob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    return NextResponse.json({
      base64,
      contentType: response.headers.get('content-type') || 'video/mp4',
    });
  } catch (error: any) {
    console.error('OpenAI video download error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
