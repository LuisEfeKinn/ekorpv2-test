// ----------------------------------------------------------------------
// AI Video Generation Service
// Generates videos using AI providers and uploads them
// Uses dynamic provider configuration from backend
// ----------------------------------------------------------------------

import type { AiProviderType } from 'src/types/ai-course';

import { CreateFileService } from '../file/CreateFile.service';

// ----------------------------------------------------------------------

export interface IAiVideoGenerationOptions {
  prompt: string;
  provider?: AiProviderType;
  model?: string;
  seconds?: 4 | 8 | 12;
  size?: '720x1280' | '1280x720' | '1024x1792' | '1792x1024';
}

export interface IAiVideoGenerationResponse {
  videoUrl: string;
  videoId: string;
}

// ----------------------------------------------------------------------

/**
 * Get the video generation endpoint for a specific provider
 */
function getVideoGenerationEndpoint(provider: AiProviderType): string {
  switch (provider) {
    case 'openai':
      return '/api/ai/openai/video';
    case 'gemini':
      return '/api/ai/gemini/video';
    case 'minimax':
      return '/api/ai/minimax/video';
    case 'deepseek':
      // DeepSeek doesn't support video generation, fallback to OpenAI
      return '/api/ai/openai/video';
    default:
      return '/api/ai/openai/video';
  }
}

/**
 * Get the default video model for a provider
 */
function getDefaultVideoModel(provider: AiProviderType): string {
  switch (provider) {
    case 'openai':
      return 'sora-2';
    case 'minimax':
      return 'video-01';
    case 'gemini':
      return 'veo-2';
    default:
      return 'sora-2';
  }
}

// ----------------------------------------------------------------------

/**
 * Generates a video using AI provider
 * Note: Video generation takes time (minutes), uses polling
 */
export async function GenerateAiVideoService(
  options: IAiVideoGenerationOptions,
  onProgress?: (progress: number, status: string) => void
): Promise<IAiVideoGenerationResponse> {
  try {
    // Determine which provider to use for video generation
    const provider = options.provider || 'openai';
    const model = options.model || getDefaultVideoModel(provider);
    
    // Get the correct endpoint for the provider
    const endpoint = getVideoGenerationEndpoint(provider);
    
    // Start video generation job
    const startResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: options.prompt,
        model,
        provider,
        seconds: options.seconds || 4,
        size: options.size || '1280x720',
      }),
    });

    if (!startResponse.ok) {
      const errorData = await startResponse.json().catch(() => ({}));
      
      // If provider doesn't support video generation (501), fallback to OpenAI
      if (startResponse.status === 501 && provider !== 'openai') {
        console.warn(`${provider} doesn't support video generation, falling back to OpenAI Sora`);
        return GenerateAiVideoService({
          ...options,
          provider: 'openai',
          model: 'sora-2',
        }, onProgress);
      }
      
      throw new Error(errorData.error || 'Failed to start video generation');
    }

    const responseData = await startResponse.json();

    // For MiniMax, the video is already downloaded and uploaded to S3 by the backend
    if (provider === 'minimax') {
      const { url, videoId } = responseData;
      
      if (!url) {
        throw new Error('No video URL returned from MiniMax');
      }

      onProgress?.(100, 'completed');

      // URL is already from S3, just return it
      return {
        videoUrl: url,
        videoId: videoId?.toString() || `minimax-${Date.now()}`,
      };
    }

    // For OpenAI and other providers that use async polling
    const { videoId } = responseData;

    // Poll for completion
    let status = 'queued';
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max (5s intervals)

    while (status !== 'completed' && status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      const statusResponse = await fetch(`/api/ai/openai/video?videoId=${videoId}`, {
        method: 'GET',
      });

      if (!statusResponse.ok) {
        throw new Error('Failed to check video status');
      }

      const statusData = await statusResponse.json();
      status = statusData.status;
      const progress = statusData.progress || 0;

      onProgress?.(progress, status);

      attempts++;
    }

    if (status === 'failed') {
      throw new Error('Video generation failed');
    }

    if (status !== 'completed') {
      throw new Error('Video generation timed out');
    }

    // Download video content
    const downloadResponse = await fetch(`/api/ai/openai/video/download?videoId=${videoId}`, {
      method: 'GET',
    });

    if (!downloadResponse.ok) {
      throw new Error('Failed to download video');
    }

    const downloadData = await downloadResponse.json();

    // Convert base64 to Blob
    const base64Response = await fetch(`data:${downloadData.contentType};base64,${downloadData.base64}`);
    const videoBlob = await base64Response.blob();

    // Create temporary URL
    const videoUrl = URL.createObjectURL(videoBlob);

    return {
      videoUrl,
      videoId,
    };
  } catch (error: any) {
    console.error('AI Video generation error:', error);
    throw new Error(error?.message || 'Failed to generate video');
  }
}

