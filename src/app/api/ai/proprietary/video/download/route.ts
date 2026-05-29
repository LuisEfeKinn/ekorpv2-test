import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoUrl = searchParams.get('url');

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video URL is required' },
        { status: 400 }
      );
    }

    console.log('[Proprietary Video Proxy] Downloading video from:', videoUrl);

    // Download video from JSON2Video CDN (no CORS on server-side)
    const videoResponse = await fetch(videoUrl);

    if (!videoResponse.ok) {
      console.error('[Proprietary Video Proxy] Failed to download:', videoResponse.status);
      return NextResponse.json(
        { error: 'Failed to download video' },
        { status: videoResponse.status }
      );
    }

    // Get video data
    const videoBuffer = await videoResponse.arrayBuffer();
    console.log('[Proprietary Video Proxy] Video downloaded, size:', videoBuffer.byteLength, 'bytes');

    // Return video with proper headers
    return new NextResponse(videoBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': videoBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('[Proprietary Video Proxy] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to proxy video' },
      { status: 500 }
    );
  }
}
