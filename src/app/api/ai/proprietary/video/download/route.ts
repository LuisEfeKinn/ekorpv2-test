import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function getDownloadErrorMessage(status: number, errorText: string): string {
  const normalizedText = errorText.toLowerCase();

  if (status === 403 && normalizedText.includes('accessdenied')) {
    return 'The source video URL is not publicly accessible (S3 AccessDenied). Use a signed URL or make the object readable by the server.';
  }

  if (status === 404) {
    return 'The source video file was not found.';
  }

  return `Failed to download video from source: ${status}`;
}

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

    let parsedVideoUrl: URL;
    try {
      parsedVideoUrl = new URL(videoUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid video URL' },
        { status: 400 }
      );
    }

    if (!['http:', 'https:'].includes(parsedVideoUrl.protocol)) {
      return NextResponse.json(
        { error: 'Only HTTP and HTTPS video URLs are supported' },
        { status: 400 }
      );
    }

    // Download video from JSON2Video CDN (no CORS on server-side)
    const videoResponse = await fetch(parsedVideoUrl.toString(), {
      headers: {
        Accept: 'video/*,*/*;q=0.8',
      },
      redirect: 'follow',
      cache: 'no-store',
    });

    if (!videoResponse.ok) {
      const errorText = await videoResponse.text().catch(() => '');
      const errorMessage = getDownloadErrorMessage(videoResponse.status, errorText);

      console.error(
        '[Proprietary Video Proxy] Failed to download:',
        JSON.stringify(
          {
            status: videoResponse.status,
            statusText: videoResponse.statusText,
            sourceUrl: parsedVideoUrl.toString(),
            contentType: videoResponse.headers.get('content-type'),
            bodySnippet: errorText.slice(0, 500),
          },
          null,
          2
        )
      );

      return NextResponse.json(
        {
          error: errorMessage,
          upstreamStatus: videoResponse.status,
          sourceUrl: parsedVideoUrl.toString(),
        },
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
