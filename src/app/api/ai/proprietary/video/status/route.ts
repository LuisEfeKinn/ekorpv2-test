import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

import { PROVIDER_NAMES, getProviderConfig } from '../../../config/helper';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    // Get authorization token from request headers
    const authToken = req.headers.get('Authorization');

    // Get config from backend
    const providerConfig = await getProviderConfig(PROVIDER_NAMES.PROPRIETARY, authToken || undefined);
    const json2VideoUrl = providerConfig.json2VideoWebhookUrl;
    const json2VideoApiKey = providerConfig.json2VideoApiKey;

    if (!json2VideoUrl) {
      return NextResponse.json(
        { error: 'JSON2VIDEO_WEBHOOK_URL not configured. Please configure it in AI Provider Settings.' },
        { status: 500 }
      );
    }

    if (!json2VideoApiKey) {
      return NextResponse.json(
        { error: 'JSON2VIDEO_API_KEY not configured. Please configure it in AI Provider Settings.' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('project');

    if (!projectId) {
      return NextResponse.json(
        { error: 'project parameter is required' },
        { status: 400 }
      );
    }

    // Build the full JSON2Video API URL
    const fullUrl = `${json2VideoUrl}/v2/movies/?project=${projectId}`;
    console.log('[JSON2Video Status] Checking project:', projectId);

    // Call JSON2Video API with authentication
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'x-api-key': json2VideoApiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[JSON2Video Status] Error response:', response.status, errorText);
      return NextResponse.json(
        { error: `JSON2Video API failed: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[JSON2Video Status] Response:', JSON.stringify(data, null, 2));

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[JSON2Video Status] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
