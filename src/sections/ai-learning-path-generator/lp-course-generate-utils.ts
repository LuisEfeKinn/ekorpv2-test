// ----------------------------------------------------------------------
// Learning Path - Single Course Generation Utility
// Generates a single course via AI streaming, extracts the JSON,
// and returns the parsed IAiCourse data.
// This is a non-hook utility so it can be called in parallel.
// ----------------------------------------------------------------------

import type { IAiCourse } from 'src/types/ai-course';
import type { IAiProvider, IAiProviderModel } from 'src/types/ai-provider';

import {
  getLegacyTypeFromName,
  getApiRouteForProvider,
} from 'src/routes/hooks/useAiProvidersDynamic';

import { COURSE_GENERATION_SYSTEM_PROMPT } from 'src/types/ai-course-generation';

// ----------------------------------------------------------------------

/**
 * Get auth token from sessionStorage
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('accessToken') || sessionStorage.getItem('jwt_access_token');
}

// ----------------------------------------------------------------------

interface SingleCourseGenerateParams {
  /** The instruction_c from the learning path JSON */
  instruction: string;
  /** The instruction_pg of the parent program */
  programInstruction: string;
  /** The instruction_lp of the learning path */
  learningPathInstruction: string;
  /** Text provider */
  provider: IAiProvider;
  /** Text model */
  model: IAiProviderModel;
  /** Image provider (optional - for banner/section images) */
  imageProvider?: IAiProvider;
  /** Image model (optional) */
  imageModel?: IAiProviderModel;
  /** Function to get legacy provider type */
  getLegacyProviderType: (provider: IAiProvider) => string;
}

// ----------------------------------------------------------------------

/**
 * Generate a single course using AI and return the parsed course data.
 * This function does NOT use React hooks so it can be called in parallel.
 */
export async function singleCourseGenerate(
  params: SingleCourseGenerateParams
): Promise<IAiCourse> {
  const {
    instruction,
    programInstruction,
    learningPathInstruction,
    provider,
    model,
  } = params;

  // Build the user prompt with context
  const userPrompt = `Contexto: Esta es parte de una ruta de aprendizaje: "${learningPathInstruction}".
Pertenece al programa: "${programInstruction}".

${instruction}

Genera el curso completo siguiendo la estructura JSON indicada en tus instrucciones del sistema. El curso debe ser detallado y profesional. Responde solo con el JSON del curso.`;

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: COURSE_GENERATION_SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ];

  // Determine endpoint and build request body
  const endpoint = `${getApiRouteForProvider(provider.name)}/chat`;
  const legacyType = getLegacyTypeFromName(provider.name);

  let requestBody: any;

  if (legacyType === 'gemini') {
    requestBody = {
      contents: messages.map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : msg.role === 'system' ? 'user' : 'user',
        parts: [{ text: msg.content }],
      })),
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: model.maxTokens ?? 4096,
      },
      model: model.modelKey,
      providerName: provider.name,
      providerId: provider.id,
      modelId: model.id,
      stream: true,
    };
  } else if (legacyType === 'openai') {
    requestBody = {
      messages: messages.map((msg) => ({ role: msg.role, content: msg.content })),
      model: model.modelKey,
      stream: true,
      providerName: provider.name,
      providerId: provider.id,
      modelId: model.id,
      max_completion_tokens: model.maxTokens ?? 4096,
    };
  } else {
    requestBody = {
      messages: messages.map((msg) => ({ role: msg.role, content: msg.content })),
      model: model.modelKey,
      stream: true,
      providerName: provider.name,
      providerId: provider.id,
      modelId: model.id,
      max_tokens: model.maxTokens ?? 4096,
      temperature: 0.7,
    };
  }

  // Build headers
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const authToken = getAuthToken();
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  // Fetch with streaming
  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('No response body');
  }

  let accumulated = '';

  // Read stream
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value, { stream: true });
    const lines = text.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          let content = '';

          if (legacyType === 'gemini') {
            content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
          } else if (legacyType === 'minimax') {
            if (parsed.choices?.[0]?.finish_reason === 'stop') continue;
            content = parsed.choices?.[0]?.delta?.content || '';
          } else {
            content = parsed.choices?.[0]?.delta?.content || parsed.text || parsed.content || '';
          }

          if (content) {
            accumulated += content;
          }
        } catch {
          // Ignore parse errors for incomplete JSON
        }
      }
    }
  }

  // Extract course data from the full response
  const courseData = extractCourseData(accumulated);

  if (!courseData) {
    throw new Error('No se pudo extraer el JSON del curso de la respuesta de la IA.');
  }

  // Build a proper IAiCourse object
  const course: IAiCourse = {
    id: crypto.randomUUID(),
    title: courseData.title || '',
    description: courseData.description || '',
    objectives: courseData.objectives || [],
    targetAudience: courseData.targetAudience || '',
    duration: courseData.duration || '',
    difficulty: courseData.difficulty || 'intermediate',
    language: courseData.language || 'es',
    tags: courseData.tags || [],
    bannerUrl: courseData.bannerUrl || '',
    banner: courseData.banner || '',
    generateImages: courseData.generateImages ?? true,
    generateVideos: courseData.generateVideos ?? true,
    sections:
      courseData.sections?.map((section: any, index: number) => ({
        id: crypto.randomUUID(),
        title: section.title,
        description: section.description || '',
        order: index,
        blocks:
          section.blocks?.map((block: any, blockIndex: number) => ({
            id: crypto.randomUUID(),
            type: block.type || 'html',
            content: block.content || { html: '' },
            order: blockIndex,
            sectionId: '',
          })) || [],
        duration: section.duration || '',
        image: section.image || '',
        video: section.video || '',
        needsImage: section.needsImage ?? false,
        needsVideo: section.needsVideo ?? false,
        images: section.images || [],
        videos: section.videos || [],
      })) || [],
    status: 'draft',
  };

  return course;
}

