import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

import { PROVIDER_NAMES, getProviderConfig } from '../../../config/helper';

export const runtime = 'nodejs';

// Extended timeout for N8N webhook (can take several minutes)
export const maxDuration = 300; // 20 minutes

type JsonObject = Record<string, unknown>;

interface INormalizedN8NVideoResponse {
  status: boolean | string;
  message: string;
  project_id: string;
  timestamp: string;
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null;
}

function pickString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function asValidProjectId(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  if (!normalized || normalized.toUpperCase() === 'N/A') {
    return null;
  }

  return normalized;
}

function extractPrimaryObject(rawData: unknown): JsonObject | null {
  if (Array.isArray(rawData)) {
    return rawData.find(isObject) ?? null;
  }

  if (!isObject(rawData)) {
    return null;
  }

  const wrapperKeys = ['data', 'result', 'payload', 'response', 'body'] as const;
  for (const key of wrapperKeys) {
    const nested = rawData[key];

    if (Array.isArray(nested)) {
      const firstItem = nested.find(isObject);
      if (firstItem) {
        return firstItem;
      }
    }

    if (isObject(nested)) {
      return nested;
    }
  }

  return rawData;
}

function extractProjectId(rawData: unknown, seen = new Set<unknown>()): string | null {
  if (rawData === null || rawData === undefined) {
    return null;
  }

  if (typeof rawData !== 'object') {
    return null;
  }

  if (seen.has(rawData)) {
    return null;
  }
  seen.add(rawData);

  if (Array.isArray(rawData)) {
    for (const item of rawData) {
      const candidate = extractProjectId(item, seen);
      if (candidate) {
        return candidate;
      }
    }
    return null;
  }

  const objectData = rawData as JsonObject;

  const directKeys = ['project_id', 'projectId', 'project'] as const;
  for (const key of directKeys) {
    const candidate = asValidProjectId(objectData[key]);
    if (candidate) {
      return candidate;
    }
  }

  const wrapperKeys = ['data', 'result', 'payload', 'response', 'body'] as const;
  for (const key of wrapperKeys) {
    const candidate = extractProjectId(objectData[key], seen);
    if (candidate) {
      return candidate;
    }
  }

  for (const value of Object.values(objectData)) {
    const candidate = extractProjectId(value, seen);
    if (candidate) {
      return candidate;
    }
  }

  return null;
}

function normalizeN8NVideoResponse(rawData: unknown): INormalizedN8NVideoResponse | null {
  const primaryObject = extractPrimaryObject(rawData);
  if (!primaryObject) {
    return null;
  }

  const rootObject = isObject(rawData) && !Array.isArray(rawData) ? rawData : null;

  const projectId = extractProjectId(primaryObject) || extractProjectId(rawData);
  if (!projectId) {
    return null;
  }

  const rawStatus = primaryObject.status ?? rootObject?.status;
  let status: boolean | string = true;
  if (typeof rawStatus === 'boolean') {
    status = rawStatus;
  } else if (typeof rawStatus === 'string') {
    const normalizedStatus = rawStatus.trim().toLowerCase();
    if (normalizedStatus === 'success') {
      status = true;
    } else if (normalizedStatus === 'error' || normalizedStatus === 'failed' || normalizedStatus === 'failure') {
      status = false;
    } else if (rawStatus.trim()) {
      status = rawStatus.trim();
    }
  }

  return {
    status,
    message:
      pickString(primaryObject.message, rootObject?.message) ||
      'Video order received and processing',
    project_id: projectId,
    timestamp:
      pickString(primaryObject.timestamp, rootObject?.timestamp) || new Date().toISOString(),
  };
}

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
    const {
      user_prompt,
      duration_scences,
      duration_scenes,
      scences_number,
      scenes_number,
      image_model,
    } = body;

    // Validate required fields
    if (!user_prompt) {
      return NextResponse.json(
        { error: 'user_prompt is required' },
        { status: 400 }
      );
    }

    // Validate duration_scences (must be 4, 6, or 12)
    const validDurations = [4, 6, 12];
    const duration = Number(duration_scences ?? duration_scenes ?? 4);
    if (!validDurations.includes(duration)) {
      return NextResponse.json(
        { error: 'duration_scences/duration_scenes must be 4, 6, or 12' },
        { status: 400 }
      );
    }

    // Validate scences_number
    const scenes = Number(scences_number ?? scenes_number ?? 5);
    if (scenes < 1 || scenes > 20) {
      return NextResponse.json(
        { error: 'scences_number/scenes_number must be between 1 and 20' },
        { status: 400 }
      );
    }

    const payload = {
      user_prompt,
      // Keep legacy typo keys for backward compatibility with existing workflows.
      duration_scences: duration,
      scences_number: scenes,
      // Also send corrected aliases in case the workflow expects proper names.
      duration_scenes: duration,
      scenes_number: scenes,
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

    console.log(
      '[N8N Video] Response metadata:',
      JSON.stringify(
        {
          requestedUrl: fullUrl,
          finalUrl: response.url,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        },
        null,
        2
      )
    );

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

    const responseText = await response.text();
    console.log('[N8N Video] Raw response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('[N8N Video] Failed to parse response as JSON:', responseText);
      return NextResponse.json(
        { error: 'N8N returned an invalid response' },
        { status: 502 }
      );
    }

    console.log('[N8N Video] Parsed response JSON:', JSON.stringify(data, null, 2));

    if (
      isObject(data) &&
      !Array.isArray(data) &&
      typeof data.project_id === 'string' &&
      data.project_id.trim().toUpperCase() === 'N/A'
    ) {
      console.error(
        '[N8N Video] N8N returned project_id as N/A. This usually means the Respond to Webhook mapping is reading the wrong field or a fallback is being used.'
      );
    }

    const topLevelProjectValue =
      isObject(data) && !Array.isArray(data)
        ? (data.project_id ?? data.projectId ?? data.project)
        : null;

    console.log(
      '[N8N Video] project_id debug:',
      JSON.stringify(
        {
          topLevelProjectValue,
          extractedProjectId: extractProjectId(data),
        },
        null,
        2
      )
    );

    const normalizedData = normalizeN8NVideoResponse(data);

    if (!normalizedData) {
      console.error('[N8N Video] Normalization failed. Parsed response:', JSON.stringify(data, null, 2));
      console.error('[N8N Video] Response does not include a valid project_id:', data);
      return NextResponse.json(
        { error: 'N8N response does not include a valid project_id', details: data },
        { status: 502 }
      );
    }

    // Preserve array/object shape for backward compatibility.
    return NextResponse.json(Array.isArray(data) ? [normalizedData] : normalizedData);
  } catch (error: any) {
    console.error('[N8N Video] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
