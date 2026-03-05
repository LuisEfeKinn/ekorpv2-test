import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

export interface RecaptchaVerificationResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

// ----------------------------------------------------------------------

/**
 * Función para verificar el token de reCAPTCHA en el servidor
 * Esta función debe ser llamada desde una API route o función de servidor
 * NO debe ser usada en el cliente ya que expone la clave secreta
 */
export async function verifyRecaptchaToken(token: string): Promise<RecaptchaVerificationResponse> {
  if (!CONFIG.recaptcha.secretKey) {
    throw new Error('reCAPTCHA secret key is not configured');
  }

  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      secret: CONFIG.recaptcha.secretKey,
      response: token,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: RecaptchaVerificationResponse = await response.json();
  return data;
}

/**
 * Hook para validar reCAPTCHA (solo para uso en API routes o funciones de servidor)
 */
export const useRecaptchaVerification = () => {
  const verify = async (token: string): Promise<boolean> => {
    try {
      const result = await verifyRecaptchaToken(token);
      return result.success;
    } catch (error) {
      console.error('reCAPTCHA verification failed:', error);
      return false;
    }
  };

  return { verify };
};