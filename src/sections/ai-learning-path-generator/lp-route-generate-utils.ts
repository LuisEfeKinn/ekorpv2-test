// ----------------------------------------------------------------------
// Learning Path - Route (Learning Path) Generation Utility
// Generates the final learning path structure via AI streaming.
// The AI organizes the generated programs into modules with
// competencies and skill levels, and generates LP metadata.
// This is a non-hook utility so it can be called standalone.
// ----------------------------------------------------------------------

import type { IAiProvider, IAiProviderModel } from 'src/types/ai-provider';

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
 * System prompt for LP route generation.
 * The programs (learning objects) are already created with their IDs.
 * The AI needs to organize them into modules (competency + skill level)
 * and generate the learning path metadata.
 */
const LP_ROUTE_GENERATION_SYSTEM_PROMPT = `You are an expert learning path designer. Your job is to create a structured learning path organized into modules, using the programs (learning objects) that have already been created for this path.

**Context**: The programs (learning objects) for this learning path have already been created and saved. You will receive their IDs, names, and descriptions. Your task is to:
1. Generate learning path metadata (title, description, tags, banner)
2. Organize the programs into modules by competency and skill level
3. Select the most appropriate position from the positions catalog

**Response format**: Respond ONLY with the JSON (wrapped in triple backticks with json tag). No explanations needed.

\`\`\`json
{
  "title": "Learning Path Title",
  "description": "Comprehensive description of the learning path",
  "tags": ["tag1", "tag2", "tag3"],
  "banner": "Professional 16:9 banner image description for the learning path. Be descriptive about colors, composition and theme.",
  "generateBanner": true,
  "isAIGenerated": true,
  "positionId": 4,
  "positionName": "Position Name from catalog",
  "modules": [
    {
      "competencyId": 12,
      "competencyName": "Competency Name from catalog",
      "skillLevelId": 2,
      "skillLevelName": "Skill Level Name from catalog",
      "order": 1,
      "learningObjects": [
        {
          "learningObjectId": 74,
          "displayName": "Program Name",
          "shortDescription": "Program description",
          "order": 1,
          "isOptional": false
        }
      ]
    }
  ]
}
\`\`\`

**CRITICAL RULES**:
- ALL learningObjectId values MUST use the exact program IDs provided — do NOT invent IDs
- ALL competencyId, skillLevelId, and positionId MUST come from the provided catalogs — do NOT invent IDs
- Each module groups programs under ONE competency and ONE skill level
- Order modules from foundational to advanced
- isAIGenerated is always true
- "tags" should be relevant keywords as an array of strings
- "banner" should be a vivid description suitable for AI image generation
- Mark isOptional as true only for supplementary programs`;

// ----------------------------------------------------------------------

export interface ProgramReference {
  learningObjectId: number;
  displayName: string;
  shortDescription: string;
  order: number;
}

export interface CatalogPosition {
  id: number;
  name: string;
}

export interface CatalogCompetency {
  id: number;
  name: string;
}

export interface CatalogSkillLevel {
  id: number;
  name: string;
  levelOrder?: number;
}

interface GenerateRouteParams {
  /** The instruction_lp from the learning path JSON */
  learningPathInstruction: string;
  /** Programs (learning objects) with their saved rowIds */
  programs: ProgramReference[];
  /** Positions catalog */
  positions: CatalogPosition[];
  /** Competencies catalog */
  competencies: CatalogCompetency[];
  /** Skill levels catalog */
  skillLevels: CatalogSkillLevel[];
  /** Text provider */
  provider: IAiProvider;
  /** Text model */
  model: IAiProviderModel;
  /** Function to get legacy provider type */
  getLegacyProviderType: (provider: IAiProvider) => string;
}

export interface GeneratedRouteData {
  title: string;
  description: string;
  tags: string[];
  banner: string;
  bannerUrl?: string;
  generateBanner: boolean;
  isAIGenerated: boolean;
  positionId?: number;
  positionName?: string;
  modules: Array<{
    competencyId: number;
    competencyName?: string;
    skillLevelId: number;
    skillLevelName?: string;
    order: number;
    learningObjects: Array<{
      learningObjectId: number;
      displayName?: string;
      shortDescription?: string;
      order: number;
      isOptional: boolean;
    }>;
  }>;
}

// ----------------------------------------------------------------------

/**
 * Generate the learning path structure using AI.
 */
