import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

interface LivenessDetectionProps {
  documentId: string; // ID del documento desde la URL
  identityId?: string; // identityId obtenido del upload del documento
  onSuccess: () => void; // Ya no necesitamos pasar sessionId aquí
  onError?: (error: Error) => void;
}

export function LivenessDetection({ documentId, identityId, onSuccess, onError }: LivenessDetectionProps) {
  const { t } = useTranslate('common');
  
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Iniciar flujo de liveness (redirigir con identityId ya obtenido del documento)
  const handleStartLiveness = useCallback(async () => {
    setIsUploading(true);
    setError(null);

    try {
      // Validar que tenemos identityId
      if (!identityId) {
        throw new Error(t('resetBiometric.liveness.noIdentityId'));
      }

      toast.info(t('resetBiometric.liveness.preparing'));

      // Redirigir directamente a /liveness-check con el identityId ya obtenido
      const currentUrl = window.location.href;
      const livenessUrl = new URL('/liveness-check', window.location.origin);
      
      // Usar identityId obtenido del upload del documento
      livenessUrl.searchParams.set('identityId', String(identityId));
      livenessUrl.searchParams.set('documentId', documentId);
      livenessUrl.searchParams.set('returnUrl', currentUrl);
      
      toast.success(t('resetBiometric.liveness.redirecting'));
      
      // Redirigir
      window.location.href = livenessUrl.toString();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || t('resetBiometric.liveness.startError');
      setError(errorMessage);
      toast.error(errorMessage);
      
      if (onError && err instanceof Error) {
        onError(err);
      }
      
      setIsUploading(false);
    }
  }, [documentId, identityId, t, onError]);

  return (
    <Card
      sx={{
        p: 3,
        maxWidth: 600,
        mx: 'auto',
        textAlign: 'center',
      }}
    >
      <Typography variant="h5" sx={{ mb: 1 }}>
        {t('resetBiometric.liveness.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('resetBiometric.liveness.subtitle')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Ilustración de verificación facial */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          aspectRatio: '3/4',
          maxWidth: 400,
          mx: 'auto',
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: 'grey.100',
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <Iconify 
            icon="solar:camera-add-bold" 
            width={120} 
            sx={{ color: 'primary.main', mb: 2 }} 
          />
          <Typography variant="h6" color="text.secondary">
            {t('resetBiometric.liveness.faceDetection')}
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
            {t('resetBiometric.liveness.awsRekognition')}
          </Typography>
        </Box>
      </Box>

      {/* Botón para iniciar */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
        <Button
          variant="contained"
          size="large"
          color="primary"
          disabled={isUploading}
          startIcon={
            isUploading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <Iconify icon="solar:camera-add-bold" />
            )
          }
          onClick={handleStartLiveness}
        >
          {isUploading ? t('resetBiometric.liveness.preparing') : t('resetBiometric.liveness.startButton')}
        </Button>
      </Box>

      {/* Instrucciones */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              color: 'common.white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontWeight: 'bold',
              fontSize: '0.875rem',
            }}
          >
            1
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
            {t('resetBiometric.liveness.instruction1')}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              color: 'common.white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontWeight: 'bold',
              fontSize: '0.875rem',
            }}
          >
            2
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
            {t('resetBiometric.liveness.instruction2')}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              color: 'common.white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontWeight: 'bold',
              fontSize: '0.875rem',
            }}
          >
            3
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
            {t('resetBiometric.liveness.instruction3')}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              color: 'common.white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontWeight: 'bold',
              fontSize: '0.875rem',
            }}
          >
            4
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
            {t('resetBiometric.liveness.instruction4')}
          </Typography>
        </Box>
      </Box>

      {/* Nota sobre privacidad */}
      <Box
        sx={{
          p: 2,
          borderRadius: 1,
          bgcolor: (theme) => alpha(theme.palette.info.main, 0.08),
        }}
      >
        <Typography variant="caption" color="text.secondary">
          🔒 Tu privacidad es importante. La verificación facial se procesa en tiempo real y las imágenes se encriptan según AWS Rekognition.
        </Typography>
      </Box>

      {/* Nota técnica */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="caption">
          ℹ️ Esta verificación utiliza <strong>AWS Rekognition Face Liveness</strong> con detección de gestos en tiempo real para garantizar que eres una persona real.
        </Typography>
      </Alert>
    </Card>
  );
}