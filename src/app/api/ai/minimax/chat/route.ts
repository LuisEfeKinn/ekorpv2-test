import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

import { PROVIDER_NAMES, getModelConfig } from '../../config/helper';

// Changed to nodejs to support dynamic config fetching
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, model, temperature, max_tokens, stream, group_id } = body;

    // Get authorization token from request headers
    const authToken = req.headers.get('Authorization');

    // Get model config from backend (includes endpoint and API key)
    const modelConfig = await getModelConfig(PROVIDER_NAMES.MINIMAX, model, authToken || undefined);
    
    if (!modelConfig.apiKey || !modelConfig.groupId) {
      return NextResponse.json(
        { error: 'MiniMax API key or Group ID not configured. Please configure it in AI Provider Settings.' },
        { status: 500 }
      );
    }

    if (!modelConfig.endpoint) {
      return NextResponse.json(
        { error: 'MiniMax endpoint not configured. Please check AI Provider Settings.' },
        { status: 500 }
      );
    }

    // Build API URL with GroupId - use group_id from request or from config
    const groupIdToUse = group_id || modelConfig.groupId;
    let apiUrl = modelConfig.endpoint;
    
    // If endpoint doesn't include GroupId, append it
    if (!apiUrl.includes('GroupId=')) {
      apiUrl += apiUrl.includes('?') ? `&GroupId=${groupIdToUse}` : `?GroupId=${groupIdToUse}`;
    }

    const requestBody = {
      model: model || modelConfig.model?.modelKey || 'MiniMax-M2.1',
      messages,
      stream: stream ?? true,
      temperature: temperature ?? 0.7,
      max_tokens: max_tokens ?? modelConfig.model?.maxTokens ?? 8192,
    };

    console.log('[MiniMax] Request:', {
      url: apiUrl,
      model: requestBody.model,
      messageCount: messages.length,
      stream: requestBody.stream,
    });

    // MiniMax uses Bearer token format
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${modelConfig.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[MiniMax] Error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: errorText } };
      }
      
      return NextResponse.json(
        { error: errorData.error?.message || errorData.message || 'Minimax API error' },
        { status: response.status }
      );
    }

    // If streaming, handle the response
    if (stream) {
      console.log('[MiniMax] Streaming response...');
      
      if (!response.body) {
        console.error('[MiniMax] No response body for streaming');
        return NextResponse.json(
          { error: 'No response body from MiniMax' },
          { status: 500 }
        );
      }

      // Create a transform stream to log and check for errors
      const { readable, writable } = new TransformStream({
        transform(chunk, controller) {
          const text = new TextDecoder().decode(chunk);
          
          if (text.length > 0) {
            console.log('[MiniMax] Stream chunk:', text.substring(0, 200));
            
            try {
              const lines = text.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  try {
                    const parsed = JSON.parse(data);
                    
                    if (parsed.base_resp?.status_code && parsed.base_resp.status_code !== 0 && parsed.base_resp.status_code !== 1000) {
                      console.error('[MiniMax] Error in stream:', parsed.base_resp);
                      return;
                    }
                  } catch {
                    // Not parseable, continue
                  }
                }
              }
            } catch {
              // Not JSON or partial chunk, continue
            }
          }
          
          controller.enqueue(chunk);
        },
      });

      response.body.pipeTo(writable);

      return new NextResponse(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // If not streaming, return JSON
    console.log('[MiniMax] Non-streaming response');
    const data = await response.json();
    console.log('[MiniMax] Response data:', JSON.stringify(data).substring(0, 200));
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Minimax API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