export async function generateRoute(params: GenerateRouteParams): Promise<GeneratedRouteData> {
  const {
    learningPathInstruction,
    programs,
    positions,
    competencies,
    skillLevels,
    provider,
    model,
  } = params;

  // Build programs context
  const programsContext = programs
    .map(
      (p) =>
        `- learningObjectId: ${p.learningObjectId} | Name: "${p.displayName}" | Description: "${p.shortDescription}"`
    )
    .join('\n');

  // Build catalogs context
  const positionsContext =
    positions.length > 0
      ? positions.map((p) => `- id: ${p.id} | Name: "${p.name}"`).join('\n')
      : 'No positions available.';

  const competenciesContext =
    competencies.length > 0
      ? competencies.map((c) => `- id: ${c.id} | Name: "${c.name}"`).join('\n')
      : 'No competencies available.';

  const skillLevelsContext =
    skillLevels.length > 0
      ? skillLevels.map((l) => `- id: ${l.id} | Name: "${l.name}"`).join('\n')
      : 'No skill levels available.';

  const userPrompt = `Instrucción de la ruta de aprendizaje: "${learningPathInstruction}"

Los siguientes programas (objetos de aprendizaje) ya han sido creados y deben formar parte de esta ruta:
${programsContext}

**POSITIONS CATALOG (${positions.length}):**
${positionsContext}

**COMPETENCIES CATALOG (${competencies.length}):**
${competenciesContext}

**SKILL LEVELS CATALOG (${skillLevels.length}):**
${skillLevelsContext}

Organiza los programas en módulos por competencia y nivel de habilidad. Usa los learningObjectId exactos proporcionados. Selecciona el positionId, competencyId y skillLevelId más apropiados de los catálogos. Responde solo con el JSON de la ruta de aprendizaje.`;

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: LP_ROUTE_GENERATION_SYSTEM_PROMPT },
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
    const combined = lineBuffer + text;
    const lines = combined.split('\n');
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

  // Process remaining line buffer
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

  // Extract route data from the full response
  const routeData = extractRouteData(accumulated, programs);

  if (!routeData) {
    console.error('[LP Route] Full accumulated response:', accumulated);
    throw new Error('No se pudo extraer el JSON de la ruta de la respuesta de la IA.');
  }

  return routeData;
}

// ----------------------------------------------------------------------
// Helper: Extract balanced JSON from text
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
// Helper: Extract route JSON from AI response text
// ----------------------------------------------------------------------

function extractRouteData(
  response: string,
  programs: ProgramReference[]
): GeneratedRouteData | null {
  try {
    // Strategy 1: ```json ... ``` code block
    const jsonCodeBlockMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonCodeBlockMatch) {
      try {
        const parsed = JSON.parse(jsonCodeBlockMatch[1].trim());
        if (parsed.title || parsed.modules) {
          return normalizeRouteData(parsed, programs);
        }
      } catch (e) {
        console.warn('[LP Route] Failed to parse JSON from ```json block:', e);
      }
    }

    // Strategy 2: ``` ... ``` code block
    const codeBlockMatch = response.match(/```\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      try {
        const parsed = JSON.parse(codeBlockMatch[1].trim());
        if (parsed.title || parsed.modules) {
          return normalizeRouteData(parsed, programs);
        }
      } catch (e) {
        console.warn('[LP Route] Failed to parse JSON from ``` block:', e);
      }
    }

    // Strategy 3: Whole response is JSON
    const trimmed = response.trim();
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.title || parsed.modules) {
          return normalizeRouteData(parsed, programs);
        }
      } catch {
        // Not valid JSON as a whole
      }
    }

    // Strategy 4: Find balanced JSON object
    const firstBrace = response.indexOf('{');
    if (firstBrace !== -1) {
      const balanced = extractBalancedJson(response, firstBrace);
      if (balanced) {
        try {
          const parsed = JSON.parse(balanced);
          if (parsed.title || parsed.modules) {
            return normalizeRouteData(parsed, programs);
          }
        } catch (e) {
          console.warn('[LP Route] Failed to parse balanced JSON:', e);
        }
      }
    }

    return null;
  } catch (e) {
    console.error('Failed to extract route data:', e);
    return null;
  }
}

// ----------------------------------------------------------------------
// Normalize route data ensuring correct structure
// ----------------------------------------------------------------------

function normalizeRouteData(
  data: any,
  programs: ProgramReference[]
): GeneratedRouteData {
  // Build valid program IDs set for validation
  const validIds = new Set(programs.map((p) => p.learningObjectId));

  return {
    title: data.title || '',
    description: data.description || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    banner: data.banner || '',
    generateBanner: data.generateBanner ?? true,
    isAIGenerated: true,
    positionId: data.positionId ? Number(data.positionId) : undefined,
    positionName: data.positionName || '',
    modules: (data.modules || []).map((mod: any, modIdx: number) => ({
      competencyId: Number(mod.competencyId),
      competencyName: mod.competencyName || '',
      skillLevelId: Number(mod.skillLevelId),
      skillLevelName: mod.skillLevelName || '',
      order: mod.order ?? modIdx + 1,
      learningObjects: (mod.learningObjects || [])
        .filter((lo: any) => validIds.has(Number(lo.learningObjectId)))
        .map((lo: any, loIdx: number) => ({
          learningObjectId: Number(lo.learningObjectId),
          displayName: lo.displayName || '',
          shortDescription: lo.shortDescription || '',
          order: lo.order ?? loIdx + 1,
          isOptional: lo.isOptional ?? false,
        })),
    })),
  };
}
