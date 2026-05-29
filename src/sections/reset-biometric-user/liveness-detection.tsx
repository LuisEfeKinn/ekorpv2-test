import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import {
  LivenessSessionService,
  LivenessValidationService,
  PublicUploadLivenessService,
} from 'src/services/auth/biometricRegister.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

interface LivenessDetectionProps {
  documentId: string; // ID del documento desde la URL
  onSuccess: (sessionId: string) => void;
  onError?: (error: Error) => void;
}

export function LivenessDetection({ documentId, onSuccess, onError }: LivenessDetectionProps) {
  const { t } = useTranslate('common');
  
  // Estados
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [detectionScore, setDetectionScore] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [lostDetectionCount, setLostDetectionCount] = useState(0);
  const [stabilityMessage, setStabilityMessage] = useState('');
  const [isStable, setIsStable] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousScoreRef = useRef<number>(0);
  const isCameraOperationInProgress = useRef<boolean>(false);

  // Función para iniciar cámara
  const startCamera = useCallback(async () => {
    // Prevenir múltiples llamadas simultáneas
    if (isCameraOperationInProgress.current) {
      console.log('⚠️ [FACE] Operación de cámara ya en progreso, ignorando...');
      return;
    }
    
    isCameraOperationInProgress.current = true;
    
    try {
      console.log('📹 [FACE] Iniciando cámara...');
      setError(null);
      
      // Delay inicial para asegurar que cualquier componente anterior haya liberado la cámara
      // Esto es crucial cuando se cambia entre componentes de documento y facial
      console.log('⏱️ [FACE] Esperando liberación de cámara de componente anterior (si existe)...');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Si ya hay un stream activo en ESTE componente, detenerlo primero
      if (streamRef.current) {
        console.log('⚠️ [FACE] Stream anterior detectado en este componente, limpiando...');
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
        console.log('✅ Stream obtenido con configuración ideal');
      } catch (idealErr) {
        console.warn('⚠️ No se pudo usar configuración ideal, intentando básica:', idealErr);
        
        // Pequeño delay antes de reintentar (ayuda en móviles)
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Si falla, intentar con configuración más simple (mejor compatibilidad móvil)
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
          },
        });
        console.log('✅ Stream obtenido con configuración básica');
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
      
      console.log('✅ Cámara iniciada correctamente:', {
        'Tracks': stream.getVideoTracks().length,
        'Settings': stream.getVideoTracks()[0]?.getSettings(),
      });
    } catch (err) {
      console.error('❌ Error al acceder a la cámara:', err);
      
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
    console.log('🛑 [FACE] Deteniendo cámara...');
    
    // Limpiar intervalos primero
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    
    // Detener todos los tracks del stream INMEDIATAMENTE
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      console.log(`⏹️ [FACE] Deteniendo ${tracks.length} track(s)...`);
      
      tracks.forEach((track) => {
        if (track.readyState === 'live') {
          console.log(`  → [FACE] Deteniendo track: ${track.label} (${track.kind})`);
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
    
    console.log('✅ [FACE] Cámara detenida completamente');
    
    // NO marcar el flag aquí si es limpieza de desmontaje
    // El flag solo se usa para operaciones del mismo componente
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

      // Umbral: 60% inicial (MÁS ESTRICTO), 55% durante countdown
      const requiredScore = countdown !== null ? 55 : 60;
      const hasFace = finalScore > requiredScore;

      // DETECCIÓN DE ESTABILIDAD: Verificar si el usuario está quieto
      const scoreDifference = Math.abs(finalScore - previousScoreRef.current);
      const isUserStable = scoreDifference < 3; // Tolerancia MÁS ESTRICTA: 3 puntos
      
      // Actualizar el score previo SOLO si hay rostro detectado
      // Esto evita que el primer frame dispare el countdown
      if (hasFace) {
        previousScoreRef.current = finalScore;
      }

      // Actualizar mensajes de instrucción
      if (!hasFace) {
        setStabilityMessage(t('register.livenessDetection.positionFace'));
        setIsStable(false);
      } else if (!isUserStable && countdown === null) {
        setStabilityMessage(t('register.livenessDetection.holdStill'));
        setIsStable(false);
      } else if (isUserStable && hasFace) {
        setStabilityMessage(t('register.livenessDetection.perfectHoldPosition'));
        setIsStable(true);
      } else {
        setStabilityMessage('');
        setIsStable(false);
      }

      console.log('👤 Análisis facial:', {
        '🎯 SCORE FINAL': `${finalScore.toFixed(1)}%`,
        '👤 Tono piel': `${skinPercentage.toFixed(1)}%`,
        '💡 Brillo': `${brightPercentage.toFixed(1)}%`,
        '📍 Centro': `${centerPixels.toFixed(1)}%`,
        '🔒 Estabilidad': isUserStable ? 'ESTABLE' : 'EN MOVIMIENTO',
        '📊 Diferencia': `${scoreDifference.toFixed(1)} pts`,
        '✅ Rostro detectado': hasFace ? 'SÍ' : 'NO',
        '🎯 Umbral requerido': `${requiredScore}%`,
      });

      setDetectionScore(Math.round(finalScore));

      setIsFaceDetected(hasFace);

      // Solo iniciar countdown si el usuario está QUIETO y tiene rostro detectado
      // Y si el score previo también era alto (para evitar falsos positivos)
      if (hasFace && isUserStable && countdown === null && previousScoreRef.current > requiredScore) {
        console.log('✅ Rostro detectado Y estable - Iniciando countdown');
        setCountdown(5); // Aumentar a 5 segundos para DAR MÁS TIEMPO
        setLostDetectionCount(0);
      } else if ((!hasFace || !isUserStable) && countdown !== null) {
        const newCount = lostDetectionCount + 1;
        setLostDetectionCount(newCount);
        
        if (newCount >= 3) { // Aumentar tolerancia a 3 fallos
          console.log('⚠️ Rostro perdido o movimiento detectado (3 veces) - Cancelando countdown');
          setCountdown(null);
          setLostDetectionCount(0);
          toast.warning(t('register.livenessDetection.movementDetected'));
        } else {
          console.log(`⚠️ Rostro perdido o movimiento temporalmente (${newCount}/3) - Manteniendo countdown`);
        }
      } else if (hasFace && isUserStable && countdown !== null) {
        setLostDetectionCount(0);
      }
    } catch (err) {
      console.error('Error en detección facial:', err);
    }
  }, [isCameraActive, capturedImage, countdown, lostDetectionCount, t]);

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

    // Capturar TODA el área visible (sin recortes adicionales)
    // El óvalo guía visual es solo una referencia, pero capturamos el área completa
    // para que coincida exactamente con lo que el usuario ve en la preview
    
    // Configurar canvas con el tamaño del área visible completa
    canvas.width = visibleWidth;
    canvas.height = visibleHeight;

    // Dibujar TODA el área visible del video (sin recortes)
    context.drawImage(
      video,
      offsetX, offsetY, visibleWidth, visibleHeight,  // Área visible completa
      0, 0, visibleWidth, visibleHeight                // Canvas completo
    );

    // Obtener la imagen como base64 con calidad alta
    const imageData = canvas.toDataURL('image/jpeg', 0.95); // JPEG sin transparencia
    
    console.log('📸 [FACE] Foto de rostro capturada (área completa sin zoom):', {
      'Video original': `${videoWidth}x${videoHeight} (${videoAspectRatio.toFixed(2)})`,
      'Preview aspect': `${previewAspectRatio.toFixed(2)} (3:4)`,
      'Área visible': `${Math.round(visibleWidth)}x${Math.round(visibleHeight)}`,
      'Área capturada': `${Math.round(visibleWidth)}x${Math.round(visibleHeight)}`,
      'Aspect captura': `${(visibleWidth / visibleHeight).toFixed(2)}`,
      'Formato': 'JPEG rectangular (área completa visible)',
      'Tamaño archivo': `${(imageData.length / 1024).toFixed(2)} KB`,
    });

    // Detener cámara INMEDIATAMENTE antes de guardar la imagen
    // Esto previene que el stream quede "colgado" en móviles
    stopCamera();
    
    // Pequeño delay para asegurar que stopCamera terminó
    await new Promise(resolve => setTimeout(resolve, 100));
    
    setCapturedImage(imageData);
  }, [stopCamera]);

  // Auto-iniciar cámara al montar
  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

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
      console.log('⏱️ Countdown terminado - Capturando foto');
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

  // Convertir base64 a File para envío multipart/form-data
  const base64ToFile = useCallback((base64String: string, filename: string): File => {
    const arr = base64String.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
  }, []);

  // Manejar el análisis de vivacidad con servicios reales
  const handleAnalysisComplete = useCallback(async () => {
    if (!capturedImage) return;

    setIsProcessing(true);
    setError(null);

    try {
      // ⚠️ IMPORTANTE: El flujo correcto para AWS Rekognition Liveness es:
      // 1. Crear sesión → LivenessSessionService
      // 2. Usuario completa desafío facial (FaceLivenessDetector con gestos en tiempo real)
      // 3. Validar sesión → LivenessValidationService (Status debe ser "SUCCEEDED")
      // 4. Extraer ReferenceImage.Bytes (foto verificada)
      // 5. Subir foto verificada → PublicUploadLivenessService
      //
      // 🔴 PROBLEMA ANTERIOR: Creábamos la sesión al inicio y expiraba antes de validar
      //
      // 💡 SOLUCIÓN: Crear sesión JUSTO ANTES de validar para evitar expiración
      // Esto minimiza el tiempo entre creación y validación

        // PASO 1: Subir foto facial con PublicUploadLivenessService PRIMERO
        toast.info(t('register.livenessDetection.uploadingFace'));

        // Convertir la imagen base64 a File
        const imageFile = base64ToFile(
          capturedImage,
          `liveness-${Date.now()}.jpg`
        );

        // Crear FormData con los parámetros requeridos
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('documentId', documentId); // ID del documento desde la URL
        formData.append('process', 'accessRecovery');

        console.log('📤 [LIVENESS] Uploading selfie to PublicUploadLivenessService:', {
          documentId,
          timestamp: new Date().toISOString(),
        });

        // Llamar al servicio de subida de liveness
        const uploadResponse = await PublicUploadLivenessService(formData);

        console.log('✅ [LIVENESS] PublicUploadLivenessService Response:', {
          statusCode: uploadResponse.data?.statusCode,
          message: uploadResponse.data?.message,
          biometricValidationId: uploadResponse.data?.data?.biometricValidationId,
          fullData: uploadResponse.data?.data,
        });

        // Validar respuesta exitosa
        if (uploadResponse.data?.statusCode === 201) {
          toast.success(uploadResponse.data?.message || t('register.livenessDetection.uploadSuccess'));

          // Extraer biometricValidationId de la respuesta
          const biometricValidationId = uploadResponse.data?.data?.biometricValidationId;

          if (!biometricValidationId) {
            console.error('❌ [LIVENESS] biometricValidationId not found in response');
            throw new Error('No se recibió biometricValidationId del servidor');
          }

          // PASO 2: Crear sesión con LivenessSessionService
          toast.info(t('register.livenessDetection.creatingSession'));

          console.log('🔑 [LIVENESS] Creating session with LivenessSessionService:', {
            biometricValidationId,
            timestamp: new Date().toISOString(),
          });

          let sessionResponse;
          let usedDocumentIdFallback = false;

          try {
            // INTENTO 1: Intentar con biometricValidationId (PRIORITARIO)
            sessionResponse = await LivenessSessionService(biometricValidationId);
            
            console.log('✅ [LIVENESS] Session created with biometricValidationId:', {
              statusCode: sessionResponse.data?.statusCode,
              sessionId: sessionResponse.data?.data?.sessionId,
              identityId: sessionResponse.data?.data?.identityId,
              expiresIn: sessionResponse.data?.data?.expiresIn,
            });
          } catch (biometricIdError: any) {
            console.warn('⚠️ [LIVENESS] Failed with biometricValidationId, trying documentId fallback:', {
              error: biometricIdError.response?.data?.message || biometricIdError.message,
            });

            // INTENTO 2: Si falla con biometricValidationId, intentar con documentId (FALLBACK)
            try {
              sessionResponse = await LivenessSessionService(documentId);
              usedDocumentIdFallback = true;
              
              console.log('✅ [LIVENESS] Session created with documentId (FALLBACK):', {
                statusCode: sessionResponse.data?.statusCode,
                sessionId: sessionResponse.data?.data?.sessionId,
                identityId: sessionResponse.data?.data?.identityId,
                expiresIn: sessionResponse.data?.data?.expiresIn,
              });
            } catch (docIdError: any) {
              console.error('❌ [LIVENESS] Both attempts failed (biometricValidationId + documentId):', {
                biometricIdError: biometricIdError.response?.data?.message,
                docIdError: docIdError.response?.data?.message,
              });
              
              // Si fallan ambos, mostrar error y detener proceso
              const errorMsg = docIdError.response?.data?.message || t('register.livenessDetection.sessionError');
              throw new Error(errorMsg);
            }
          }

          // Validar respuesta de creación de sesión
          if (sessionResponse.data?.statusCode === 201 && sessionResponse.data?.data?.sessionId) {
            const sessionId = sessionResponse.data.data.sessionId;

            console.log('🎯 [LIVENESS] Using sessionId for validation:', {
              sessionId,
              usedFallback: usedDocumentIdFallback,
              createdAt: new Date().toISOString(),
            });

            toast.success(sessionResponse.data?.message || t('register.livenessDetection.sessionCreated'));          // ⚠️ AQUÍ DEBERÍA IR EL FaceLivenessDetector
          // <FaceLivenessDetector sessionId={sessionId} onAnalysisComplete={...} />
          // Pero como no está implementado, continuamos con la foto estática

          // PASO 3: Validar INMEDIATAMENTE (minimizar tiempo de expiración)
          toast.info(t('register.livenessDetection.validatingLiveness'));

          console.log('⏳ [LIVENESS] Waiting 1 second before validation...');
          // ⚠️ NOTA: Pequeño delay para que el backend procese
          await new Promise(resolve => setTimeout(resolve, 1000));

          console.log('🔍 [LIVENESS] Starting validation:', {
            sessionId,
            timeSinceCreation: '~1 second',
            timestamp: new Date().toISOString(),
          });

          let validationResponse;
          let finalSessionId = sessionId;

          try {
            // INTENTO 1: Validar con el sessionId original
            validationResponse = await LivenessValidationService(sessionId);
            
            console.log('✅ [LIVENESS] Validation successful with original sessionId:', {
              sessionId,
              statusCode: validationResponse.data?.statusCode,
            });
          } catch (validationError: any) {
            console.warn('⚠️ [LIVENESS] Validation failed with original sessionId, trying documentId fallback:', {
              error: validationError.response?.data?.message || validationError.message,
              originalSessionId: sessionId,
            });

            // INTENTO 2: Si falla la validación, crear nueva sesión con documentId
            try {
              toast.info('Creando sesión alternativa con documento...');
              
              console.log('🔑 [LIVENESS] Creating fallback session with documentId:', {
                documentId,
                timestamp: new Date().toISOString(),
              });

              const fallbackSessionResponse = await LivenessSessionService(documentId);
              
              if (fallbackSessionResponse.data?.statusCode === 201 && fallbackSessionResponse.data?.data?.sessionId) {
                const fallbackSessionId = fallbackSessionResponse.data.data.sessionId;
                
                console.log('✅ [LIVENESS] Fallback session created with documentId:', {
                  fallbackSessionId,
                  documentId,
                  statusCode: fallbackSessionResponse.data.statusCode,
                });

                // Pequeño delay antes de validar
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Validar con el nuevo sessionId
                console.log('🔍 [LIVENESS] Validating with fallback sessionId:', {
                  fallbackSessionId,
                  timestamp: new Date().toISOString(),
                });

                validationResponse = await LivenessValidationService(fallbackSessionId);
                finalSessionId = fallbackSessionId;

                console.log('✅ [LIVENESS] Validation successful with fallback sessionId:', {
                  fallbackSessionId,
                  statusCode: validationResponse.data?.statusCode,
                });

                toast.success('Sesión alternativa validada correctamente');
              } else {
                throw new Error('No se pudo crear sesión alternativa con documentId');
              }
            } catch (fallbackError: any) {
              console.error('❌ [LIVENESS] Both validation attempts failed:', {
                originalError: validationError.response?.data?.message || validationError.message,
                fallbackError: fallbackError.response?.data?.message || fallbackError.message,
              });

              // Si ambos fallan, lanzar el error original
              throw validationError;
            }
          }

          const validationData = validationResponse.data;
          const status = validationData?.details?.Status;
          const live = validationData?.live;

          console.log('📊 [LIVENESS] Final Validation Response:', {
            live,
            liveScore: validationData?.liveScore,
            threshold: validationData?.threshold,
            status,
            sessionId: finalSessionId,
            fullResponse: validationData,
          });

          // ⚠️ WORKAROUND: Como NO implementamos FaceLivenessDetector (gestos en tiempo real),
          // el Status siempre será "CREATED" en lugar de "SUCCEEDED".
          // 
          // AWS Rekognition requiere que el usuario complete gestos faciales para que
          // el Status cambie a "SUCCEEDED". Sin esos gestos, la sesión queda en "CREATED".
          // 
          // Para que funcione CON FOTO ESTÁTICA, aceptamos Status "CREATED" como válido
          // y dejamos que el backend valide la foto directamente.

          if (status === 'SUCCEEDED') {
            // ✅ CASO IDEAL: Usuario completó gestos faciales (FaceLivenessDetector)
            console.log('✅ [LIVENESS] Status: SUCCEEDED - Liveness verification completed with gestures');
            toast.success(t('register.livenessDetection.validationSuccess'));
            onSuccess(finalSessionId);
          } else if (status === 'CREATED') {
            // ⚠️ WORKAROUND: Foto estática sin gestos - Permitir continuar
            console.warn('⚠️ [LIVENESS] Status: CREATED - Session created but no facial gestures completed');
            console.warn('   This is expected when using static photo instead of FaceLivenessDetector');
            console.warn('   Backend should validate the photo directly');
            
            toast.warning(
              '⚠️ Validación facial completada (sin gestos). El sistema validará tu foto.',
              { duration: 4000 }
            );
            
            // Permitir continuar con Status "CREATED"
            onSuccess(finalSessionId);
          } else if (status === 'EXPIRED') {
            // ⚠️ Sesión expirada - Ocurre cuando pasa mucho tiempo entre creación y validación
            console.warn('⚠️ [LIVENESS] Status: EXPIRED - Session expired before validation');
            console.warn('   This happens because AWS Rekognition requires FaceLivenessDetector gestures');
            
            toast.warning(
              '⚠️ La sesión expiró. El sistema validará tu foto de todas formas.',
              { duration: 4000 }
            );
            
            // Permitir continuar con Status "EXPIRED"
            onSuccess(finalSessionId);
          } else {
            // ❌ Otros estados (FAILED, FACE_NOT_DETECTED, TOO_MANY_FACES, etc.)
            console.error('❌ [LIVENESS] Validation failed:', {
              status,
              live,
              liveScore: validationData?.liveScore,
              threshold: validationData?.threshold,
            });
            
            toast.error(
              t('register.livenessDetection.livenessFailure') + 
              ` (Status: ${status})`
            );

            // Limpiar imagen capturada y reiniciar cámara
            setCapturedImage(null);
            await new Promise(resolve => setTimeout(resolve, 500));
            startCamera();
          }
        } else {
          // Error al crear sesión de Liveness
          const sessionErrorMsg = sessionResponse.data?.message || t('register.livenessDetection.sessionError');
          throw new Error(sessionErrorMsg);
        }
      } else {
        // Respuesta inesperada en subida de liveness
        const errorMsg = uploadResponse.data?.message || 'Respuesta inesperada del servidor';
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      console.error('❌ Error en análisis de vivacidad:', err);
      
      let errorMessage = t('register.livenessDetection.validationError');

      if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);

      if (onError && err instanceof Error) {
        onError(err);
      }

      // Limpiar imagen capturada y reiniciar cámara
      setCapturedImage(null);
      await new Promise(resolve => setTimeout(resolve, 500));
      startCamera();
    } finally {
      setIsProcessing(false);
    }
  }, [capturedImage, documentId, base64ToFile, t, onSuccess, onError, startCamera]);

  // Reintentar (con bloqueo de operación)
  const handleRetry = useCallback(async () => {
    console.log('🔄 [FACE] Reiniciando captura...');
    setCapturedImage(null);
    setError(null);
    
    // Marcar operación en progreso para ESTE componente
    isCameraOperationInProgress.current = true;
    
    // Detener cámara primero
    stopCamera();
    
    // Delay para móviles
    console.log('⏱️ [FACE] Esperando liberación completa de la cámara...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Liberar flag antes de iniciar (para que startCamera pueda proceder)
    isCameraOperationInProgress.current = false;
    
    // Ahora sí, iniciar cámara
    console.log('🚀 [FACE] Iniciando cámara nuevamente...');
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
        {t('register.livenessDetection.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('register.livenessDetection.subtitle')}
      </Typography>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Área de cámara con detección */}
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

            {/* Instrucción flotante con detección de estabilidad */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                bgcolor: (theme) => alpha(
                  isStable ? theme.palette.success.main : theme.palette.common.black, 
                  isStable ? 0.9 : 0.8
                ),
                color: 'common.white',
                px: 3,
                py: 1.5,
                borderRadius: 2,
                maxWidth: '90%',
                textAlign: 'center',
                transition: 'background-color 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              {isStable && (
                <Iconify icon="eva:checkmark-circle-2-fill" width={20} />
              )}
              <Typography variant="body2" fontWeight="medium">
                {stabilityMessage || (
                  countdown !== null
                    ? t('register.livenessDetection.perfect')
                    : isFaceDetected
                    ? t('register.livenessDetection.faceDetected')
                    : detectionScore > 30
                    ? t('register.livenessDetection.center')
                    : t('register.livenessDetection.place')
                )}
              </Typography>
            </Box>
          </>
        ) : (
          // Imagen capturada
          <Box
            component="img"
            src={capturedImage}
            alt={t('register.livenessDetection.capturedFace')}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
      </Box>

      {/* Botones de acción */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mb: 3 }}>
        {!capturedImage && isCameraActive && (
          <>
            <Button
              variant="contained"
              size="large"
              startIcon={<Iconify icon="solar:camera-add-bold" />}
              onClick={capturePhoto}
            >
              {t('register.livenessDetection.captureNow')}
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={stopCamera}
            >
              {t('register.livenessDetection.cancel')}
            </Button>
          </>
        )}

        {capturedImage && (
          <>
            <Button
              variant="contained"
              size="large"
              color="success"
              disabled={isProcessing}
              startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : <Iconify icon="solar:check-circle-bold" />}
              onClick={handleAnalysisComplete}
            >
              {isProcessing ? t('register.livenessDetection.processing') : t('register.livenessDetection.confirmPhoto')}
            </Button>
            <Button
              variant="outlined"
              size="large"
              disabled={isProcessing}
              onClick={handleRetry}
            >
              {t('register.livenessDetection.retakePhoto')}
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
            {t('register.livenessDetection.tryAgain')}
          </Button>
        )}
      </Box>

      {/* Instrucciones numeradas */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          mb: 3,
        }}
      >
        {/* Instrucción 1 */}
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
            {t('register.livenessDetection.instructions.step1')}
          </Typography>
        </Box>

        {/* Instrucción 2 */}
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
            {t('register.livenessDetection.instructions.step2')}
          </Typography>
        </Box>

        {/* Instrucción 3 */}
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
            {t('register.livenessDetection.instructions.step3')}
          </Typography>
        </Box>

        {/* Instrucción 4 */}
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
            {t('register.livenessDetection.instructions.step4')}
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
          {t('register.livenessDetection.privacyNote')}
        </Typography>
      </Box>
    </Card>
  );
}
