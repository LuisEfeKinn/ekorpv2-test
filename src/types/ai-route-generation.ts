// ----------------------------------------------------------------------
// AI Route (Learning Path) Generation Types
// ----------------------------------------------------------------------

import type { AiProviderType } from './ai-course';

// ----------------------------------------------------------------------

export type AiRouteStatus = 'draft' | 'generating' | 'completed' | 'published' | 'archived';

export interface IAiRouteProgram {
  id: string;
  displayName: string;
  shortDescription: string;
  image?: string;
  order: number;
  integrationName?: string;
}

export interface IAiRouteLearningObject {
  learningObjectId: number;
  displayName?: string;
  shortDescription?: string;
  image?: string;
  order: number;
  isOptional: boolean;
}

export interface IAiRouteModule {
  competencyId: number;
  competencyName?: string;
  skillLevelId: number;
  skillLevelName?: string;
  order: number;
  learningObjects: IAiRouteLearningObject[];
}

export interface IAiRoute {
  id: string;
  title: string;
  description: string;
  tags: string[];
  bannerUrl?: string;
  banner?: string;
  videoUrl?: string;
  positionId?: number;
  positionName?: string;
  programs: IAiRouteProgram[];
  modules: IAiRouteModule[];
  isAIGenerated?: boolean;
  status: AiRouteStatus;
  aiProvider?: AiProviderType;
  generationPrompt?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface IAiRouteTableFilters {
  name: string;
  status: string;
}

export interface IAiRoutePaginationParams {
  page: number;
  perPage: number;
  search?: string;
  status?: AiRouteStatus;
}

export interface IAiRoutePaginationResponse {
  data: IAiRoute[];
  meta: {
    page: number;
    perPage: number;
    itemCount: number;
    pageCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

// System prompt for learning path generation
export const ROUTE_GENERATION_SYSTEM_PROMPT = `You are an expert learning path designer. Your job is to create structured learning paths organized into modules, selecting from provided catalogs of positions, competencies, skill levels, and learning objects.

**Your workflow**:
1. The user will ask you to create a learning path for a specific topic, skill, or role.
2. You will receive catalogs of: positions, competencies, skill levels, and learning objects.
3. You must select an appropriate position from the catalog, then organize relevant learning objects into modules by competency and skill level.
4. If you cannot find relevant learning objects, respond with a plain text message (no JSON).

**CRITICAL RULES**:
- You can ONLY use items from the provided catalogs. Do NOT invent IDs or names.
- ALL IDs must be numbers (not strings).
- Each module groups learning objects under a competency and skill level.
- Order modules and learning objects logically (foundational first, advanced last).
- If the request doesn't match ANY learning object in the catalog, respond ONLY with a plain text message like: "Lo siento, no encontré objetos de aprendizaje relacionados con [tema]. Los disponibles son sobre [listar temas]. ¿Te gustaría crear una ruta con alguno de estos temas?"
- Be concise. Focus on delivering the JSON response.
- isAIGenerated is always true.

**When you find matching items**, respond with a brief 1-2 sentence summary and then immediately include the JSON structure wrapped in triple backticks:

\`\`\`json
{
  "title": "Learning Path Title",
  "description": "Brief but comprehensive description of the learning path",
  "tags": ["tag1", "tag2"],
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
          "displayName": "Learning Object Name from catalog",
          "shortDescription": "Description from catalog",
          "image": "image-url-from-catalog",
          "order": 1,
          "isOptional": false
        }
      ]
    }
  ]
}
\`\`\`

**Guidelines for the learning path**:
- Title should be descriptive and professional
- Select the most relevant position from the positions catalog
- Group learning objects into modules by competency - each module should have ONE competency and ONE skill level
- Skill levels go from basic to advanced - assign appropriately based on module content
- Tags should be relevant keywords
- Banner description should be vivid and professional, suitable for AI image generation
- Order modules from foundational to advanced
- Include all learning objects that are relevant, even partially
- Mark isOptional as true for supplementary/optional learning objects`;