/**
 * Generates a video and uploads it to the server
 */
export async function GenerateAndUploadAiVideoService(
  options: IAiVideoGenerationOptions,
  uploadOptions?: {
    fileName?: string;
  },
  onProgress?: (progress: number, status: string) => void
): Promise<{ videoUrl: string; videoId: string }> {
  try {
    // Generate video
    const generatedVideo = await GenerateAiVideoService(options, onProgress);

    // Download video blob
    const videoResponse = await fetch(generatedVideo.videoUrl);
    const videoBlob = await videoResponse.blob();

    // Create File object
    const fileName = uploadOptions?.fileName || `ai-video-${Date.now()}.mp4`;
    const file = new File([videoBlob], fileName, { type: 'video/mp4' });

    // Upload to server
    const uploadResponse = await CreateFileService(file, {
      generateThumbnail: true,
      compress: false, // Don't compress videos
    });

    // Clean up blob URL
    URL.revokeObjectURL(generatedVideo.videoUrl);

    return {
      videoUrl: uploadResponse.url,
      videoId: generatedVideo.videoId,
    };
  } catch (error: any) {
    console.error('AI Video generation and upload error:', error);
    throw new Error(error?.message || 'Failed to generate and upload video');
  }
}

/**
 * Generates multiple videos for course sections
 */
export async function GenerateCourseVideosService(
  courseTitle: string,
  sections: Array<{ title: string; description?: string; video?: string }>,
  options?: {
    provider?: AiProviderType;
    seconds?: 4 | 8 | 12;
    size?: '720x1280' | '1280x720' | '1024x1792' | '1792x1024';
    onProgress?: (current: number, total: number, sectionProgress?: number) => void;
  }
): Promise<Array<{ sectionIndex: number; videoUrl: string; videoId: string }>> {
  const results: Array<{ sectionIndex: number; videoUrl: string; videoId: string }> = [];
  const total = sections.length;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    
    // Use provided video description or create one from title/description
    const prompt = section.video || `Create a professional, educational video for a course section titled "${section.title}" from the course "${courseTitle}". ${section.description || ''}. Make it visually engaging and relevant to the educational content. Style: modern, clean, professional.`;

    try {
      // Call progress callback
      options?.onProgress?.(i, total, 0);

      const result = await GenerateAndUploadAiVideoService(
        {
          prompt,
          provider: options?.provider || 'openai',
          seconds: options?.seconds || 4,
          size: options?.size || '1280x720',
        },
        {
          fileName: `course-${courseTitle.toLowerCase().replace(/\s+/g, '-')}-section-${i + 1}.mp4`,
        },
        (progress, status) => {
          options?.onProgress?.(i, total, progress);
        }
      );

      results.push({
        sectionIndex: i,
        videoUrl: result.videoUrl,
        videoId: result.videoId,
      });
    } catch (error) {
      console.error(`Failed to generate video for section ${i}:`, error);
      // Continue with next section even if one fails
    }
  }

  // Final progress callback
  options?.onProgress?.(total, total, 100);

  return results;
}
