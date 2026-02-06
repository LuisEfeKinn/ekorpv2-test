// ----------------------------------------------------------------------
// Proprietary Video Generation Service
// Generates videos using N8N Webhook + JSON2Video API
// ----------------------------------------------------------------------

import { CreateFileService } from '../file/CreateFile.service';

// ----------------------------------------------------------------------

export interface IN8NVideoRequest {
  user_prompt: string;
  duration_scences: number; // 4, 6, or 12
  scences_number: number;
}

export interface IN8NVideoResponse {
  status: string;
  message: string;
  project_id: string;
  timestamp: string;
}

export interface IJson2VideoStatus {
  success: boolean;
  movie: {
    success: boolean;
    status: 'pending' | 'processing' | 'done' | 'error';
    message: string;
    project: string;
    url?: string;
    ass?: string; // Subtitles URL
    created_at: string;
    ended_at?: string;
    duration?: number;
    size?: number;
    width?: number;
    height?: number;
    rendering_time?: number;
  };
  remaining_quota?: {
    time: number;
  };
}

export interface IProprietaryVideoProgress {
  stage: 'initializing' | 'generating' | 'polling' | 'downloading' | 'uploading' | 'completed' | 'error';
  progress: number;
  message: string;
  projectId?: string;
}

export interface IProprietaryVideoResult {
  videoUrl: string;
  videoId: string;
  duration?: number;
  size?: number;
}

// ----------------------------------------------------------------------

/**
 * Initiates video generation through N8N webhook
 * This service handles long-running video generation tasks
 */
export async function InitiateProprietaryVideoService(
  request: IN8NVideoRequest,
  onProgress?: (progress: IProprietaryVideoProgress) => void
): Promise<IN8NVideoResponse> {
  try {
    onProgress?.({
      stage: 'initializing',
      progress: 5,
      message: 'Iniciando generación de video...',
    });

    // Call our API route that will proxy to N8N
    const response = await fetch('/api/ai/proprietary/video/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error en N8N: ${response.status}`);
    }

    const data = await response.json();
    
    // N8N can return an array or object
    const result = Array.isArray(data) ? data[0] : data;
    
    if (!result.project_id) {
      throw new Error('Respuesta inválida de N8N: falta el ID del proyecto');
    }

    onProgress?.({
      stage: 'generating',
      progress: 15,
      message: 'Video en generación...',
      projectId: result.project_id,
    });

    return result;
  } catch (error: any) {
    console.error('Error initiating proprietary video:', error);
    throw new Error(error?.message || 'Error al iniciar la generación de video');
  }
}

// ----------------------------------------------------------------------

/**
 * Polls JSON2Video API to check video generation status
 */
