import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

import { PROVIDER_NAMES, getModelByCapability } from '../../config/helper';

export const runtime = 'nodejs'; // Supports FormData and dynamic config

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, model, seconds, size } = body;

    // Get authorization token from request headers
    const authToken = req.headers.get('Authorization');

    // Get video model config from OpenAI provider
    const modelConfig = await getModelByCapability(PROVIDER_NAMES.OPENAI, 'video', authToken || undefined);

    if (!modelConfig.apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please configure it in AI Provider Settings.' },
        { status: 500 }
      );
    }

    if (!modelConfig.endpoint) {
      return NextResponse.json(
        { error: 'OpenAI Video endpoint not configured. Please check AI Provider Settings.' },
        { status: 500 }
      );
    }

    // Create video generation job using multipart/form-data
    const formData = new FormData();
    formData.append('model', model || modelConfig.model?.modelKey || 'sora-2');
    formData.append('prompt', prompt);
    if (seconds) formData.append('seconds', seconds.toString());
    if (size) formData.append('size', size);

    console.log('[OpenAI Video] Using endpoint:', modelConfig.endpoint);
    console.log('[OpenAI Video] Request:', { prompt, model, seconds, size });

    // USE ENDPOINT FROM BACKEND
    const response = await fetch(modelConfig.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${modelConfig.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI video generation error response:', errorText);
      try {
        const errorData = JSON.parse(errorText);
        return NextResponse.json(
          { error: errorData.error?.message || 'OpenAI video generation error' },
          { status: response.status }
        );
      } catch {
        return NextResponse.json(
          { error: `OpenAI API error: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }
    }

    const data = await response.json();
    
    console.log('OpenAI video generation response:', data);
    
    return NextResponse.json({
      videoId: data.id,
      status: data.status,
      progress: data.progress,
      model: data.model,
    });
  } catch (error: any) {
    console.error('OpenAI video generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check video status
export async function GET(req: NextRequest) {
  try {
    // Get video model config from backend
    const modelConfig = await getModelByCapability(PROVIDER_NAMES.OPENAI, 'video');

    if (!modelConfig.apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please configure it in AI Provider Settings.' },
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

    // Construct status URL from base endpoint
    const baseUrl = modelConfig.endpoint?.replace(/\/[^/]*$/, '') || '';
    const statusUrl = `${baseUrl}/${videoId}`;

    console.log('[OpenAI Video Status] Checking:', statusUrl);

    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${modelConfig.apiKey}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to retrieve video status' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      videoId: data.id,
      status: data.status,
      progress: data.progress,
      model: data.model,
    });
  } catch (error: any) {
    console.error('OpenAI video status error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
