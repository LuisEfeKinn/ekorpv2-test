// ----------------------------------------------------------------------
// Learning Path - Single Program Generation Utility
// Generates a single program via AI streaming, extracts the JSON,
// and returns the parsed program data ready for SaveOrUpdateAiProgramService.
// This is a non-hook utility so it can be called in parallel.
// ----------------------------------------------------------------------

import type { IAiProvider, IAiProviderModel } from 'src/types/ai-provider';
import type {
  IAiProgram,
  ICatalogCategory,
  ICatalogDifficultyLevel,
} from 'src/types/ai-program-generation';

import {
  getLegacyTypeFromName,
  getApiRouteForProvider,
} from 'src/routes/hooks/useAiProvidersDynamic';

// ----------------------------------------------------------------------

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('accessToken') || sessionStorage.getItem('jwt_access_token');
}

// ----------------------------------------------------------------------

/**
 * System prompt for LP program generation.
 * Unlike the standard PROGRAM_GENERATION_SYSTEM_PROMPT, here the courses
 * are already created and we know their rowIds. The AI only needs to
 * generate program metadata (name, description, objectives, etc.).
 */
const LP_PROGRAM_GENERATION_SYSTEM_PROMPT = `You are an expert learning program designer. Your job is to create a structured learning program (learning object) based on a provided instruction and the list of courses that already belong to it.

**Context**: The courses for this program have already been created and saved. You will receive their IDs, titles, and descriptions. Your task is ONLY to generate the program metadata that wraps these courses.

**Response format**: Respond ONLY with the JSON (wrapped in triple backticks with json tag). No explanations needed.

\`\`\`json
{
  "name": "Program Title",
  "description": "Comprehensive description of the program and what it covers.",
  "duration": "10h 30m",
  "objective": "Clear learning objective describing what participants will achieve.",
  "skillsToAcquire": "Skill 1, Skill 2, Skill 3 - listed skills the learner will acquire.",
  "whatYouWillLearn": "Detailed paragraph describing all the topics and knowledge areas covered.",
  "tags": "Tag1, Tag2, Tag3",
  "isAIGenerated": true,
  "isActive": false,
  "order": 1,
  "categoryId": 1,
  "difficultyLevelId": 2,
  "banner": "Professional 16:9 banner image description for the program. Be descriptive about colors, composition and theme.",
  "cover": "Professional square cover image description for the program. Include relevant visual elements.",
  "generateBanner": true,
  "generateCover": true,
  "courses": [
    {
      "courseLmsId": "id-already-provided",
      "order": 1
    }
  ]
}
\`\`\`

**Guidelines**:
- "name" should be a professional, descriptive title based on the instruction
- "description" should explain what the program covers, based on the courses it contains
- "objective" describes what participants will achieve after completing all courses
- "skillsToAcquire" lists specific skills, comma separated
- "whatYouWillLearn" is a detailed paragraph of topics covered
- "tags" are relevant keywords, comma separated
- "duration" is an estimated total based on the courses
- "banner" and "cover" are vivid descriptions suitable for AI image generation
- "courses" MUST use the exact courseLmsId values provided — do NOT invent IDs
- Order courses from foundational to advanced
- isAIGenerated is always true, isActive is always false
- Select the most appropriate categoryId and difficultyLevelId from the catalogs provided`;

// ----------------------------------------------------------------------

interface CourseReference {
  courseLmsId: string;
  title: string;
  description: string;
  order: number;
}

interface SingleProgramGenerateParams {
  /** The instruction_pg from the learning path JSON */
  instruction: string;
  /** The instruction_lp of the learning path */
  learningPathInstruction: string;
  /** Courses that belong to this program (with their saved rowIds) */
  courses: CourseReference[];
  /** Categories catalog */
  categories: ICatalogCategory[];
  /** Difficulty levels catalog */
  difficultyLevels: ICatalogDifficultyLevel[];
  /** Text provider */
  provider: IAiProvider;
  /** Text model */
  model: IAiProviderModel;
  /** Image provider (optional) */
  imageProvider?: IAiProvider;
  /** Image model (optional) */
  imageModel?: IAiProviderModel;
  /** Function to get legacy provider type */
  getLegacyProviderType: (provider: IAiProvider) => string;
}

