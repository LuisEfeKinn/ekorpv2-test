// ----------------------------------------------------------------------
// AI Course Types
// ----------------------------------------------------------------------

import type { IAiCourseBlock } from './ai-course-block';

export type AiCourseStatus = 'draft' | 'generating' | 'completed' | 'published' | 'archived';

export interface IAiCourse {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  targetAudience: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  tags: string[];
  bannerUrl?: string;
  banner?: string; // Description for generating course banner image
  sections: IAiCourseSection[];
  sectionsCount?: any;
  status: AiCourseStatus;
  aiProvider?: AiProviderType;
  generationPrompt?: string;
  metadata?: IAiCourseMetadata;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  data?: any;
}

export interface IAiCourseSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  blocks: IAiCourseBlock[];
  duration?: string;
  needsImage?: boolean; // AI decides if this section needs an image
  needsVideo?: boolean; // AI decides if this section needs a video
  image?: string; // Description for AI image generation
  video?: string; // Description for AI video generation
  images?: Array<{ url: string }>; // Array of generated images
  videos?: Array<{ url: string; videoId?: string }>; // Array of generated videos
  // Legacy fields (deprecated, use arrays above)
  imageUrl?: string;
  videoUrl?: string;
}

export interface IAiCourseMetadata {
  totalDuration?: string;
  totalSections?: number;
  totalBlocks?: number;
  lastGeneratedAt?: string;
  generationModel?: string;
  estimatedReadingTime?: string;
}

export type AiProviderType = 'openai' | 'gemini' | 'minimax' | 'deepseek' | 'proprietary';

export interface IAiCourseTableFilters {
  name: string;
  status: string;
  difficulty: string;
}

export interface IAiCourseFormData {
  title: string;
  description: string;
  objectives: string[];
  targetAudience: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  tags: string[];
  bannerUrl?: string;
}

export interface IAiCoursePaginationParams {
  page: number;
  perPage: number;
  search?: string;
  status?: AiCourseStatus;
  difficulty?: string;
  order?: string;
}

export interface IAiCoursePaginationResponse {
  data: IAiCourse[];
  meta: {
    page: number;
    perPage: number;
    itemCount: number;
    pageCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}
