import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

import { PROVIDER_NAMES, getModelByCapability } from '../../config/helper';

export const runtime = 'nodejs'; // Supports longer timeouts and dynamic config

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, model, seconds } = body;

    // Get authorization token from request headers
    const authToken = req.headers.get('Authorization');

    // Get video model config from MiniMax provider
    const modelConfig = await getModelByCapability(PROVIDER_NAMES.MINIMAX, 'video', authToken || undefined);

    if (!modelConfig.apiKey) {
      return NextResponse.json(
        { error: 'MiniMax API key not configured. Please configure it in AI Provider Settings.' },
        { status: 500 }
      );
    }

    if (!modelConfig.endpoint) {
      return NextResponse.json(
        { error: 'MiniMax Video endpoint not configured. Please check AI Provider Settings.' },
        { status: 500 }
      );
    }

    // Duration in seconds - MiniMax only accepts 6s or 10s
    let duration = 6;
    if (seconds) {
      duration = seconds >= 8 ? 10 : 6;
    }
    
    const payload = {
      model: model || modelConfig.model?.modelKey || 'video-01',
      prompt,
      mode: 'video_01_live',
      duration,
      resolution: '1080P',
      fps: 25
    };
    
    console.log('[MiniMax Video] Using endpoint:', modelConfig.endpoint);
    console.log('[MiniMax Video] Request payload:', JSON.stringify(payload, null, 2));
    
    // Step 1: Initiate video generation using ENDPOINT FROM BACKEND
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
      console.error('[MiniMax Video] Error:', errorData);
      return NextResponse.json(
        { error: errorData.base_resp?.status_msg || 'MiniMax video generation failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[MiniMax Video] Initial response:', JSON.stringify(data, null, 2));
    
    const taskId = data.task_id || data.data?.task_id;
    
    if (!taskId) {
      console.error('[MiniMax Video] No task_id in response');
      return NextResponse.json(
        { error: 'No task ID in response', responseData: data },
        { status: 500 }
      );
    }

    console.log('[MiniMax Video] Task ID:', taskId, '- Starting polling...');

    // Step 2: Poll for video completion
    // Construct status URL from base endpoint
    const baseUrl = modelConfig.endpoint.replace('/video_generation', '');
    const maxAttempts = 30;
    const pollInterval = 10000;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
      console.log(`[MiniMax Video] Polling attempt ${attempt}/${maxAttempts}...`);
      
      // Query task status
      const statusUrl = `${baseUrl}/query/video_generation?task_id=${taskId}`;
      
      const statusResponse = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${modelConfig.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!statusResponse.ok) {
        console.error(`[MiniMax Video] Status check failed on attempt ${attempt}`);
        continue;
      }

      const statusData = await statusResponse.json();
      console.log(`[MiniMax Video] Status response (attempt ${attempt}):`, JSON.stringify(statusData, null, 2));
      
      const status = statusData.status || statusData.data?.status;
      
      if (status === 'Success' || status === 'Completed') {
        const fileId = 
          statusData.file_id ||
          statusData.data?.file_id;
        
        if (!fileId) {
          console.error('[MiniMax Video] No file_id in success response');
          return NextResponse.json(
            { error: 'No file ID in response', responseData: statusData },
            { status: 500 }
          );
        }

        console.log('[MiniMax Video] File ID obtained:', fileId);

        // Step 3: Retrieve the download URL using the file_id
        const retrieveUrl = `${baseUrl}/files/retrieve?file_id=${fileId}`;
        
        const retrieveResponse = await fetch(retrieveUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${modelConfig.apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!retrieveResponse.ok) {
          console.error('[MiniMax Video] Failed to retrieve download URL');
          return NextResponse.json(
            { error: 'Failed to retrieve video download URL' },
            { status: 500 }
          );
        }

        const retrieveData = await retrieveResponse.json();
        console.log('[MiniMax Video] Retrieve response:', JSON.stringify(retrieveData, null, 2));

        const downloadUrl = 
          retrieveData.file?.download_url ||
          retrieveData.download_url ||
          retrieveData.data?.download_url;

        if (!downloadUrl) {
          console.error('[MiniMax Video] No download URL in retrieve response');
          return NextResponse.json(
            { error: 'No download URL found', responseData: retrieveData },
            { status: 500 }
          );
        }

        console.log('[MiniMax Video] Download URL ready:', downloadUrl);
        
        const proxyUrl = `/api/ai/minimax/video/download?url=${encodeURIComponent(downloadUrl)}`;
        
        return NextResponse.json({
          url: proxyUrl,
          videoId: fileId,
          revisedPrompt: prompt,
        });
      } else if (status === 'Failed' || status === 'Error') {
        console.error('[MiniMax Video] Generation failed:', statusData);
        return NextResponse.json(
          { error: 'Video generation failed', responseData: statusData },
          { status: 500 }
        );
      }
      
      console.log(`[MiniMax Video] Status: ${status || 'Processing'}, continuing...`);
    }

    console.error('[MiniMax Video] Timeout reached after 5 minutes');
    return NextResponse.json(
      { error: 'Video generation timeout - task is still processing', taskId },
      { status: 408 }
    );
    
  } catch (error: any) {
    console.error('MiniMax video generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
