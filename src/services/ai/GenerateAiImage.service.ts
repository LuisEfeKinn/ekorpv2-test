// ----------------------------------------------------------------------
// AI Image Generation Service
// Generates images using AI providers and uploads them
// Uses dynamic provider configuration from backend
// ----------------------------------------------------------------------

import type { AiProviderType } from 'src/types/ai-course';

import { CreateFileService } from '../file/CreateFile.service';

// ----------------------------------------------------------------------

export interface IAiImageGenerationOptions {
  prompt: string;
  provider: AiProviderType;
  model?: string;
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
}

export interface IAiImageGenerationResponse {
  url: string;
  revisedPrompt?: string;
  provider: AiProviderType;
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
    let model = options.model || 'dall-e-3';
    
    // Map provider to appropriate image model
    if (provider === 'openai' && !options.model) {
      model = 'dall-e-3';
    } else if (provider === 'minimax' && !options.model) {
      model = 'image-01';
    }
    
    const endpoint = getImageGenerationEndpoint(provider);
    
    const requestBody: any = {
      prompt: options.prompt,
      size: options.size || '1024x1024',
      model,
      quality: options.quality || 'standard',
      style: options.style || 'vivid',
      n: 1,
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

    const downloadData = await downloadResponse.json();

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
 * Note: Always uses OpenAI (DALL-E 3) regardless of provider option
 */
export async function GenerateCourseImagesService(
  courseTitle: string,
  sections: Array<{ title: string; description?: string; image?: string }>,
  options?: {
    provider?: AiProviderType; // Ignored - always uses OpenAI
    size?: '256x256' | '512x512' | '1024x1024';
    quality?: 'standard' | 'hd';
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
          provider: 'openai', // Always use OpenAI for images
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
    proprietary: '/api/ai/proprietary/image', // Not implemented
  };

  return endpoints[provider];
}