// ----------------------------------------------------------------------

/**
 * Generate a single program using AI and return the parsed program data.
 * This function does NOT use React hooks so it can be called in parallel.
 */
export async function singleProgramGenerate(
  params: SingleProgramGenerateParams
): Promise<Partial<IAiProgram>> {
  const {
    instruction,
    learningPathInstruction,
    courses,
    categories,
    difficultyLevels,
    provider,
    model,
  } = params;

  // Build courses context for the AI
  const coursesContext = courses
    .map(
      (c, i) =>
        `- Course ${i + 1} (courseLmsId: "${c.courseLmsId}"): "${c.title}" — ${c.description}`
    )
    .join('\n');

  // Build categories catalog context
  const categoriesContext =
    categories.length > 0
      ? categories.map((c) => `- id: ${c.id} | Name: "${c.name}"`).join('\n')
      : 'No categories available.';

  // Build difficulty levels catalog context
  const levelsContext =
    difficultyLevels.length > 0
      ? difficultyLevels.map((l) => `- id: ${l.id} | Name: "${l.name}"`).join('\n')
      : 'No difficulty levels available.';

  const userPrompt = `Contexto: Este programa es parte de una ruta de aprendizaje: "${learningPathInstruction}".

Instrucción del programa: "${instruction}"

Los siguientes cursos ya han sido creados y pertenecen a este programa:
${coursesContext}

**CATEGORIES CATALOG (${categories.length}):**
${categoriesContext}

**DIFFICULTY LEVELS CATALOG (${difficultyLevels.length}):**
${levelsContext}

Selecciona el categoryId y difficultyLevelId más apropiados de los catálogos anteriores.
Genera el programa completo siguiendo la estructura JSON indicada en tus instrucciones del sistema. Usa los courseLmsId exactos proporcionados. Responde solo con el JSON del programa.`;

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: LP_PROGRAM_GENERATION_SYSTEM_PROMPT },
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
  let lineBuffer = '';

  // Read stream
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value, { stream: true });
    // Prepend any leftover from previous chunk
    const combined = lineBuffer + text;
    const lines = combined.split('\n');
    // Last element might be incomplete — save it for the next chunk
    lineBuffer = lines.pop() || '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('data: ') || trimmedLine.startsWith('data:')) {
        const data = trimmedLine.startsWith('data: ')
          ? trimmedLine.slice(6)
          : trimmedLine.slice(5);
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

  // Process any remaining data in the line buffer
  if (lineBuffer.trim()) {
    const trimmedLine = lineBuffer.trim();
    if (trimmedLine.startsWith('data: ') || trimmedLine.startsWith('data:')) {
      const data = trimmedLine.startsWith('data: ')
        ? trimmedLine.slice(6)
        : trimmedLine.slice(5);
      if (data !== '[DONE]') {
        try {
          const parsed = JSON.parse(data);
          let content = '';
          if (legacyType === 'gemini') {
            content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
          } else if (legacyType === 'minimax') {
            if (parsed.choices?.[0]?.finish_reason !== 'stop') {
              content = parsed.choices?.[0]?.delta?.content || '';
            }
          } else {
            content = parsed.choices?.[0]?.delta?.content || parsed.text || parsed.content || '';
          }
          if (content) accumulated += content;
        } catch {
          // Ignore
        }
      }
    }
  }

  // Extract program data from the full response
  console.log('[LP Program] Accumulated AI response length:', accumulated.length);
  console.log('[LP Program] Accumulated AI response (first 500 chars):', accumulated.slice(0, 500));

  const programData = extractProgramData(accumulated, courses);

  if (!programData) {
    console.error('[LP Program] Full accumulated response:', accumulated);
    throw new Error('No se pudo extraer el JSON del programa de la respuesta de la IA.');
  }

  return programData;
}

