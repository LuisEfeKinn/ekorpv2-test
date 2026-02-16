// ----------------------------------------------------------------------
// AI Course Generation Types
// ----------------------------------------------------------------------

import type { IAiCourseBlock } from './ai-course-block';
import type { IAiCourse, AiProviderType, IAiCourseSection } from './ai-course';

export interface IAiGenerationConfig {
  provider: AiProviderType;
  model: string;
  temperature?: number;
  maxTokens?: number;
  max_completion_tokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface IAiChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  metadata?: IChatMessageMetadata;
}

export interface IChatMessageMetadata {
  provider?: AiProviderType;
  model?: string;
  tokensUsed?: number;
  generationTime?: number;
}

export interface IAiGenerationPrompt {
  topic: string;
  description?: string;
  targetAudience?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  duration?: string;
  language?: string;
  style?: 'formal' | 'casual' | 'technical' | 'simple';
  includeQuizzes?: boolean;
  includeExamples?: boolean;
  numberOfSections?: number;
}

export interface IAiGenerationResponse {
  success: boolean;
  course?: Partial<IAiCourse>;
  sections?: IAiCourseSection[];
  blocks?: IAiCourseBlock[];
  generateImages?: boolean;
  generateVideos?: boolean;
  error?: string;
  usage?: IAiUsageStats;
}

export interface IAiUsageStats {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost?: number;
}

export interface IAiStreamChunk {
  type: 'text' | 'section' | 'block' | 'done' | 'error';
  content: string;
  metadata?: Record<string, unknown>;
}

export interface IAiProviderConfig {
  id: AiProviderType;
  name: string;
  models: IAiModel[];
  isAvailable: boolean;
  requiresApiKey: boolean;
  supportsStreaming: boolean;
}

export interface IAiModel {
  id: string;
  name: string;
  description?: string;
  maxTokens?: number;
  max_completion_tokens?: number;
  contextWindow: number;
  isDefault?: boolean;
  capabilities: ('text' | 'code' | 'image' | 'video' | 'audio' | 'reasoning')[];
}

// System prompts for course generation
export const COURSE_GENERATION_SYSTEM_PROMPT = `You are an expert educational content creator. Create comprehensive, engaging, and well-structured online courses.

**Response Format**: Provide a brief 2-3 sentence overview, then immediately include the complete course structure in JSON format. Focus your effort on creating rich, detailed content within the sections rather than lengthy explanations.

**Visual Media Strategy**:
- \`needsImage: true\` - Static concepts, diagrams, illustrations, infographics
- \`needsVideo: true\` - Demonstrations, processes, animations, practical examples
- \`banner\` - Professional course banner description (16:9)

**JSON Structure** (use triple backticks with "json" tag):
\`\`\`json
{
  "title": "Course Title",
  "description": "Comprehensive course description",
  "difficulty": "beginner|intermediate|advanced",
  "duration": "X hours",
  "language": "es|en",
  "targetAudience": "Target audience description",
  "objectives": ["Specific objective 1", "Specific objective 2", "Specific objective 3"],
  "tags": ["tag1", "tag2"],
  "banner": "Professional 16:9 banner image description",
  "generateImages": true,
  "generateVideos": true,
  "sections": [
    {
      "title": "Section Title",
      "description": "Detailed section description explaining what will be learned",
      "duration": "X minutes",
      "order": 0,
      "needsImage": true,
      "needsVideo": false,
      "image": "Concise image generation prompt (if needsImage is true)",
      "video": "Concise video generation prompt (if needsVideo is true)",
      "blocks": [
        {
          "type": "heading",
          "content": {"text": "Main Topic"},
          "order": 0
        },
        {
          "type": "text",
          "content": {"text": "Extensive, detailed paragraph explaining concepts thoroughly with examples and context"},
          "order": 1
        },
        {
          "type": "list",
          "content": {
            "items": ["Detailed point 1 with explanation", "Detailed point 2 with explanation"],
            "ordered": false
          },
          "order": 2
        }
      ]
    }
  ]
}
\`\`\`

**Critical Guidelines**:
1. **Prioritize rich section content** - Each section should have 5-8 detailed blocks with extensive explanations
2. **Detailed text blocks** - Write comprehensive paragraphs (3-5 sentences minimum) that thoroughly explain concepts
3. **Practical examples** - Include real-world examples and use cases in text blocks
4. **Code blocks** - If relevant, include detailed, well-commented code examples
5. **Structured lists** - Use lists for step-by-step instructions or key points with explanations
6. **3-6 sections** per course - Each section thoroughly covering a major topic
7. **Smart media decisions** - Only set needsImage/needsVideo to true when visual content adds real value
8. **Valid JSON** - Ensure proper formatting and escaping

Focus maximum effort on creating valuable, detailed educational content within each section block rather than conversational explanations.`;

export const SECTION_GENERATION_PROMPT = `Generate detailed content for a course section. Include:
- A compelling section title
- Clear learning objectives for the section
- Multiple content blocks (text, examples, code if relevant)
- A summary
- Quiz questions to test understanding`;

export const BLOCK_GENERATION_PROMPT = `Generate a content block for the course. The block should be:
- Well-structured and easy to read
- Engaging and informative
- Appropriate for the target audience level
- Include practical examples where relevant`;
