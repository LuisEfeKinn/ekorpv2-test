'use client';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Fade from '@mui/material/Fade';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import { alpha } from '@mui/material/styles';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import AlertTitle from '@mui/material/AlertTitle';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';

import { Logo } from 'src/components/logo';
import { Iconify } from 'src/components/iconify';

import { FacialCapture } from '../facial-capture';
import { DocumentCapture } from '../document-capture';
import { PersonalInfoForm } from '../personal-info-form';
import { LivenessDetection } from '../liveness-detection-redirect';
import { useRegisterSteps, RegistrationStepper } from '../registration-stepper';

// ----------------------------------------------------------------------

type DocumentSide = 'front' | 'back' | 'complete';

type Props = {
  id: string;
};

export function ResetBiometricUserView({ id }: Props) {
  const router = useRouter();
  const { t } = useTranslate('common');
  const registerSteps = useRegisterSteps();
  const [activeStep, setActiveStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [capturedIdentityId, setCapturedIdentityId] = useState<string | undefined>(undefined);
  const [biometricValidationId, setBiometricValidationId] = useState<string>('');

  // Detectar parámetros de URL al montar para ir directamente al paso de facial-capture
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const livenessSessionId = params.get('livenessSessionId');
    const livenessStatus = params.get('livenessStatus');

    // Si volvemos del liveness-check con éxito, ir directamente al paso 4 (facial-capture)
    if (livenessSessionId && livenessStatus === 'success') {
      setActiveStep(4);
      
      // NO limpiar la URL aquí - dejar que facial-capture la lea primero
      // La limpieza se hará dentro del componente facial-capture después de leer los parámetros
    }
  }, []);

  // Manejar captura de documento
  const handleDocumentCapture = useCallback((imageData: string, side: DocumentSide, identityId?: string) => {
    // Guardar identityId cuando se captura (generalmente del reverso o de carga manual)
    if (identityId) {
      setCapturedIdentityId(identityId);
    }

    if (side === 'complete') {
      // Modo carga manual completa - saltar directo a liveness (paso 2)
      setActiveStep(2);
    } else if (side === 'front') {
      setActiveStep(1); // Pasar al reverso
    } else {
      setActiveStep(2); // Pasar a liveness
    }
  }, []);

  // Manejar liveness redirect exitoso (paso 3 -> paso 4)
  const handleLivenessSuccess = useCallback(() => {
    // Ya no hacemos nada aquí, el redirect maneja todo
    // El useEffect detectará los parámetros y pondrá activeStep = 4
  }, []);

  // Manejar facial capture exitoso (paso 4 -> paso 5)
  const handleFacialCaptureSuccess = useCallback((receivedBiometricValidationId: string) => {
    setBiometricValidationId(receivedBiometricValidationId);
    setActiveStep(5); // Pasar al formulario (ahora es paso 5)
  }, []);

  // Manejar envío del formulario final
  const handleFormSubmit = useCallback(async () => {
    // Mostrar mensaje de éxito
    setShowSuccess(true);

    // Redirigir al login después de 3 segundos
    setTimeout(() => {
      router.push(paths.auth.jwt.signIn);
    }, 3000);
  }, [router]);

  // Renderizar contenido según el paso activo
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Fade in key="step-0">
            <div>
              <DocumentCapture
                side="front"
                documentId={id}
                onCapture={handleDocumentCapture}
                allowManualUpload // ⭐ Habilitar carga manual en el primer paso
              />
            </div>
          </Fade>
        );

      case 1:
        return (
          <Fade in key="step-1">
            <div>
              <DocumentCapture
                side="back"
                documentId={id}
                onCapture={handleDocumentCapture}
              />
            </div>
          </Fade>
        );

      case 2:
        return (
          <Fade in key="step-2">
            <div>
              <LivenessDetection
                documentId={id}
                identityId={capturedIdentityId}
                onSuccess={handleLivenessSuccess}
                onError={(e) => {
                  console.error('Liveness detection error:', e);
                }}
              />
            </div>
          </Fade>
        );

      case 3:
        // Paso 3 se salta porque el liveness redirige externamente
        // El useEffect detecta el retorno y salta directo al paso 4
        return null;

      case 4:
        return (
          <Fade in key="step-4">
            <div>
              <FacialCapture
                documentId={id}
                onSuccess={handleFacialCaptureSuccess}
                onError={(e) => {
                  console.error('Facial capture error:', e);
                }}
              />
            </div>
          </Fade>
        );

      case 5:
        return (
          <Fade in key="step-5">
            <div>
              <PersonalInfoForm
                documentId={id}
                biometricValidationId={biometricValidationId}
                onSuccess={handleFormSubmit}
              />
            </div>
          </Fade>
        );

      default:
        return null;
    }
  };

  // Mensaje de éxito
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
          <Card
            sx={{
              p: 5,
              textAlign: 'center',
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
              {t('register.successTitle')}
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {t('register.successMessage')}
            </Typography>

            <Alert severity="info">
              <AlertTitle>{t('register.successAlertTitle')}</AlertTitle>
              {t('register.successAlertMessage')}
            </Alert>
          </Card>
        </Container>
      </Box>
    );
  }

  // Vista principal del registro
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
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          sx={{ mb: 4 }}
        >
          <Logo sx={{ width: 80, height: 'auto' }} />
        </Stack>

        {/* Título */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" sx={{ mb: 1 }}>
            {t('register.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('register.subtitle')}
          </Typography>
        </Box>

        {/* Stepper */}
        <RegistrationStepper
          activeStep={activeStep}
          steps={registerSteps}
        />

        {/* Contenido del paso actual */}
        <Box sx={{ mt: 4 }}>
          {renderStepContent()}
        </Box>

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
            {t('register.alreadyHaveAccount')}{' '}
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
              {t('register.signInHere')}
            </Box>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