// ----------------------------------------------------------------------
// Helper: Sanitize JSON string (handle HTML content, newlines, etc.)
// ----------------------------------------------------------------------

function sanitizeJsonString(jsonStr: string): string {
  let sanitized = jsonStr;
  // Clean HTML content fields that might contain unescaped newlines
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

// ----------------------------------------------------------------------
// Helper: Extract the outermost balanced JSON object from a string
// starting at a given position. Handles nested braces correctly.
// ----------------------------------------------------------------------

function extractBalancedJson(text: string, startIdx: number): string | null {
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = startIdx; i < text.length; i++) {
    const ch = text[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (ch === '\\' && inString) {
      escape = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) {
        return text.slice(startIdx, i + 1);
      }
    }
  }

  return null;
}

// ----------------------------------------------------------------------
// Helper: Extract program JSON from AI response text
// ----------------------------------------------------------------------

function extractProgramData(
  response: string,
  courses: CourseReference[]
): Partial<IAiProgram> | null {
  try {
    // Strategy 1: Find JSON inside ```json ... ``` code blocks
    const jsonCodeBlockMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonCodeBlockMatch) {
      const jsonText = sanitizeJsonString(jsonCodeBlockMatch[1].trim());
      try {
        const parsed = JSON.parse(jsonText);
        if (parsed.name) {
          return normalizeProgramData(parsed, courses);
        }
      } catch (e) {
        console.warn('[LP Program] Failed to parse JSON from ```json block:', e);
      }
    }

    // Strategy 2: Find JSON inside ``` ... ``` code blocks (without json tag)
    const codeBlockMatch = response.match(/```\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      const jsonText = sanitizeJsonString(codeBlockMatch[1].trim());
      try {
        const parsed = JSON.parse(jsonText);
        if (parsed.name) {
          return normalizeProgramData(parsed, courses);
        }
      } catch (e) {
        console.warn('[LP Program] Failed to parse JSON from ``` block:', e);
      }
    }

    // Strategy 3: If the whole response is JSON (no code blocks)
    const trimmed = sanitizeJsonString(response.trim());
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.name) {
          return normalizeProgramData(parsed, courses);
        }
      } catch {
        // Not valid JSON as a whole, continue to next strategy
      }
    }

    // Strategy 4: Find the first { that leads to a balanced JSON object
    // containing "name" — using balanced brace extraction
    const firstBrace = response.indexOf('{');
    if (firstBrace !== -1) {
      const balanced = extractBalancedJson(response, firstBrace);
      if (balanced) {
        try {
          const parsed = JSON.parse(sanitizeJsonString(balanced));
          if (parsed.name) {
            return normalizeProgramData(parsed, courses);
          }
        } catch (e) {
          console.warn('[LP Program] Failed to parse balanced JSON:', e);
        }
      }
    }

    return null;
  } catch (e) {
    console.error('Failed to extract program data:', e);
    return null;
  }
}

function normalizeProgramData(
  data: any,
  courses: CourseReference[]
): Partial<IAiProgram> {
  return {
    name: data.name || '',
    description: data.description || '',
    duration: data.duration || '',
    objective: data.objective || '',
    skillsToAcquire: data.skillsToAcquire || '',
    whatYouWillLearn: data.whatYouWillLearn || '',
    tags: data.tags || '',
    isAIGenerated: true,
    isActive: false,
    order: data.order ?? 1,
    banner: data.banner || '',
    cover: data.cover || '',
    generateBanner: data.generateBanner ?? false,
    generateCover: data.generateCover ?? false,
    bannerUrl: data.bannerUrl || '',
    imageUrl: data.imageUrl || '',
    videoUrl: data.videoUrl || '',
    categoryId: data.categoryId,
    difficultyLevelId: data.difficultyLevelId,
    // Ensure courses use the exact courseLmsIds we provided
    courses: courses.map((c, idx) => ({
      courseLmsId: c.courseLmsId,
      order: c.order ?? idx + 1,
    })),
  };
}
