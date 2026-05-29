'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import { alpha } from '@mui/material/styles';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';

import { Logo } from 'src/components/logo';
import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

import { BiometricFacialCapture } from '../biometric-facial-capture';

// ----------------------------------------------------------------------

type Props = {
  id?: string; // ID del documento desde la ruta
};

export function BiometricSignInView({ id }: Props) {
  const { t } = useTranslate('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkUserSession } = useAuthContext();

  const documentId = id || '';
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Capturar parámetros de liveness check
  const livenessSessionId = searchParams.get('livenessSessionId');
  const livenessStatus = searchParams.get('livenessStatus');

  // Limpiar URL después de capturar parámetros
  useEffect(() => {
    if (livenessSessionId && livenessStatus) {
      // Limpiar URL pero mantener el estado
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [livenessSessionId, livenessStatus]);

  // Manejar login exitoso
  const handleLoginSuccess = useCallback(async (accessToken: string, refreshToken: string) => {
    try {
      // Guardar tokens en sessionStorage (igual que el login normal)
      sessionStorage.setItem('accessToken', accessToken);
      sessionStorage.setItem('refreshToken', refreshToken);

      // Configurar la sesión con el token de acceso
      // Esto actualiza el header de axios con el token
      const { setSession } = await import('src/auth/context/jwt/utils');
      await setSession(accessToken);

      // Verificar la sesión del usuario (carga los datos del usuario)
      await checkUserSession?.();

      // Mostrar mensaje de éxito
      setShowSuccess(true);

      // Redirigir al dashboard después de 2 segundos
      setTimeout(() => {
        router.push(paths.dashboard.root);
        router.refresh();
      }, 2000);
    } catch (err) {
      console.error('Error during biometric login session setup:', err);
      setError(t('biometricLogin.sessionSetupError'));
    }
  }, [checkUserSession, router, t]);

  // Manejar error
  const handleLoginError = useCallback((err: Error) => {
    console.error('Biometric login error:', err);
    setError(err.message || t('biometricLogin.authenticationError'));
  }, [t]);

  // Validar que tengamos el documentId
  if (!documentId) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Container maxWidth="sm">
          <Box
            sx={{
              textAlign: 'center',
              p: 3,
            }}
          >
            <Iconify
              icon="solar:danger-triangle-bold"
              width={64}
              sx={{ color: 'error.main', mb: 2 }}
            />
            <Typography variant="h5" sx={{ mb: 2 }}>
              {t('biometricLogin.noDocumentId')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('biometricLogin.noDocumentIdDescription')}
            </Typography>
            <Link component={RouterLink} href={paths.auth.jwt.signIn} variant="button">
              {t('biometricLogin.backToLogin')}
            </Link>
          </Box>
        </Container>
      </Box>
    );
  }

  // Pantalla de éxito
  if (showSuccess) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: (theme) => alpha(theme.palette.background.default, 0.8),
        }}
      >
        <Container maxWidth="sm">
          <Box
            sx={{
              p: 5,
              textAlign: 'center',
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: (theme) => theme.customShadows.card,
            }}
          >
            <Box
              sx={{
                width: 120,
                height: 120,
                mx: 'auto',
                mb: 3,
                borderRadius: '50%',
                bgcolor: (theme) => alpha(theme.palette.success.main, 0.08),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Iconify
                icon="solar:check-circle-bold"
                width={80}
                sx={{ color: 'success.main' }}
              />
            </Box>

            <Typography variant="h4" sx={{ mb: 2 }}>
              {t('biometricLogin.successTitle')}
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {t('biometricLogin.successMessage')}
            </Typography>

            <Alert severity="success">
              {t('biometricLogin.redirecting')}
            </Alert>
          </Box>
        </Container>
      </Box>
    );
  }

  // Pantalla principal con captura facial
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        py: 5,
        px: 2,
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="lg">
        {/* Header con Logo */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 4,
          }}
        >
          <Logo sx={{ width: 80, height: 'auto' }} />
        </Box>

        {/* Error global */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
            {error}
          </Alert>
        )}

        {/* Componente de captura facial */}
        <BiometricFacialCapture
          documentId={documentId}
          livenessSessionId={livenessSessionId || undefined}
          livenessStatus={livenessStatus || undefined}
          onSuccess={handleLoginSuccess}
          onError={handleLoginError}
        />

        {/* Footer informativo */}
        <Box
          sx={{
            mt: 6,
            pt: 3,
            borderTop: (theme) => `1px dashed ${theme.palette.divider}`,
            textAlign: 'center',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {t('biometricLogin.backToNormalLogin')}{' '}
            <Box
              component="a"
              href={paths.auth.jwt.signIn}
              sx={{
                color: 'primary.main',
                textDecoration: 'underline',
                cursor: 'pointer',
                '&:hover': {
                  color: 'primary.dark',
                },
              }}
            >
              {t('biometricLogin.clickHere')}
            </Box>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
