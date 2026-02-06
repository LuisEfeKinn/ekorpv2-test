import { paths } from 'src/routes/paths';

import axios from 'src/lib/axios';

import { JWT_STORAGE_KEY, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from './constant';

// ----------------------------------------------------------------------

export function jwtDecode(token: string) {
  try {
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length < 2) {
      throw new Error('Invalid token!');
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64));

    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export function isValidToken(accessToken: string) {
  if (!accessToken) {
    return false;
  }

  try {
    const decoded = jwtDecode(accessToken);

    if (!decoded) {
      return false;
    }

    // Si el token tiene campo 'exp', verificar que no haya expirado
    if ('exp' in decoded && typeof decoded.exp === 'number') {
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime;
    }

    // Si no tiene campo 'exp', asumir que es válido (el backend manejará la expiración)
    return true;
  } catch (error) {
    console.warn('Error validating token, assuming invalid:', error);
    return false;
  }
}

// ----------------------------------------------------------------------

export function tokenExpired(exp: number) {
  const currentTime = Date.now();
  const timeLeft = exp * 1000 - currentTime;

  setTimeout(() => {
    try {
      alert('Token expired!');
      sessionStorage.removeItem(JWT_STORAGE_KEY);
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
      window.location.href = paths.auth.jwt.signIn;
    } catch (error) {
      console.error('Error during token expiration:', error);
      throw error;
    }
  }, timeLeft);
}

// ----------------------------------------------------------------------

export async function setSession(accessToken: string | null) {
  try {
    if (accessToken) {
      // Guardar tanto con la clave antigua (compatibilidad) como con la nueva
      sessionStorage.setItem(JWT_STORAGE_KEY, accessToken);
      sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

      axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

      // Intentar decodificar el token, pero no fallar si no es posible
      try {
        const decodedToken = jwtDecode(accessToken);

        if (decodedToken && 'exp' in decodedToken && typeof decodedToken.exp === 'number') {
          tokenExpired(decodedToken.exp);
        } else {
          console.warn('Token does not have expiration field, skipping automatic expiration handling');
        }
      } catch (decodeError) {
        console.warn('Could not decode token, but proceeding with authentication:', decodeError);
        // No lanzar error aquí, simplemente continuar sin el manejo automático de expiración
      }
    } else {
      sessionStorage.removeItem(JWT_STORAGE_KEY);
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
      delete axios.defaults.headers.common.Authorization;
    }
  } catch (error) {
    console.error('Error during set session:', error);
    throw error;
  }
}
