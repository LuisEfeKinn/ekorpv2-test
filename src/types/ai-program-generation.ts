// ----------------------------------------------------------------------
// AI Program (Learning Object) Generation Types
// ----------------------------------------------------------------------

import type { AiProviderType } from './ai-course';

// ----------------------------------------------------------------------

export type AiProgramStatus = 'draft' | 'generating' | 'completed' | 'published' | 'archived';

export interface IAiProgramCourse {
  id?: string;
  courseLmsId: string;
  displayName?: string;
  shortDescription?: string;
  image?: string;
  order: number;
}

export interface IAiProgram {
  id: string;
  name: string;
  description: string;
  duration: string;
  imageUrl: string;
  bannerUrl: string;
  videoUrl: string;
  isActive: boolean;
  objective: string;
  skillsToAcquire: string;
  whatYouWillLearn: string;
  tags: string;
  isAIGenerated: boolean;
  order: number;
  categoryId: any;
  categoryName?: string;
  difficultyLevelId: any;
  difficultyLevelName?: string;
  courses: IAiProgramCourse[];
  banner?: string;
  cover?: string;
  generateBanner?: boolean;
  generateCover?: boolean;
  status: AiProgramStatus;
  aiProvider?: AiProviderType;
  generationPrompt?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface IAiProgramTableFilters {
  name: string;
  status: string;
}

export interface IAiProgramPaginationParams {
  page: number;
  perPage: number;
  search?: string;
}

export interface IAiProgramPaginationResponse {
  data: IAiProgram[];
  meta: {
    page: number;
    perPage: number;
    itemCount: number;
    pageCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

// Catalog types used by the chat panel
export interface ICatalogCourse {
  id: string;
  lmsCourseId: string;
  displayName: string;
  shortDescription: string;
  image?: string;
  integrationName?: string;
}

export interface ICatalogCategory {
  id: string;
  name: string;
  abreviation?: string;
}

export interface ICatalogDifficultyLevel {
  id: string;
  name: string;
  levelOrder?: number;
}

export interface ICatalogIntegrationInstance {
  id: string | number;
  instanceName: string;
  isActive: boolean;
  integration?: {
    id: string | number;
    name: string;
    image?: string;
    description?: string;
    integrationTypeName?: string;
  };
}

// System prompt for program generation
export const PROGRAM_GENERATION_SYSTEM_PROMPT = `You are an expert learning program designer. Your job is to create structured learning programs (learning objects) by selecting relevant courses from a provided catalog.

**Your workflow**:
1. The user will describe what kind of program they need (e.g., "a program for Python development", "a soft skills program").
2. You will receive catalogs of: available courses, categories, and difficulty levels.
3. You must search through the courses catalog and find courses relevant to the user's request.
4. If you find relevant courses, create a program that groups them logically.
5. If NO courses match the user's request, respond with a plain text message (NO JSON).

**CRITICAL RULES**:
- You can ONLY use courses from the provided catalog. Do NOT invent course IDs or names.
- ALL course IDs must use the "id" field from the catalog as the value for "courseLmsId" in the JSON output.
- Select the most appropriate categoryId and difficultyLevelId from their respective catalogs.
- Be concise. Do not explain step by step what you will do - just do it.
- isAIGenerated is always true.
- isActive is always false (draft mode).
- The "tags" field is a comma-separated string (e.g., "Python, Development, Backend").
- The "courses" array contains objects with "courseLmsId" (use the "id" field from the courses catalog, NOT the lmsCourseId) and "order" (number).
- "objective", "skillsToAcquire", and "whatYouWillLearn" should be descriptive paragraphs relevant to the selected courses.
- "duration" should be an estimated total duration (e.g., "8h 30m", "12h").

**STRICT JSON SYNTAX RULES** (the output MUST be parseable by JSON.parse):
- NO trailing commas after the last element in objects or arrays.
- NO JavaScript-style comments (// or /* */).
- NO single quotes — all strings must use double quotes.
- NO template literals or backtick characters inside the JSON.
- NO unquoted property names.
- ALL string values must be on a single line (no raw newlines inside strings — use \\n if needed).

**When NO courses match**, respond ONLY with plain text like:
"Lo siento, no encontré cursos relacionados con [topic]. Los cursos disponibles tratan sobre [list available topics]. ¿Te gustaría crear un programa con alguno de estos temas?"

**When you find matching courses**, respond with a brief 1-2 sentence summary and then immediately include the JSON wrapped in triple backticks:

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
      "courseLmsId": "id-from-catalog",
      "order": 1
    },
    {
      "courseLmsId": "id-from-catalog",
      "order": 2
    }
  ]
}
\`\`\`

**Guidelines**:
- Title should be descriptive and professional
- Select ALL courses that are relevant, even if partially related
- Order courses from foundational to advanced
- Banner description should be vivid and professional, suitable for AI image generation
- Cover description should be a square professional image, suitable as cover/thumbnail
- Tags should be relevant keywords separated by commas
- Choose the category that best fits the overall program topic
- Choose the difficulty level based on the overall course content difficulty
- Duration should be realistic based on the number and type of courses selected`;