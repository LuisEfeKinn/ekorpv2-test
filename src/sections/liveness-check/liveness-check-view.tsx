'use client';

import '@aws-amplify/ui-react/styles.css';

import { Amplify } from 'aws-amplify';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ThemeProvider } from '@aws-amplify/ui-react';
import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { LivenessSessionService } from 'src/services/auth/biometricRegister.service';

import { LIVENESS_ES } from './liveness-es';

// ----------------------------------------------------------------------

Amplify.configure({
  Auth: {
    Cognito: {
      allowGuestAccess: true, // ← CRÍTICO: Permite acceso sin autenticación
      userPoolId: process.env.NEXT_PUBLIC_AWS_AMPLIFY_USER_POOL_ID || '',
      userPoolClientId: process.env.NEXT_PUBLIC_AWS_AMPLIFY_USER_POOL_CLIENT_ID || '',
      identityPoolId: process.env.NEXT_PUBLIC_AWS_AMPLIFY_IDENTITY_POOL_ID || '',
    },
  },
});

// ----------------------------------------------------------------------

export function LivenessCheckView() {
  const { t } = useTranslate('common');
  const searchParams = useSearchParams();

  const documentId = searchParams.get('documentId');
  const identityId = searchParams.get('identityId');
  const biometricValidationId = searchParams.get('biometricValidationId');
  const returnUrl = searchParams.get('returnUrl');

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionCreatedAt, setSessionCreatedAt] = useState<Date | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Crear sesión de liveness al montar
  useEffect(() => {
    const createSession = async () => {
      if (!identityId && !biometricValidationId && !documentId) {
        setError(t('livenessCheck.errors.noIdentifier'));
        setIsCreatingSession(false);
        return;
      }

      try {
        let sessionResponse;

        try {
          const idToUse = identityId || biometricValidationId || documentId!;
          sessionResponse = await LivenessSessionService(idToUse);
        } catch (err: any) {
          if ((identityId || biometricValidationId) && documentId) {
            sessionResponse = await LivenessSessionService(documentId);
          } else {
            throw err;
          }
        }

        if (sessionResponse?.data?.statusCode === 201 && sessionResponse.data?.data?.sessionId) {
          const newSessionId = sessionResponse.data.data.sessionId;
          const createdAt = new Date();
          setSessionId(newSessionId);
          setSessionCreatedAt(createdAt);
          setIsCreatingSession(false);
        } else {
          throw new Error(t('livenessCheck.errors.unexpectedResponse'));
        }
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || err.message || t('livenessCheck.errors.sessionCreation');
        setError(`${errorMsg} ${t('livenessCheck.errors.checkConsole')}`);
        setIsCreatingSession(false);
      }
    };

    createSession();
  }, [identityId, biometricValidationId, documentId, t]);

  // Recrear sesión
  const handleRecreateSession = async () => {
    setError(null);
    setIsCreatingSession(true);
    setSessionId(null);

    try {
      const idToUse = identityId || biometricValidationId || documentId!;
      const sessionResponse = await LivenessSessionService(idToUse);

      if (sessionResponse?.data?.statusCode === 201 && sessionResponse.data?.data?.sessionId) {
        const newSessionId = sessionResponse.data.data.sessionId;
        const createdAt = new Date();
        setSessionId(newSessionId);
        setSessionCreatedAt(createdAt);
        setError(null);
      } else {
        throw new Error(t('livenessCheck.errors.recreateSession'));
      }
    } catch (err: any) {
      setError(t('livenessCheck.errors.recreateSessionFailed'));
      console.error('Error recreating liveness session:', err);
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Manejar resultado del FaceLivenessDetector
  const handleAnalysisComplete = async () => {
    if (returnUrl && sessionId) {
      const url = new URL(returnUrl, window.location.origin);
      url.searchParams.set('livenessSessionId', sessionId);
      url.searchParams.set('livenessStatus', 'success');

      await new Promise(resolve => setTimeout(resolve, 1000));
      window.location.href = url.toString();
    } else {
      setError(t('livenessCheck.errors.noReturnUrl'));
    }
  };

  const handleError = async (err: any) => {
    const errorMessage = err?.error?.message || err?.message || '';
    const isSessionExpired = errorMessage.includes('session has expired') ||
      errorMessage.includes('session expired') ||
      err?.error?.name === 'ValidationException';

    if (isSessionExpired) {
      setError(t('livenessCheck.errors.sessionExpiredRecreating'));
      await handleRecreateSession();
      return;
    }

    const errorMsg = err?.error?.message || err?.message || err?.toString() || t('livenessCheck.errors.unknown');
    setError(`${t('livenessCheck.errors.awsError')}: ${errorMsg}`);
  };

  const handleCancel = () => {
    if (returnUrl) {
      const url = new URL(returnUrl, window.location.origin);
      url.searchParams.set('livenessStatus', 'error');
      url.searchParams.set('livenessError', error || t('livenessCheck.errors.cancelled'));
      window.location.href = url.toString();
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      <Card
        sx={{
          p: 3,
          maxWidth: 800,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" sx={{ mb: 2 }}>
          {t('livenessCheck.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          {t('livenessCheck.subtitle')}
        </Typography>

        {error && (
          <Alert
            severity={error.includes(t('livenessCheck.errors.sessionExpiredRecreating')) ? 'info' : 'error'}
            sx={{ mb: 3 }}
          >
            <Typography variant="body2" sx={{ mb: 2 }}>
              {error}
            </Typography>
            {returnUrl && !error.includes(t('livenessCheck.errors.sessionExpiredRecreating')) && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  onClick={handleRecreateSession}
                  sx={{ mt: 1 }}
                >
                  {t('livenessCheck.actions.recreateSession')}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={handleCancel}
                  sx={{ mt: 1 }}
                >
                  {t('livenessCheck.actions.cancel')}
                </Button>
              </Box>
            )}
          </Alert>
        )}

        {isCreatingSession && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={60} />
            <Typography variant="body2" color="text.secondary">
              {t('livenessCheck.loading.preparing')}
            </Typography>
          </Box>
        )}

        {!isCreatingSession && sessionId && (
          <>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                {t('livenessCheck.sessionInfo.id')}: {sessionId.substring(0, 20)}... ({t('livenessCheck.sessionInfo.length')}: {sessionId.length})
              </Typography>
              {sessionCreatedAt && (
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                  ⏱️ {t('livenessCheck.sessionInfo.created')}: {sessionCreatedAt.toLocaleTimeString()} • {t('livenessCheck.sessionInfo.expires')}
                </Typography>
              )}
            </Alert>
            <ThemeProvider>
              <FaceLivenessDetector
                sessionId={sessionId}
                region={process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'}
                onAnalysisComplete={handleAnalysisComplete}
                onError={handleError}
                displayText={LIVENESS_ES}
              />
            </ThemeProvider>
          </>
        )}

        {!isCreatingSession && !sessionId && !error && (
          <Alert severity="info">
            {t('livenessCheck.loading.preparing')}
          </Alert>
        )}
      </Card>
    </Box>
  );
}
