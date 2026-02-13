import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Downloads an AI-generated image from external URL and returns it as blob
 * This bypasses CORS restrictions by downloading server-side
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageUrl, fileName } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'imageUrl is required' },
        { status: 400 }
      );
    }

    // Download image from external URL (server-side, no CORS issues)
    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to download image from external URL' },
        { status: imageResponse.status }
      );
    }

    const imageBlob = await imageResponse.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    return NextResponse.json({
      base64,
      contentType: imageResponse.headers.get('content-type') || 'image/png',
      fileName: fileName || `ai-generated-${Date.now()}.png`,
    });
  } catch (error: any) {
    console.error('Image download error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to download image' },
      { status: 500 }
    );
  }
}