export async function PollVideoStatusService(
  projectId: string
): Promise<IJson2VideoStatus> {
  try {
    const response = await fetch(`/api/ai/proprietary/video/status?project=${projectId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error checking status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error polling video status:', error);
    throw new Error(error?.message || 'Error al verificar estado del video');
  }
}

// ----------------------------------------------------------------------

/**
 * Downloads video from JSON2Video CDN and uploads to our server
 */
export async function DownloadAndUploadVideoService(
  videoUrl: string,
  projectId: string,
  onProgress?: (progress: IProprietaryVideoProgress) => void
): Promise<IProprietaryVideoResult> {
  try {
    onProgress?.({
      stage: 'downloading',
      progress: 70,
      message: 'Descargando video...',
      projectId,
    });

    // Download through our proxy to avoid CORS
    const downloadResponse = await fetch(`/api/ai/proprietary/video/download?url=${encodeURIComponent(videoUrl)}`);

    if (!downloadResponse.ok) {
      throw new Error('Error al descargar el video');
    }

    // Get video as blob
    const videoBlob = await downloadResponse.blob();
    
    onProgress?.({
      stage: 'uploading',
      progress: 85,
      message: 'Subiendo video al servidor...',
      projectId,
    });

    // Create File object for upload
    const fileName = `proprietary-video-${projectId}-${Date.now()}.mp4`;
    const file = new File([videoBlob], fileName, { type: 'video/mp4' });

    // Upload to our server
    const uploadResponse = await CreateFileService(file, {
      generateThumbnail: true,
      compress: false,
    });

    onProgress?.({
      stage: 'completed',
      progress: 100,
      message: 'Video generado exitosamente',
      projectId,
    });

    return {
      videoUrl: uploadResponse.url,
      videoId: projectId,
      size: videoBlob.size,
    };
  } catch (error: any) {
    console.error('Error downloading/uploading video:', error);
    throw new Error(error?.message || 'Error al procesar el video');
  }
}

// ----------------------------------------------------------------------

/**
 * Complete video generation flow with N8N + JSON2Video
 * Handles the full process: initiate -> poll -> download -> upload
 */
export async function GenerateProprietaryVideoService(
  request: IN8NVideoRequest,
  options?: {
    maxPollingAttempts?: number;
    pollingInterval?: number;
    onProgress?: (progress: IProprietaryVideoProgress) => void;
  }
): Promise<IProprietaryVideoResult> {
  const {
    maxPollingAttempts = 120, // 20 minutes max (120 * 10s)
    pollingInterval = 10000, // 10 seconds
    onProgress,
  } = options || {};

  try {
    // Step 1: Initiate video generation through N8N
    const n8nResponse = await InitiateProprietaryVideoService(request, onProgress);
    const { project_id: projectId } = n8nResponse;

    // Step 2: Immediately start polling JSON2Video for status
    onProgress?.({
      stage: 'polling',
      progress: 20,
      message: 'Esperando generación del video...',
      projectId,
    });

    let attempts = 0;
    let lastStatus = '';

    while (attempts < maxPollingAttempts) {
      // Wait before polling
      await new Promise(resolve => setTimeout(resolve, pollingInterval));
      attempts++;

      try {
        const statusResponse = await PollVideoStatusService(projectId);
        const status = statusResponse.movie?.status || 'pending';
        
        // Update progress based on status
        if (status !== lastStatus) {
          lastStatus = status;
          
          let progress = 20 + Math.min(attempts * 0.5, 40); // Increment progress slowly
          let message = 'Generando video...';

          switch (status) {
            case 'pending':
              message = 'Video en cola de procesamiento...';
              break;
            case 'processing':
              message = 'Renderizando video...';
              progress = Math.max(progress, 40);
              break;
            case 'done':
              message = 'Video generado, descargando...';
              progress = 65;
              break;
            case 'error':
              throw new Error(statusResponse.movie?.message || 'Error en la generación del video');
            default:
              message = `Estado desconocido: ${status}`;
          }

          onProgress?.({
            stage: status === 'done' ? 'downloading' : 'polling',
            progress,
            message,
            projectId,
          });
        }

        // Check if video is ready
        if (status === 'done' && statusResponse.movie?.url) {
          // Step 3: Download and upload the video
          const result = await DownloadAndUploadVideoService(
            statusResponse.movie.url,
            projectId,
            onProgress
          );

          return {
            ...result,
            duration: statusResponse.movie.duration,
          };
        }

        // Check for error
        if (status === 'error') {
          throw new Error(statusResponse.movie?.message || 'Error en la generación del video');
        }
      } catch (pollError: any) {
        // Continue polling on temporary errors
        console.warn(`[Proprietary Video] Poll error on attempt ${attempts}:`, pollError.message);
        
        // If it's a critical error, throw
        if (pollError.message.includes('Error en la generación')) {
          throw pollError;
        }
      }
    }

    // Timeout reached
    throw new Error('Tiempo de espera agotado. El video sigue en procesamiento.');
  } catch (error: any) {
    onProgress?.({
      stage: 'error',
      progress: 0,
      message: error.message || 'Error en la generación del video',
    });
    throw error;
  }
}

// ----------------------------------------------------------------------

/**
 * Generate video for course section using proprietary service
 */
export async function GenerateProprietaryCourseVideoService(
  courseTitle: string,
  section: { title: string; description?: string; video?: string },
  proprietaryOptions: {
    duration_scences: number;
    scences_number: number;
  },
  onProgress?: (progress: IProprietaryVideoProgress) => void
): Promise<IProprietaryVideoResult> {
  // Build the prompt from section data
  const prompt = section.video || 
    `Crear un video educativo profesional para la sección "${section.title}" del curso "${courseTitle}". ${section.description || ''}. El video debe ser visualmente atractivo y relevante al contenido educativo.`;

  return GenerateProprietaryVideoService(
    {
      user_prompt: prompt,
      duration_scences: proprietaryOptions.duration_scences,
      scences_number: proprietaryOptions.scences_number,
    },
    { onProgress }
  );
}
