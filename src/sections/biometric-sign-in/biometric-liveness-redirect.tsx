'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';

// ----------------------------------------------------------------------

interface BiometricLivenessRedirectProps {
  documentId: string;
}

export function BiometricLivenessRedirect({ documentId }: BiometricLivenessRedirectProps) {
  const router = useRouter();
  const { t } = useTranslate('common');

  useEffect(() => {
    // Construir la URL de retorno después del liveness check
    const returnUrl = `${window.location.origin}${paths.auth.jwt.biometricSignIn(documentId)}`;

    // Construir la URL del liveness check con parámetros
    const livenessCheckUrl = new URL('/liveness-check', window.location.origin);
    livenessCheckUrl.searchParams.set('documentId', documentId);
    livenessCheckUrl.searchParams.set('returnUrl', returnUrl);

    // Pequeño delay para mejor UX
    const timer = setTimeout(() => {
      window.location.href = livenessCheckUrl.toString();
    }, 1500);

    return () => clearTimeout(timer);
  }, [documentId, router]);

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
      <Card
        sx={{
          p: 5,
          maxWidth: 500,
          mx: 'auto',
          textAlign: 'center',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <CircularProgress size={60} />
        </Box>

        <Typography variant="h5" sx={{ mb: 2 }}>
          {t('biometricLogin.preparingLivenessCheck')}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          {t('biometricLogin.redirectingToLiveness')}
        </Typography>
      </Card>
    </Box>
  );
}
