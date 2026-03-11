// ----------------------------------------------------------------------
// Create File Service
// Upload files via multipart/form-data
// ----------------------------------------------------------------------

import type { MediaType, IMediaUploadOptions, IMediaUploadResponse } from 'src/types/ai-course-media';

import axios, { endpoints } from 'src/utils/axios';

import { MAX_FILE_SIZES, ALLOWED_MIME_TYPES } from 'src/types/ai-course-media';


// ----------------------------------------------------------------------

export interface IUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface IUploadError {
  message: string;
  code: 'INVALID_TYPE' | 'FILE_TOO_LARGE' | 'UPLOAD_FAILED' | 'UNKNOWN';
}

// ----------------------------------------------------------------------

/**
 * Determines the media type from a MIME type
 */
export function getMediaTypeFromMime(mimeType: string): MediaType {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';

  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument',
    'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint',
    'text/plain',
  ];

  if (documentTypes.some(type => mimeType.startsWith(type))) {
    return 'document';
  }

  return 'other';
}

/**
 * Validates a file before upload
 */
export function validateFile(
  file: File,
  options?: IMediaUploadOptions
): { valid: boolean; error?: IUploadError } {
  const mediaType = getMediaTypeFromMime(file.type);

  // Check file type
  if (options?.allowedTypes && !options.allowedTypes.includes(mediaType)) {
    return {
      valid: false,
      error: {
        message: `File type "${mediaType}" is not allowed`,
        code: 'INVALID_TYPE',
      },
    };
  }

  // Check MIME type
  const allowedMimes = options?.allowedMimeTypes || ALLOWED_MIME_TYPES[mediaType];
  if (!allowedMimes.includes(file.type) && !allowedMimes.includes('*/*')) {
    return {
      valid: false,
      error: {
        message: `MIME type "${file.type}" is not allowed`,
        code: 'INVALID_TYPE',
      },
    };
  }

  // Check file size
  const maxSize = options?.maxSize || MAX_FILE_SIZES[mediaType];
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: {
        message: `File size exceeds maximum of ${maxSizeMB}MB`,
        code: 'FILE_TOO_LARGE',
      },
    };
  }

  return { valid: true };
}

/**
 * Uploads a single file
 */
export async function CreateFileService(
  file: File,
  options?: IMediaUploadOptions & {
    onProgress?: (progress: IUploadProgress) => void;
  }
): Promise<IMediaUploadResponse> {
  // Validate file
  const validation = validateFile(file, options);
  if (!validation.valid) {
    throw new Error(validation.error?.message || 'File validation failed');
  }

  // Create form data
  const formData = new FormData();
  formData.append('file', file);

  // Add metadata
  const mediaType = getMediaTypeFromMime(file.type);
  formData.append('type', mediaType);

  if (options?.generateThumbnail) {
    formData.append('generateThumbnail', 'true');
  }

  if (options?.compress) {
    formData.append('compress', 'true');
  }

  try {
    const response = await axios.post(endpoints.file.upload, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (options?.onProgress && progressEvent.total) {
          const progress: IUploadProgress = {
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
          };
          options.onProgress(progress);
        }
      },
    });

    // Server response structure: { message, codeStatus, data: { url, fileName } }
    const responseData = response.data.data || response.data;
    
    return {
      id: responseData.id || responseData.fileId || responseData.fileName,
      url: responseData.url || responseData.fileUrl,
      name: responseData.fileName || responseData.name || file.name,
      type: mediaType,
      size: file.size,
      mimeType: file.type,
    };
  } catch (error: any) {
    console.error('File upload error:', error);
    throw new Error(error?.message || 'Failed to upload file');
  }
}

/**
 * Uploads multiple files
 */
export async function CreateMultipleFilesService(
  files: File[],
  options?: IMediaUploadOptions & {
    onProgress?: (fileIndex: number, progress: IUploadProgress) => void;
    onFileComplete?: (fileIndex: number, response: IMediaUploadResponse) => void;
  }
): Promise<IMediaUploadResponse[]> {
  const results: IMediaUploadResponse[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const response = await CreateFileService(file, {
      ...options,
      onProgress: (progress) => options?.onProgress?.(i, progress),
    });

    results.push(response);
    options?.onFileComplete?.(i, response);
  }

  return results;
}

/**
 * Deletes a file by ID
 */
export const DeleteFileService = async (file: any) => {
  const deleteEndpoint = `${endpoints.file.delete}`;
  const response = await axios.delete(deleteEndpoint, file);
  return response;
}