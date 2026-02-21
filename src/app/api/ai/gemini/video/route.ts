import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    // Gemini video generation (Veo 3) is only available via Vertex AI,
    // not through the public Gemini API.
    // 
    // To use Veo 3 for video generation, you would need:
    // 1. Google Cloud Project with Vertex AI enabled
    // 2. Service Account with proper permissions
    // 3. Using @google-cloud/aiplatform library
    //
    // This endpoint returns 501 to trigger fallback to OpenAI Sora
    
    console.log('[Gemini Video] Video generation not available - requires Vertex AI setup');
    
    return NextResponse.json(
      { 
        error: 'Gemini video generation (Veo 3) requires Vertex AI setup and is not available through the public API. Falling back to OpenAI Sora.'
      },
      { status: 501 } // 501 Not Implemented - triggers fallback in service
    );
  } catch (error: any) {
    console.error('Gemini video generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
