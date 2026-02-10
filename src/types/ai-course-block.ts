// ----------------------------------------------------------------------
// AI Course Block Types
// ----------------------------------------------------------------------

import type { IAiCourseMedia } from './ai-course-media';

export type BlockType =
  | 'text'
  | 'heading'
  | 'paragraph'
  | 'list'
  | 'code'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'quiz'
  | 'callout'
  | 'divider'
  | 'embed';

export interface IAiCourseBlock {
  id: string;
  type: BlockType;
  content: IBlockContent;
  order: number;
  sectionId: string;
  media?: IAiCourseMedia[];
  metadata?: IBlockMetadata;
}

export interface IBlockContent {
  // For text/heading/paragraph blocks
  text?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6; // Heading levels
  
  // For list blocks
  items?: string[];
  listType?: 'ordered' | 'unordered';
  
  // For code blocks
  code?: string;
  language?: string;
  
  // For media blocks
  url?: string;
  caption?: string;
  altText?: string;
  
  // For quiz blocks
  question?: string;
  options?: IQuizOption[];
  correctAnswer?: string;
  explanation?: string;
  
  // For callout blocks
  calloutType?: 'info' | 'warning' | 'success' | 'error' | 'tip';
  title?: string;
  
  // For embed blocks
  embedUrl?: string;
  embedType?: 'youtube' | 'vimeo' | 'iframe' | 'other';
}

export interface IQuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface IBlockMetadata {
  createdAt?: string;
  updatedAt?: string;
  generatedBy?: 'ai' | 'manual';
  aiModel?: string;
}

export interface IBlockCreateData {
  type: BlockType;
  content: IBlockContent;
  sectionId: string;
  order: number;
}

export interface IBlockUpdateData {
  type?: BlockType;
  content?: Partial<IBlockContent>;
  order?: number;
}
