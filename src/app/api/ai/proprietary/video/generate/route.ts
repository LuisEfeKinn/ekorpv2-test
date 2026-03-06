import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

import { PROVIDER_NAMES, getProviderConfig } from '../../../config/helper';

export const runtime = 'nodejs';

// Extended timeout for N8N webhook (can take several minutes)
export const maxDuration = 300; // 20 minutes

export async function POST(req: NextRequest) {
  try {
    // Get authorization token from request headers
    const authToken = req.headers.get('Authorization');

    // Get configuration from backend
    const providerConfig = await getProviderConfig(PROVIDER_NAMES.PROPRIETARY, authToken || undefined);
    
    const n8nWebhookUrl = providerConfig.webhookUrl;

    if (!n8nWebhookUrl) {
      return NextResponse.json(
        { error: 'N8N_WEBHOOK_URL not configured. Please configure it in AI Provider Settings.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { user_prompt, duration_scences, scences_number, image_model } = body;

    // Validate required fields
    if (!user_prompt) {
      return NextResponse.json(
        { error: 'user_prompt is required' },
        { status: 400 }
      );
    }

    // Validate duration_scences (must be 4, 6, or 12)
    const validDurations = [4, 6, 12];
    const duration = duration_scences || 4;
    if (!validDurations.includes(duration)) {
      return NextResponse.json(
        { error: 'duration_scences must be 4, 6, or 12' },
        { status: 400 }
      );
    }

    // Validate scences_number
    const scenes = scences_number || 5;
    if (scenes < 1 || scenes > 20) {
      return NextResponse.json(
        { error: 'scences_number must be between 1 and 20' },
        { status: 400 }
      );
    }

    const payload = {
      user_prompt,
      duration_scences: duration,
      scences_number: scenes,
      image_model,
    };

    console.log('[N8N Video] Request payload:', JSON.stringify(payload, null, 2));

    // Build the full N8N webhook URL
    const fullUrl = `${n8nWebhookUrl}/ai-video-generator`;
    console.log('[N8N Video] Calling webhook:', fullUrl);

    // Call N8N webhook - no authentication required
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type')?.toLowerCase() || '';
      let errorPayload: unknown = null;

      if (contentType.includes('application/json')) {
        errorPayload = await response.json().catch(() => null);
      } else {
        const errorText = await response.text();
        errorPayload = errorText ? { error: errorText } : null;
      }

      const normalizedError =
        errorPayload && typeof errorPayload === 'object'
          ? errorPayload
          : { error: `N8N webhook failed: ${response.status}` };

      console.error('[N8N Video] Error response:', response.status, normalizedError);
      return NextResponse.json(normalizedError, { status: response.status });
    }

    const data = await response.json();
    console.log('[N8N Video] Response:', JSON.stringify(data, null, 2));

    // Return the N8N response directly
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[N8N Video] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
