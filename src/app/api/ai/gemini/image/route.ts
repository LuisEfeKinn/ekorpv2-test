import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    // IMPORTANTE: Imagen 3 (Nano Banana) NO está disponible en la API pública de Google AI.
    // Solo está disponible a través de Vertex AI en Google Cloud Platform.
    // 
    // La API pública (generativelanguage.googleapis.com) solo soporta:
    // - Modelos de texto/chat: gemini-pro, gemini-flash, etc.
    // - Comprensión de imágenes (multimodal): pueden LEER imágenes, no GENERARLAS
    //
    // Para usar Imagen 3 necesitas:
    // 1. Google Cloud Project con facturación habilitada
    // 2. Habilitar Vertex AI API
    // 3. Service Account con permisos
    // 4. Usar SDK @google-cloud/aiplatform
    // 5. Endpoint: {region}-aiplatform.googleapis.com
    //
    // Este endpoint devuelve 501 para hacer fallback automático a OpenAI DALL-E 3
    
    console.log('[Gemini Image] Imagen 3 no disponible en API pública - requiere Vertex AI');
    
    return NextResponse.json(
      { 
        error: 'Imagen 3 (Nano Banana) requires Vertex AI on Google Cloud Platform. Not available in public Gemini API. Using OpenAI DALL-E 3 instead.'
      },
      { status: 501 } // 501 Not Implemented - triggers automatic fallback to OpenAI
    );
  } catch (error: any) {
    console.error('Gemini image generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
