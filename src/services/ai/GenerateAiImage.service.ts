// ----------------------------------------------------------------------
// AI Image Generation Service
// Generates images using AI providers and uploads them
// Uses dynamic provider configuration from backend
// ----------------------------------------------------------------------

import type { AiProviderType } from 'src/types/ai-course';

import { CreateFileService } from '../file/CreateFile.service';

// ----------------------------------------------------------------------

/**
 * Get auth token from sessionStorage
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('accessToken') || sessionStorage.getItem('jwt_access_token');
}

// ----------------------------------------------------------------------

export interface IAiImageGenerationOptions {
  prompt: string;
  provider: AiProviderType;
  model?: string;
  size?: '256x256' | '512x512' | '1024x1024' | '1536x1024' | '1024x1536' | 'auto';
  quality?: 'standard' | 'hd' | 'auto';
  style?: 'vivid' | 'natural';
}

export interface IAiImageGenerationResponse {
  url?: string;
  revisedPrompt?: string;
  provider: AiProviderType;
  // For proprietary provider that returns binary directly
  base64?: string;
  contentType?: string;
  fileName?: string;
}

// ----------------------------------------------------------------------

/**
 * Generates an image using AI and returns the URL
 * Uses the legacy provider type to determine endpoint
 */
export async function GenerateAiImageService(
  options: IAiImageGenerationOptions
): Promise<IAiImageGenerationResponse> {
  try {
    // Determine which provider to use for image generation
    const provider = options.provider;
    const model = options.model; // Use the model passed from the selector
    
    const endpoint = getImageGenerationEndpoint(provider);
    
    const requestBody: any = {
      prompt: options.prompt,
      n: 1,
    };

    // Only include size if provided (let API endpoint handle defaults)
    if (options.size) {
      requestBody.size = options.size;
    }

    // Only include quality if provided (let API endpoint handle defaults)
    if (options.quality) {
      requestBody.quality = options.quality;
    }

    // Only include model if it's provided (let API endpoint handle defaults)
    if (model) {
      requestBody.model = model;
    }

    // Build headers with auth token
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    const authToken = getAuthToken();
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // If provider doesn't support image generation (501), fallback to OpenAI
      if (response.status === 501 && provider !== 'openai') {
        console.warn(`${provider} doesn't support image generation, falling back to OpenAI DALL-E 3`);
        return GenerateAiImageService({
          ...options,
          provider: 'openai',
          model: 'dall-e-3',
        });
      }
      
      throw new Error(errorData.error || `Image generation failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Proprietary provider returns base64 directly
    if (provider === 'proprietary' && data.base64) {
      return {
        base64: data.base64,
        contentType: data.contentType,
        fileName: data.fileName,
        revisedPrompt: data.revisedPrompt,
        provider,
      };
    }

    return {
      url: data.url,
      revisedPrompt: data.revisedPrompt,
      provider,
    };
  } catch (error: any) {
    console.error('AI Image generation error:', error);
    throw new Error(error?.message || 'Failed to generate image');
  }
}

/**
 * Generates an image and uploads it to the server
 */
export async function GenerateAndUploadAiImageService(
  options: IAiImageGenerationOptions,
  uploadOptions?: {
    fileName?: string;
    generateThumbnail?: boolean;
  }
): Promise<{ imageUrl: string; revisedPrompt?: string }> {
  try {
    // Generate image
    const generatedImage = await GenerateAiImageService(options);

    let downloadData: { base64: string; contentType: string; fileName: string };

    // If proprietary provider, we already have the base64
    if (generatedImage.base64) {
      downloadData = {
        base64: generatedImage.base64,
        contentType: generatedImage.contentType || 'image/png',
        fileName: generatedImage.fileName || uploadOptions?.fileName || `ai-generated-${Date.now()}.png`,
      };
    } else {
      // Download the generated image via server-side proxy (avoids CORS)
      const downloadResponse = await fetch('/api/ai/upload-generated-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: generatedImage.url,
          fileName: uploadOptions?.fileName || `ai-generated-${Date.now()}.png`,
        }),
      });

      if (!downloadResponse.ok) {
        throw new Error('Failed to download generated image');
      }

      downloadData = await downloadResponse.json();
    }

    // Convert base64 to Blob
    const base64Response = await fetch(`data:${downloadData.contentType};base64,${downloadData.base64}`);
    const imageBlob = await base64Response.blob();

    // Create File object
    const file = new File([imageBlob], downloadData.fileName, { type: downloadData.contentType });

    // Upload to server
    const uploadResponse = await CreateFileService(file, {
      generateThumbnail: uploadOptions?.generateThumbnail ?? true,
      compress: true,
    });

    return {
      imageUrl: uploadResponse.url,
      revisedPrompt: generatedImage.revisedPrompt,
    };
  } catch (error: any) {
    console.error('AI Image generation and upload error:', error);
    throw new Error(error?.message || 'Failed to generate and upload image');
  }
}

/**
 * Generates multiple images for course sections
 * Uses the specified provider for image generation
 */
export async function GenerateCourseImagesService(
  courseTitle: string,
  sections: Array<{ title: string; description?: string; image?: string }>,
  options?: {
    provider?: AiProviderType;
    model?: string;
    size?: '256x256' | '512x512' | '1024x1024' | '1536x1024' | '1024x1536' | 'auto';
    quality?: 'standard' | 'hd' | 'auto';
    onProgress?: (current: number, total: number) => void;
  }
): Promise<Array<{ sectionIndex: number; imageUrl: string }>> {
  const results: Array<{ sectionIndex: number; imageUrl: string }> = [];
  const total = sections.length;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    
    // Use provided image description or create one from title/description
    const prompt = section.image || `Create a professional, educational illustration for a course section titled "${section.title}" from the course "${courseTitle}". ${section.description || ''}. Make it visually appealing and relevant to the educational content. Style: modern, clean, professional.`;

    try {
      // Call progress callback
      options?.onProgress?.(i, total);

      const result = await GenerateAndUploadAiImageService(
        {
          prompt,
          provider: options?.provider || 'openai', // Use specified provider or fallback to OpenAI
          model: options?.model, // Use selected model
          size: options?.size || '1024x1024',
          quality: options?.quality || 'standard',
        },
        {
          fileName: `course-${courseTitle.toLowerCase().replace(/\s+/g, '-')}-section-${i + 1}.png`,
          generateThumbnail: true,
        }
      );

      results.push({
        sectionIndex: i,
        imageUrl: result.imageUrl,
      });
    } catch (error) {
      console.error(`Failed to generate image for section ${i}:`, error);
      // Continue with next section even if one fails
    }
  }

  // Final progress callback
  options?.onProgress?.(total, total);

  return results;
}

// ----------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------

function getImageGenerationEndpoint(provider: AiProviderType): string {
  const endpoints: Record<AiProviderType, string> = {
    openai: '/api/ai/openai/image',
    gemini: '/api/ai/gemini/image', // Not available - requires Vertex AI
    deepseek: '/api/ai/deepseek/image', // Not implemented
    minimax: '/api/ai/minimax/image', // Not implemented
    proprietary: '/api/ai/proprietary/image',
  };

  return endpoints[provider];
}
