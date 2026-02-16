import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import {
  BiometricSignInService,
  LivenessValidationService,
} from 'src/services/auth/biometricRegister.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

interface BiometricFacialCaptureProps {
  documentId: string; // ID del documento desde la URL
  livenessSessionId?: string; // ID de sesión de liveness desde la URL
  livenessStatus?: string; // Estado del liveness desde la URL
  onSuccess: (accessToken: string, refreshToken: string) => void; // Callback cuando el login sea exitoso
  onError?: (error: Error) => void;
}

export function BiometricFacialCapture({ 
  documentId, 
  livenessSessionId,
  livenessStatus,
  onSuccess, 
  onError 
}: BiometricFacialCaptureProps) {
  const { t } = useTranslate('common');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidatingLiveness, setIsValidatingLiveness] = useState(false);
  const [isLivenessValidated, setIsLivenessValidated] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [detectionScore, setDetectionScore] = useState<number>(0);
  const [lostDetectionCount, setLostDetectionCount] = useState<number>(0);

  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCameraOperationInProgress = useRef<boolean>(false);
  const hasProcessedLiveness = useRef<boolean>(false);

  // Validar liveness check al montar (si viene de liveness-check)
  useEffect(() => {
    const validateLiveness = async () => {
      // Si ya procesamos antes, no hacer nada
      if (hasProcessedLiveness.current) {
        return;
      }

      // Si NO hay parámetros de liveness, redirigir a liveness-check
      if (!livenessSessionId || !livenessStatus) {
        hasProcessedLiveness.current = true;
        
        // Redirigir al liveness check
        const returnUrl = `${window.location.origin}${paths.auth.jwt.biometricSignIn(documentId)}`;
        const livenessCheckUrl = new URL('/liveness-check', window.location.origin);
        livenessCheckUrl.searchParams.set('documentId', documentId);
        livenessCheckUrl.searchParams.set('returnUrl', returnUrl);
        
        // Pequeño delay para mostrar mensaje
        toast.info(t('biometricLogin.redirectingToLiveness'));
        setTimeout(() => {
          window.location.href = livenessCheckUrl.toString();
        }, 1500);
        return;
      }

      // Si llegamos aquí, tenemos los parámetros de liveness
      hasProcessedLiveness.current = true;
      setIsValidatingLiveness(true);

      try {
        toast.info(t('facialCapture.validatingLiveness'));

        // Validar sesión de liveness con AWS
        const validationResponse = await LivenessValidationService(livenessSessionId);
        const validationData = validationResponse.data;

        // Buscar el atributo 'live' en múltiples ubicaciones posibles
        const isLive = 
          validationData?.live ?? 
          validationData?.data?.live ?? 
          validationData?.details?.live ??
          validationData?.result?.live ??
          false;

        if (!isLive) {
          console.error('❌ [BIOMETRIC-LOGIN] Persona NO detectada como viva');
          toast.error(t('facialCapture.notLiveDetected'));
          
          // Redirigir nuevamente a liveness check para reintentar
          setTimeout(() => {
            const returnUrl = `${window.location.origin}${paths.auth.jwt.biometricSignIn(documentId)}`;
            const livenessCheckUrl = new URL('/liveness-check', window.location.origin);
            livenessCheckUrl.searchParams.set('documentId', documentId);
            livenessCheckUrl.searchParams.set('returnUrl', returnUrl);
            window.location.href = livenessCheckUrl.toString();
          }, 2000);
          return;
        }

        // Si es una persona viva, continuar con el flujo
        toast.success(t('facialCapture.livenessValidated'));
        setIsLivenessValidated(true);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || t('facialCapture.livenessValidationError');
        setError(errorMessage);
        toast.error(errorMessage);
        
        if (onError && err instanceof Error) {
          onError(err);
        }
      } finally {
        setIsValidatingLiveness(false);
      }
    };

    validateLiveness();
  }, [documentId, livenessSessionId, livenessStatus, t, onError]);

  // Iniciar cámara
  const startCamera = useCallback(async () => {
    // Prevenir múltiples llamadas simultáneas
    if (isCameraOperationInProgress.current) {
      return;
    }

    isCameraOperationInProgress.current = true;

    try {
      setError(null);

      // Delay inicial para asegurar que cualquier componente anterior haya liberado la cámara
      await new Promise(resolve => setTimeout(resolve, 800));

      // Si ya hay un stream activo en ESTE componente, detenerlo primero
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      setIsCameraActive(true);

      // Intentar primero con configuración ideal
      let stream: MediaStream | null = null;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user', // Cámara frontal para rostro
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
      } catch {
        // Pequeño delay antes de reintentar (ayuda en móviles)
        await new Promise(resolve => setTimeout(resolve, 200));

        // Si falla, intentar con configuración más simple (mejor compatibilidad móvil)
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
          },
        });
      }

      if (!stream) {
        throw new Error('No se pudo obtener stream de video');
      }

      streamRef.current = stream;

      // Delay para asegurar que el stream esté listo
      await new Promise(resolve => setTimeout(resolve, 150));

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      // Mensaje más específico según el error
      let errorMessage = 'No se pudo acceder a la cámara.';
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Permiso de cámara denegado. Por favor, permite el acceso a la cámara.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No se encontró ninguna cámara en tu dispositivo.';
        } else if (err.name === 'NotReadableError' || err.name === 'AbortError') {
          errorMessage = 'La cámara está siendo usada por otra aplicación. Ciérrala e intenta nuevamente.';
        }
      }

      setError(errorMessage + ' Espera unos segundos e intenta de nuevo.');
      setIsCameraActive(false);
    } finally {
      // Siempre liberar el flag, incluso si hay error
      isCameraOperationInProgress.current = false;
    }
  }, []);

  // Detener cámara
  const stopCamera = useCallback(() => {
    // Limpiar intervalos primero
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    // Detener todos los tracks del stream INMEDIATAMENTE
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();

      tracks.forEach((track) => {
        if (track.readyState === 'live') {
          track.stop();
        }
      });

      streamRef.current = null;
    }

    // Limpiar video element completamente
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
      videoRef.current.src = '';
      // Forzar liberación del video en móviles
      videoRef.current.load();
    }

    setIsCameraActive(false);
    setCountdown(null);
    setIsFaceDetected(false);
  }, []);

  // Detectar rostro en el óvalo usando análisis básico
  const detectFace = useCallback(() => {
    if (!isCameraActive || capturedImage || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    try {
      const analysisWidth = 640;
      const analysisHeight = 480;
      canvas.width = analysisWidth;
      canvas.height = analysisHeight;

      context.drawImage(video, 0, 0, analysisWidth, analysisHeight);
      const imageData = context.getImageData(0, 0, analysisWidth, analysisHeight);
      const data = imageData.data;

      // Área ovalada del rostro (centro de la imagen)
      const centerX = analysisWidth / 2;
      const centerY = analysisHeight / 2;
      const ovalWidth = analysisWidth * 0.35;
      const ovalHeight = analysisHeight * 0.50;

      let totalPixels = 0;
      let skinTonePixels = 0;
      let brightPixels = 0;

      // Analizar píxeles dentro del óvalo
      for (let y = Math.floor(centerY - ovalHeight); y < Math.floor(centerY + ovalHeight); y++) {
        for (let x = Math.floor(centerX - ovalWidth); x < Math.floor(centerX + ovalWidth); x++) {
          // Verificar si está dentro del óvalo
          const normalizedX = (x - centerX) / ovalWidth;
          const normalizedY = (y - centerY) / ovalHeight;
          if (normalizedX * normalizedX + normalizedY * normalizedY > 1) continue;

          const idx = (y * analysisWidth + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          totalPixels++;

          // Detectar tonos de piel (rangos aproximados)
          const isSkinTone = (
            r > 95 && g > 40 && b > 20 &&
            r > g && r > b &&
            Math.abs(r - g) > 15 &&
            Math.max(r, g, b) - Math.min(r, g, b) > 15
          );

          if (isSkinTone) skinTonePixels++;

          // Brillo para detectar rostro
          const brightness = (r + g + b) / 3;
          if (brightness > 80 && brightness < 220) brightPixels++;
        }
      }

      const skinPercentage = (skinTonePixels / totalPixels) * 100;
      const brightPercentage = (brightPixels / totalPixels) * 100;

      // Sistema de puntuación
      let score = 0;

      // Criterio 1: Tono de piel (0-40 puntos)
      if (skinPercentage > 25) score += 40;
      else if (skinPercentage > 15) score += 30;
      else if (skinPercentage > 10) score += 20;
      else if (skinPercentage > 5) score += 10;

      // Criterio 2: Brillo adecuado (0-30 puntos)
      if (brightPercentage > 60 && brightPercentage < 95) score += 30;
      else if (brightPercentage > 50) score += 20;
      else if (brightPercentage > 40) score += 10;

      // Criterio 3: Presencia en el centro (0-30 puntos)
      const centerPixels = totalPixels > 0 ? (totalPixels / (ovalWidth * ovalHeight * Math.PI)) * 100 : 0;
      if (centerPixels > 70) score += 30;
      else if (centerPixels > 50) score += 20;
      else if (centerPixels > 30) score += 10;

      const finalScore = Math.min(100, score);

      setDetectionScore(Math.round(finalScore));

      // Umbral: 50% inicial, 45% durante countdown (más estricto)
      const requiredScore = countdown !== null ? 45 : 50;
      const hasFace = finalScore > requiredScore;

      setIsFaceDetected(hasFace);

      if (hasFace && countdown === null) {
        // Iniciar countdown con 5 segundos (más tiempo para prepararse)
        setCountdown(5);
        setLostDetectionCount(0);
      } else if (!hasFace && countdown !== null) {
        const newCount = lostDetectionCount + 1;
        setLostDetectionCount(newCount);

        // Permitir solo 1 pérdida antes de cancelar (más estricto)
        if (newCount >= 1) {
          setCountdown(null);
          setLostDetectionCount(0);
        }
      } else if (hasFace && countdown !== null) {
        setLostDetectionCount(0);
      }
    } catch (err) {
      console.error('Error during face detection:', err);
    }
  }, [isCameraActive, capturedImage, countdown, lostDetectionCount]);

  // Capturar foto del rostro (recortada con el MISMO aspect ratio que la preview)
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Dimensiones del video original (alta resolución)
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // Aspect ratio de la preview (definido en el componente: aspectRatio: '3/4')
    const previewAspectRatio = 3 / 4; // 0.75
    const videoAspectRatio = videoWidth / videoHeight;

    // Calcular el área visible real del video que se muestra en la preview
    // (El video se muestra con objectFit: 'cover', así que se recorta automáticamente)
    let visibleWidth: number;
    let visibleHeight: number;
    let offsetX: number;
    let offsetY: number;

    if (videoAspectRatio > previewAspectRatio) {
      // Video más ancho que preview -> se recortan los lados
      visibleHeight = videoHeight;
      visibleWidth = videoHeight * previewAspectRatio;
      offsetX = (videoWidth - visibleWidth) / 2;
      offsetY = 0;
    } else {
      // Video más alto que preview -> se recortan arriba/abajo
      visibleWidth = videoWidth;
      visibleHeight = videoWidth / previewAspectRatio;
      offsetX = 0;
      offsetY = (videoHeight - visibleHeight) / 2;
    }

    // Configurar canvas con el tamaño del área visible completa
    canvas.width = visibleWidth;
    canvas.height = visibleHeight;

    // Dibujar TODA el área visible del video (sin recortes)
    context.drawImage(
      video,
      offsetX, offsetY, visibleWidth, visibleHeight,
      0, 0, visibleWidth, visibleHeight
    );

    // Obtener la imagen como base64 con calidad alta
    const imageData = canvas.toDataURL('image/jpeg', 0.95);

    // Detener cámara INMEDIATAMENTE antes de guardar la imagen
    stopCamera();

    // Pequeño delay para asegurar que stopCamera terminó
    await new Promise(resolve => setTimeout(resolve, 100));

    setCapturedImage(imageData);
  }, [stopCamera]);

  // Auto-iniciar cámara solo después de validar liveness
  useEffect(() => {
    // Solo iniciar cámara si la validación de liveness fue exitosa
    if (isLivenessValidated) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isLivenessValidated, startCamera, stopCamera]);

  // Iniciar detección cuando la cámara esté activa
  useEffect(() => {
    if (!isCameraActive || capturedImage) return undefined;

    const interval = setInterval(detectFace, countdown !== null ? 400 : 200);
    detectionIntervalRef.current = interval;

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    };
  }, [isCameraActive, capturedImage, detectFace, countdown]);

  // Manejar countdown
  useEffect(() => {
    if (countdown === null) return undefined;

    if (countdown === 0) {
      capturePhoto();
      setCountdown(null);
      return undefined;
    }

    const timeout = setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, [countdown, capturePhoto]);

  // Procesar login biométrico
  const handleBiometricLogin = useCallback(async () => {
    if (!capturedImage) {
      toast.error(t('biometricLogin.noCapturedImage'));
      return;
    }

    setIsProcessing(true);

    try {
      toast.info(t('biometricLogin.authenticating'));

      // Convertir base64 a File
      const blob = await fetch(capturedImage).then((res) => res.blob());
      const file = new File([blob], 'biometric-selfie.jpg', { type: 'image/jpeg' });

      // Crear FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentId', documentId);
      formData.append('validationType', 'selfie');

      // Llamar al servicio de login biométrico
      const loginResponse = await BiometricSignInService(formData);

      // Extraer tokens de la respuesta (están dentro de data)
      const { accessToken, refreshToken } = loginResponse.data?.data || {};

      if (!accessToken || !refreshToken) {
        throw new Error(t('biometricLogin.noTokensReceived'));
      }

      toast.success(t('biometricLogin.authenticationSuccess'));
      
      // Llamar al callback con los tokens
      onSuccess(accessToken, refreshToken);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || t('biometricLogin.authenticationError');
      setError(errorMessage);
      toast.error(errorMessage);
      
      if (onError && err instanceof Error) {
        onError(err);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [capturedImage, documentId, t, onSuccess, onError]);

  // Reintentar captura
  const handleRetry = useCallback(async () => {
    setCapturedImage(null);
    setError(null);

    // Marcar operación en progreso
    isCameraOperationInProgress.current = true;

    // Detener cámara primero
    stopCamera();

    // Delay para móviles
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Liberar flag antes de iniciar
    isCameraOperationInProgress.current = false;

    // Iniciar cámara
    startCamera();
  }, [startCamera, stopCamera]);

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
        {t('biometricLogin.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('biometricLogin.subtitle')}
      </Typography>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loader de validación de liveness */}
      {isValidatingLiveness && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mb: 3 }}>
          <CircularProgress size={60} />
          <Typography variant="body1" color="text.secondary">
            {t('facialCapture.validatingLiveness')}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            {t('facialCapture.validatingLivenessSubtitle')}
          </Typography>
        </Box>
      )}

      {/* Área de cámara con detección */}
      {!isValidatingLiveness && (
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          aspectRatio: '3/4',
          maxWidth: 400,
          mx: 'auto',
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: 'grey.900',
          mb: 3,
        }}
      >
        {!capturedImage ? (
          <>
            {/* Video de cámara */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />

            {/* Canvas oculto para análisis */}
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute',
                top: -9999,
                left: -9999,
                visibility: 'hidden',
              }}
            />

            {/* Óvalo guía con borde que cambia según detección */}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '70%',
                height: '60%',
                borderRadius: '50%',
                border: '4px solid',
                borderColor: isFaceDetected ? 'success.main' : 'primary.main',
                boxShadow: (theme) => `0 0 0 9999px ${alpha(theme.palette.common.black, 0.6)}`,
                transition: 'border-color 0.3s ease',
                pointerEvents: 'none',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '90%',
                  height: '90%',
                  borderRadius: '50%',
                  border: '2px dashed',
                  borderColor: 'inherit',
                  opacity: 0.5,
                },
              }}
            />

            {/* Countdown */}
            {countdown !== null && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10,
                }}
              >
                <CircularProgress
                  variant="determinate"
                  value={(countdown / 5) * 100}
                  size={80}
                  thickness={4}
                  sx={{
                    color: 'success.main',
                    filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.5))',
                  }}
                />
                <Typography
                  variant="h2"
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: 'common.white',
                    fontWeight: 'bold',
                    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                  }}
                >
                  {countdown}
                </Typography>
              </Box>
            )}

            {/* Indicador de detección */}
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                bgcolor: (theme) => alpha(theme.palette.common.black, 0.8),
                color: 'common.white',
                px: 2,
                py: 1,
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: detectionScore > 45 ? 'success.main' : detectionScore > 30 ? 'warning.main' : 'error.main',
                }}
              />
              <Typography variant="caption" fontWeight="medium">
                {detectionScore}%
              </Typography>
            </Box>

            {/* Instrucción flotante */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                bgcolor: (theme) => alpha(theme.palette.common.black, 0.8),
                color: 'common.white',
                px: 3,
                py: 1.5,
                borderRadius: 2,
                maxWidth: '90%',
                textAlign: 'center',
              }}
            >
              <Typography variant="body2" fontWeight="medium">
                {countdown !== null
                  ? t('biometricLogin.perfect')
                  : isFaceDetected
                    ? t('biometricLogin.faceDetected')
                    : detectionScore > 30
                      ? t('biometricLogin.center')
                      : t('biometricLogin.place')}
              </Typography>
            </Box>
          </>
        ) : (
          // Imagen capturada
          <Box
            component="img"
            src={capturedImage}
            alt={t('biometricLogin.capturedFace')}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
      </Box>
      )}

      {/* Botones de acción */}
      {!isValidatingLiveness && (
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mb: 3 }}>
        {!capturedImage && isCameraActive && (
          <>
            <Button
              variant="contained"
              size="large"
              startIcon={<Iconify icon="solar:camera-add-bold" />}
              onClick={capturePhoto}
            >
              {t('biometricLogin.captureNow')}
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={stopCamera}
            >
              {t('biometricLogin.cancel')}
            </Button>
          </>
        )}

        {!capturedImage && !isCameraActive && !error && (
          <Button
            variant="contained"
            size="large"
            startIcon={<Iconify icon="solar:restart-bold" />}
            onClick={handleRetry}
          >
            {t('biometricLogin.tryAgain')}
          </Button>
        )}

        {capturedImage && (
          <>
            <Button
              variant="contained"
              size="large"
              color="success"
              disabled={isProcessing}
              startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : <Iconify icon="solar:check-circle-bold" />}
              onClick={handleBiometricLogin}
            >
              {isProcessing ? t('biometricLogin.processing') : t('biometricLogin.confirmLogin')}
            </Button>
            <Button
              variant="outlined"
              size="large"
              disabled={isProcessing}
              onClick={handleRetry}
            >
              {t('biometricLogin.retakePhoto')}
            </Button>
          </>
        )}

        {error && (
          <Button
            variant="contained"
            size="large"
            startIcon={<Iconify icon="solar:restart-bold" />}
            onClick={handleRetry}
          >
            {t('biometricLogin.tryAgain')}
          </Button>
        )}
      </Box>
      )}

      {/* Instrucciones */}
      {!isValidatingLiveness && (
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
            {t('biometricLogin.instructions.step1')}
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
            {t('biometricLogin.instructions.step2')}
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
            {t('biometricLogin.instructions.step3')}
          </Typography>
        </Box>
      </Box>
      )}

      {/* Nota sobre privacidad */}
      {!isValidatingLiveness && (
      <Box
        sx={{
          p: 2,
          borderRadius: 1,
          bgcolor: (theme) => alpha(theme.palette.info.main, 0.08),
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {t('biometricLogin.privacyNote')}
        </Typography>
      </Box>
      )}
    </Card>
  );
}
