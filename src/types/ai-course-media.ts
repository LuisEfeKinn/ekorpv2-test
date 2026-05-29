// ----------------------------------------------------------------------
// AI Course Media Types
// ----------------------------------------------------------------------

export type MediaType = 'image' | 'video' | 'audio' | 'document' | 'other';

export interface IAiCourseMedia {
  id: string;
  type: MediaType;
  url: string;
  name: string;
  thumbnailUrl?: string;
  bannerUrl?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  width?: number;
  height?: number;
  duration?: number; // For video/audio in seconds
  caption?: string;
  altText?: string;
  blockId?: string;
  courseId?: string;
  metadata?: IMediaMetadata;
  createdAt?: string;
  updatedAt?: string;
}

export interface IMediaMetadata {
  encoding?: string;
  format?: string;
  bitrate?: number;
  resolution?: string;
  frameRate?: number;
  codec?: string;
}

export interface IMediaUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface IMediaUploadResponse {
  id: string;
  url: string;
  name: string;
  type: MediaType;
  size: number;
  mimeType: string;
}

export interface IMediaUploadOptions {
  maxSize?: number; // In bytes
  allowedTypes?: MediaType[];
  allowedMimeTypes?: string[];
  generateThumbnail?: boolean;
  compress?: boolean;
}

// Allowed MIME types by media type
export const ALLOWED_MIME_TYPES: Record<MediaType, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
  ],
  other: ['*/*'],
};

// Maximum file sizes by media type (in bytes)
export const MAX_FILE_SIZES: Record<MediaType, number> = {
  image: 10 * 1024 * 1024, // 10MB
  video: 500 * 1024 * 1024, // 500MB
  audio: 50 * 1024 * 1024, // 50MB
  document: 25 * 1024 * 1024, // 25MB
  other: 10 * 1024 * 1024, // 10MB
};