// ----------------------------------------------------------------------
// Helper: Extract course JSON from AI response text
// (Adapted from ai-course-chat-panel.tsx)
// ----------------------------------------------------------------------

function extractCourseData(response: string): any | null {
  try {
    let jsonText = response;

    // Try to find JSON in code blocks
    const jsonCodeBlockMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonCodeBlockMatch) {
      jsonText = jsonCodeBlockMatch[1];
    } else {
      const codeBlockMatch = response.match(/```\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1];
      }
    }

    jsonText = jsonText.trim();
    jsonText = sanitizeJsonString(jsonText);

    if (jsonText.startsWith('{') || jsonText.startsWith('[')) {
      const parsed = JSON.parse(jsonText);

      // Gemini format
      if (parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
        const innerText = parsed.candidates[0].content.parts[0].text;
        try {
          return normalizeCourseData(JSON.parse(innerText));
        } catch {
          return null;
        }
      }

      if (parsed.title || parsed.sections) {
        return normalizeCourseData(parsed);
      }
    }

    // Try to find JSON object in response
    const objectMatch = response.match(/\{[\s\S]*?"title"[\s\S]*?\}/);
    if (objectMatch) {
      return normalizeCourseData(JSON.parse(sanitizeJsonString(objectMatch[0])));
    }

    return null;
  } catch (e) {
    console.error('Failed to extract course data:', e);
    return null;
  }
}

function sanitizeJsonString(jsonStr: string): string {
  let sanitized = jsonStr;
  sanitized = sanitized.replace(/"html":\s*"((?:[^"\\]|\\.)*)"/g, (_match, content) => {
    const cleaned = content
      .replace(/\r\n/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\r/g, ' ')
      .replace(/\t/g, ' ')
      .replace(/\s+/g, ' ');
    return `"html": "${cleaned}"`;
  });
  return sanitized;
}

function normalizeCourseData(courseData: any): any {
  if (!courseData) return null;
  return {
    ...courseData,
    banner: courseData.banner || '',
    bannerUrl: courseData.bannerUrl || '',
    generateImages: courseData.generateImages ?? true,
    generateVideos: courseData.generateVideos ?? true,
    sections: (courseData.sections || []).map((section: any) => ({
      ...section,
      image: section.image || '',
      video: section.video || '',
      needsImage: section.needsImage ?? false,
      needsVideo: section.needsVideo ?? false,
      images: section.images || [],
      videos: section.videos || [],
      imageUrl: section.imageUrl || '',
      videoUrl: section.videoUrl || '',
    })),
  };
}
