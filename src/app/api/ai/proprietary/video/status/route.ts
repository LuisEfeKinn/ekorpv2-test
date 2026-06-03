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
    const json2VideoUrl = providerConfig.apiUrl;

    if (!json2VideoUrl) {
      return NextResponse.json(
        { error: 'API_URL not configured. Please configure it in AI Provider Settings.' },
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

    // Build the full JSON VIDEO ENGINE API URL
    const fullUrl = `${json2VideoUrl}/api/v1/videos/${projectId}`;
    console.log('[JSON VIDEO ENGINE Status] Checking project:', projectId);

    // Call JSON VIDEO ENGINE API with authentication
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[JSON VIDEO ENGINE Status] Error response:', response.status, errorText);
      return NextResponse.json(
        { error: `JSON VIDEO ENGINE API failed: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[JSON VIDEO ENGINE Status] Response:', JSON.stringify(data, null, 2));

    if (data?.movie?.status === 'error' || data?.movie?.success === false || data?.success === false) {
      const errorMessage = data?.movie?.message || 'Error en la generación del video';
      return NextResponse.json(
        { error: errorMessage, details: data },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[JSON VIDEO ENGINE Status] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
