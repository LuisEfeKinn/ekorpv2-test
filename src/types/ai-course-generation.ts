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
- needsImage: true - Static concepts, diagrams, illustrations, infographics
- needsVideo: true - Demonstrations, processes, animations, practical examples
- banner - Professional course banner description (16:9)

**JSON Structure** (wrap in triple backticks with json tag):
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
      "needsVideo": true,
      "image": "Concise image generation prompt (if needsImage is true)",
      "video": "Concise video generation prompt (if needsVideo is true)",
      "blocks": [
        {
          "type": "html",
          "content": {
            "html": "<h2>Section Topic</h2><p>Extensive, detailed paragraph explaining concepts thoroughly with examples and context. Include multiple paragraphs for comprehensive coverage.</p><h3>Key Points</h3><ul><li>Detailed point 1 with thorough explanation</li><li>Detailed point 2 with context and examples</li><li>Detailed point 3 with practical applications</li></ul><h3>Code Example</h3><pre><code class='language-javascript'>const example = 'Place code in single line or use spaces'; function demo() { return 'Use single quotes inside HTML'; }</code></pre><div class='quiz-block'><h4>Quiz: Test Your Understanding</h4><p><strong>Question:</strong> What is the main concept?</p><ul><li>Option A: Incorrect answer</li><li>Option B: Correct answer</li><li>Option C: Incorrect answer</li></ul><p><em>Explanation: Detailed explanation of why option B is correct.</em></p></div>"
          },
          "order": 0
        }
      ]
    }
  ]
}

**Critical Guidelines**:
1. **Use HTML for ALL text content** - Everything that is text-based goes in HTML blocks (explanations, lists, code examples, quizzes, etc.)
2. **Rich HTML structure** - Use semantic HTML tags like h2, h3, h4, p, ul, ol, li, strong, em, blockquote
3. **Code within HTML** - Place code examples inside HTML using pre and code tags. Use &lt; for < and &gt; for > in code. Example: "<pre><code class='language-javascript'>const x = 5; console.log(x);</code></pre>"
4. **Quizzes within HTML** - Include quiz questions, options, and explanations within HTML using structured divs, lists, and emphasis
5. **Comprehensive HTML blocks** - Each HTML block should be substantial (5-10 paragraphs) covering a complete topic with examples, code, and exercises
6. **Only 3 block types allowed**: "html" for all text content, "image" for images, "video" for videos - NO separate "code" or "quiz" types
7. **2-5 sections per course** - Each section typically has 1-2 large HTML blocks (unless image/video is needed)
8. **Smart media decisions** - Only add separate image/video blocks when visual content genuinely adds value
9. **CRITICAL JSON FORMATTING**:
   - The HTML content MUST be a single line string without literal line breaks
   - Use ONLY single quotes or escaped double quotes inside HTML attributes
   - For code examples, write code in a single line or use HTML entities for special characters
   - Example: "html": "<h2>Title</h2><p>Text</p><pre><code>const example = 'hello'; function test() { return true; }</code></pre>"
   - DO NOT use unescaped double quotes inside the HTML string
   - DO NOT include literal newline characters (\\n should be part of code display, not JSON structure)

IMPORTANT: Do NOT create separate blocks for code or quizzes. Everything text-based must be in a single comprehensive HTML block. Ensure valid JSON by keeping HTML as a single-line string.`;

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
