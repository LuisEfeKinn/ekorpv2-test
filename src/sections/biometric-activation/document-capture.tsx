// import type { Dispatch, SetStateAction } from 'react';

import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Fade from '@mui/material/Fade';
import Button from '@mui/material/Button';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
// import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';

import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { UploadDocumentService } from 'src/services/auth/biometricActivation.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type DocumentSyde = 'front' | 'back' | 'complete';

interface DocumentCaptureProps {
  side: DocumentSyde;
  onCapture: (imageData: string, side: DocumentSyde, identityId?: string) => void;
  onSkip?: () => void;
  allowManualUpload?: boolean; // Nueva prop para habilitar carga manual
}

export function DocumentCapture({ side, onCapture, onSkip, allowManualUpload = false }: DocumentCaptureProps) {
  const { t } = useTranslate('common');
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadMode, setUploadMode] = useState<'camera' | 'manual'>('camera'); // Modo de captura
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAligned, setIsAligned] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [detectionScore, setDetectionScore] = useState<number>(0); // Score en tiempo real
  const [lostDetectionCount, setLostDetectionCount] = useState<number>(0); // Contador de pérdida
  const [manualCaptureCountdown, setManualCaptureCountdown] = useState<number | null>(null); // Countdown para captura manual
  const [userCancelled, setUserCancelled] = useState(false); // Indica si el usuario canceló manualmente
  const [isDragging, setIsDragging] = useState(false); // Para drag & drop visual
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const manualCaptureIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCameraOperationInProgress = useRef<boolean>(false); // 🔒 Flag para prevenir race condition

  const sideLabel = side === 'front'
    ? t('register.documentCapture.front')
    : side === 'back'
      ? t('register.documentCapture.back')
      : t('register.documentCapture.complete');

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
      // Esto es crucial cuando se cambia de "front" a "back" o viceversa
      await new Promise(resolve => setTimeout(resolve, 800));

      // Si ya hay un stream activo en ESTE componente, detenerlo primero
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Primero activar el estado para que se renderice el video element
      setIsCameraActive(true);

      // Intentar primero con configuración ideal
      let stream: MediaStream | null = null;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Usa cámara trasera en móviles
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
      } catch {
        // Pequeño delay antes de reintentar (ayuda en móviles)
        await new Promise(resolve => setTimeout(resolve, 200));

        // Si falla, intentar con configuración más simple (mejor compatibilidad móvil)
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
          },
        });
      }

      if (!stream) {
        throw new Error('No se pudo obtener stream de video');
      }

      streamRef.current = stream;

      // Delay para asegurar que el video element se haya renderizado
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
  const stopCamera = useCallback((cancelled: boolean = false) => {
    // Limpiar intervalos primero
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
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
    setIsAligned(false);

    // Marcar si fue cancelación manual del usuario
    if (cancelled) {
      setUserCancelled(true);
    }

    // NO marcar el flag aquí si es limpieza de desmontaje
    // El flag solo se usa para operaciones del mismo componente
  }, []);

  // Detectar si el documento está alineado usando análisis de imagen avanzado
  const detectAlignment = useCallback(() => {
    if (!isCameraActive || capturedImage || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    try {
      // Configurar canvas para análisis
      const analysisWidth = 640;
      const analysisHeight = 480;
      canvas.width = analysisWidth;
      canvas.height = analysisHeight;

      // Dibujar el frame actual
      context.drawImage(video, 0, 0, analysisWidth, analysisHeight);

      // Obtener datos de imagen
      const imageData = context.getImageData(0, 0, analysisWidth, analysisHeight);
      const data = imageData.data;

      // Convertir a escala de grises
      const grayScale: number[] = [];
      for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3);
        grayScale.push(gray);
      }

      // Área donde están las guías (marco rectangular)
      // Expandir área de análisis hacia adentro para detectar mejor los bordes
      const guideX = Math.floor(analysisWidth * 0.075);
      const guideY = Math.floor(analysisHeight * 0.15);
      const guideWidth = Math.floor(analysisWidth * 0.85);
      const guideHeight = Math.floor(analysisHeight * 0.70);

      // Área interna reducida para detección de bordes (más tolerante si está fuera del marco visual)
      const innerMargin = 30; // Reducir 30px de cada lado para análisis
      const innerX = guideX + innerMargin;
      const innerY = guideY + innerMargin;
      const innerWidth = guideWidth - (innerMargin * 2);
      const innerHeight = guideHeight - (innerMargin * 2);

      // DETECCIÓN DE BORDES RECTANGULARES ESPECÍFICOS
      let horizontalEdges = 0;
      let verticalEdges = 0;
      let cornerDetections = 0;
      let totalBrightness = 0;
      let uniformityScore = 0;

      // 1. Detectar bordes horizontales usando área INTERNA (más tolerante a posición)
      // Escanear 2 líneas para ser más robusto pero sin sobredetectar
      for (let offsetY = 0; offsetY <= 5; offsetY += 5) {
        // Línea horizontal superior
        for (let x = innerX; x < innerX + innerWidth - 1; x++) {
          const topIdx = (innerY + offsetY) * analysisWidth + x;
          if (topIdx + analysisWidth < grayScale.length) {
            const topGradient = Math.abs(grayScale[topIdx] - grayScale[topIdx + analysisWidth]);
            if (topGradient > 30) horizontalEdges++; // Más selectivo
          }
        }

        // Línea horizontal inferior
        for (let x = innerX; x < innerX + innerWidth - 1; x++) {
          const bottomIdx = (innerY + innerHeight - offsetY) * analysisWidth + x;
          if (bottomIdx - analysisWidth >= 0) {
            const bottomGradient = Math.abs(grayScale[bottomIdx] - grayScale[bottomIdx - analysisWidth]);
            if (bottomGradient > 30) horizontalEdges++; // Más selectivo
          }
        }
      }

      // 2. Detectar bordes verticales usando área INTERNA
      // Escanear 2 líneas para ser más robusto pero sin sobredetectar
      for (let offsetX = 0; offsetX <= 5; offsetX += 5) {
        // Línea vertical izquierda
        for (let y = innerY; y < innerY + innerHeight - 1; y++) {
          const leftIdx = y * analysisWidth + (innerX + offsetX);
          if (leftIdx + 1 < grayScale.length) {
            const leftGradient = Math.abs(grayScale[leftIdx] - grayScale[leftIdx + 1]);
            if (leftGradient > 30) verticalEdges++; // Más selectivo
          }
        }

        // Línea vertical derecha
        for (let y = innerY; y < innerY + innerHeight - 1; y++) {
          const rightIdx = y * analysisWidth + (innerX + innerWidth - offsetX);
          if (rightIdx - 1 >= 0) {
            const rightGradient = Math.abs(grayScale[rightIdx] - grayScale[rightIdx - 1]);
            if (rightGradient > 30) verticalEdges++; // Más selectivo
          }
        }
      }

      // 3. Detectar esquinas usando área INTERNA (más tolerante a posición)
      const cornerSize = 30;
      const corners = [
        { x: innerX, y: innerY }, // Superior izquierda
        { x: innerX + innerWidth - cornerSize, y: innerY }, // Superior derecha
        { x: innerX, y: innerY + innerHeight - cornerSize }, // Inferior izquierda
        { x: innerX + innerWidth - cornerSize, y: innerY + innerHeight - cornerSize }, // Inferior derecha
      ];

      corners.forEach(corner => {
        let cornerEdges = 0;
        for (let dy = 0; dy < cornerSize; dy++) {
          for (let dx = 0; dx < cornerSize; dx++) {
            const idx = (corner.y + dy) * analysisWidth + (corner.x + dx);
            const nextX = idx + 1;
            const nextY = idx + analysisWidth;

            if (nextX < grayScale.length && nextY < grayScale.length) {
              const gradient = Math.abs(grayScale[idx] - grayScale[nextX]) +
                Math.abs(grayScale[idx] - grayScale[nextY]);
              if (gradient > 25) cornerEdges++; // MUY sensible para esquinas
            }
          }
        }
        if (cornerEdges > 40) cornerDetections++; // MUY permisivo para esquinas
      });

      // 4. Analizar uniformidad y brillo del área interna
      let pixelCount = 0;
      let brightPixelCount = 0;
      const values: number[] = [];

      for (let y = innerY + 10; y < innerY + innerHeight - 10; y++) {
        for (let x = innerX + 10; x < innerX + innerWidth - 10; x++) {
          const idx = y * analysisWidth + x;
          const value = grayScale[idx];
          values.push(value);
          totalBrightness += value;
          if (value > 160) brightPixelCount++;
          pixelCount++;
        }
      }

      const avgBrightness = totalBrightness / pixelCount;
      const brightnessPercentage = (brightPixelCount / pixelCount) * 100;

      // Calcular desviación estándar (documentos son uniformes)
      const variance = values.reduce((sum, val) => sum + Math.pow(val - avgBrightness, 2), 0) / pixelCount;
      const stdDev = Math.sqrt(variance);
      uniformityScore = stdDev < 40 ? 100 : Math.max(0, 100 - stdDev);

      // 5. Calcular proporciones de bordes detectados
      // Como ahora escaneamos 2 líneas (offset 0, 5), multiplicamos por 2
      const horizontalPercentage = (horizontalEdges / (innerWidth * 2 * 2)) * 100;
      const verticalPercentage = (verticalEdges / (innerHeight * 2 * 2)) * 100;

      // SISTEMA DE PUNTUACIÓN BALANCEADO
      // Permisivo pero con validación de forma rectangular
      let documentScore = 0;
      let maxScore = 0;

      // Criterio 1: Bordes horizontales (0-22 puntos) - Selectivo pero razonable
      maxScore += 22;
      if (horizontalPercentage > 12) documentScore += 22;
      else if (horizontalPercentage > 9) documentScore += 18;
      else if (horizontalPercentage > 6) documentScore += 12;
      else if (horizontalPercentage > 4) documentScore += 6;

      // Criterio 2: Bordes verticales (0-22 puntos) - Selectivo pero razonable
      maxScore += 22;
      if (verticalPercentage > 12) documentScore += 22;
      else if (verticalPercentage > 9) documentScore += 18;
      else if (verticalPercentage > 6) documentScore += 12;
      else if (verticalPercentage > 4) documentScore += 6;

      // Criterio 3: Esquinas detectadas (0-25 puntos) - MUY IMPORTANTE para forma rectangular
      maxScore += 25;
      if (cornerDetections >= 3) documentScore += 25;
      else if (cornerDetections >= 2) documentScore += 18;
      else if (cornerDetections >= 1) documentScore += 8;
      // Sin esquinas = 0 puntos (CRÍTICO para filtrar personas)

      // Criterio 4: Brillo adecuado (0-15 puntos)
      maxScore += 15;
      if (brightnessPercentage > 25 && brightnessPercentage < 92) {
        if (brightnessPercentage > 40 && brightnessPercentage < 85) documentScore += 15;
        else documentScore += 10;
      } else if (brightnessPercentage > 15) {
        documentScore += 5;
      }

      // Criterio 5: Uniformidad (0-16 puntos) - Permisivo para documentos brillantes
      maxScore += 16;
      if (uniformityScore > 50) documentScore += 16;
      else if (uniformityScore > 35) documentScore += 13;
      else if (uniformityScore > 25) documentScore += 10;
      else if (uniformityScore > 15) documentScore += 7;
      else documentScore += 3; // Puntos base reducidos (evitar dar demasiado a personas)

      // Calcular porcentaje final
      const finalScore = (documentScore / maxScore) * 100;

      // Balance rectangular - OBLIGATORIO para distinguir documentos de personas
      const edgeBalance = Math.min(horizontalPercentage, verticalPercentage) /
        Math.max(horizontalPercentage, verticalPercentage, 0.01);

      // DOCUMENTO DETECTADO con validaciones RIGUROSAS (40%):
      // Si ya está en countdown, usar umbral más bajo (35% vs 40%)
      const requiredScore = countdown !== null ? 35 : 40;
      const requiredBalance = countdown !== null ? 0.4 : 0.45;
      const requiredCorners = countdown !== null ? 1 : 2; // Inicial necesita 2 esquinas

      const hasDocument =
        finalScore > requiredScore &&
        edgeBalance > requiredBalance &&
        cornerDetections >= requiredCorners;

      // Actualizar score visual
      setDetectionScore(Math.round(finalScore));
      setIsAligned(hasDocument);

      if (hasDocument && countdown === null) {
        setCountdown(2);
        setLostDetectionCount(0); // Reset contador
      } else if (!hasDocument && countdown !== null) {
        // Incrementar contador de pérdida, dar 2 intentos antes de cancelar
        const newCount = lostDetectionCount + 1;
        setLostDetectionCount(newCount);

        if (newCount >= 2) {
          setCountdown(null);
          setLostDetectionCount(0);
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
        }
      } else if (hasDocument && countdown !== null) {
        // Si recupera la detección durante countdown, resetear contador
        setLostDetectionCount(0);
      }
    } catch {
      // Error silencioso en detección
    }
  }, [isCameraActive, capturedImage, countdown, lostDetectionCount]);

  // Capturar foto (recortada con el MISMO aspect ratio que la preview)
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Dimensiones del video original (alta resolución)
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // Aspect ratio de la preview (definido en el componente: aspectRatio: '4/3')
    const previewAspectRatio = 4 / 3; // 1.333...
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

    // Ahora aplicar las guías dentro del área visible (85% ancho x 70% alto)
    const guideWidthPercent = 0.85;
    const guideHeightPercent = 0.70;

    const cropWidth = visibleWidth * guideWidthPercent;
    const cropHeight = visibleHeight * guideHeightPercent;
    const cropX = offsetX + (visibleWidth - cropWidth) / 2;
    const cropY = offsetY + (visibleHeight - cropHeight) / 2;

    // Configurar canvas con el tamaño exacto del recorte
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    // Dibujar solo el área recortada del video
    context.drawImage(
      video,
      cropX, cropY, cropWidth, cropHeight,  // Área de origen (lo que se ve en preview)
      0, 0, cropWidth, cropHeight            // Área de destino (canvas completo)
    );

    // Obtener la imagen como base64 con calidad alta
    const imageData = canvas.toDataURL('image/jpeg', 0.95);

    // Detener cámara INMEDIATAMENTE antes de guardar la imagen
    // Esto previene que el stream quede "colgado" en móviles
    stopCamera();

    // Pequeño delay para asegurar que stopCamera terminó
    await new Promise(resolve => setTimeout(resolve, 100));

    setCapturedImage(imageData);
  }, [stopCamera]);

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

  // Procesar documento con servicio real + Validación Liveness
  const processDocument = useCallback(async () => {
    if (!capturedImage) return;

    setIsProcessing(true);
    setError(null);

    try {
      // PASO 1: Subir documento y obtener identityId
      // Convertir la imagen base64 a File
      const imageFile = base64ToFile(
        capturedImage,
        `document-${side}-${Date.now()}.jpg`
      );

      // Crear FormData
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('process', 'biometricActivation');
      formData.append('documentSyde', side);

      // Llamar al servicio de subida de documento
      const uploadResponse = await UploadDocumentService(formData);

      // Validar respuesta exitosa del documento
      if (uploadResponse.data?.statusCode === 201 && uploadResponse.data?.data?.indentityId) {
        const identityId = uploadResponse.data.data.indentityId;

        // Mostrar mensaje de éxito de la subida del documento
        const uploadSuccessMessage = uploadResponse.data?.message || t('register.documentCapture.successMessage');
        toast.success(uploadSuccessMessage);

        // Llamar al callback con la imagen y el identityId del upload
        // La validación de liveness se hará en el componente liveness-detection.tsx
        onCapture(capturedImage, side, identityId);
      } else {
        // Respuesta inesperada en subida de documento
        const errorMsg = uploadResponse.data?.message || 'Respuesta inesperada del servidor';
        toast.error(errorMsg);

        // Limpiar imagen capturada y reiniciar cámara
        setCapturedImage(null);
        await new Promise(resolve => setTimeout(resolve, 500));
        startCamera();
      }
    } catch (err: any) {
      let errorMessage = t('register.documentCapture.validationError');

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast.error(errorMessage);

      // Limpiar imagen capturada y reiniciar cámara
      setCapturedImage(null);
      await new Promise(resolve => setTimeout(resolve, 500));
      startCamera();
    } finally {
      setIsProcessing(false);
    }
  }, [capturedImage, side, onCapture, base64ToFile, t, startCamera]);

  // Iniciar captura manual con countdown de 3 segundos
  const startManualCapture = useCallback(() => {
    setManualCaptureCountdown(3);
  }, []);

  // Cancelar captura manual
  const cancelManualCapture = useCallback(() => {
    setManualCaptureCountdown(null);
    if (manualCaptureIntervalRef.current) {
      clearInterval(manualCaptureIntervalRef.current);
      manualCaptureIntervalRef.current = null;
    }
  }, []);

  // Manejar selección de archivo manual
  const handleFileSelect = useCallback(async (file: File) => {
    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      toast.error(t('register.documentCapture.manualUpload.invalidFileType'));
      return;
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('register.documentCapture.manualUpload.fileTooLarge'));
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Convertir archivo a base64 para preview (promesa)
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setCapturedImage(base64);

      // Crear FormData con el archivo original
      const formData = new FormData();
      formData.append('file', file);
      formData.append('process', 'biometricActivation');
      formData.append('documentSyde', 'complete'); // ⭐ Modo "complete" para carga manual

      // Subir documento
      const uploadResponse = await UploadDocumentService(formData);

      if (uploadResponse.data?.statusCode === 201 && uploadResponse.data?.data?.indentityId) {
        const identityId = uploadResponse.data.data.indentityId;
        const uploadSuccessMessage = uploadResponse.data?.message || t('register.documentCapture.manualUpload.uploadSuccess');
        toast.success(uploadSuccessMessage);

        // Llamar al callback con modo "complete" para saltar al liveness
        // Enviar una cadena simple en lugar de base64 para indicar éxito
        onCapture('manual-upload', 'complete', identityId);
      } else {
        throw new Error(uploadResponse.data?.message || t('register.documentCapture.manualUpload.uploadError'));
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || t('register.documentCapture.manualUpload.uploadError');
      setError(errorMessage);
      toast.error(errorMessage);
      setCapturedImage(null);
    } finally {
      setIsProcessing(false);
    }
  }, [onCapture, t]);

  // Manejar click en el área de drop
  const handleDropAreaClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Manejar cambio en input de archivo
  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Manejar drag over
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  // Manejar drag leave
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  // Manejar drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Cambiar modo de captura
  const switchToManualMode = useCallback(() => {
    setUploadMode('manual');
    stopCamera();
  }, [stopCamera]);

  const switchToCameraMode = useCallback(() => {
    setUploadMode('camera');
    setCapturedImage(null);
    setError(null);
    startCamera();
  }, [startCamera]);

  // Reintentar captura (con bloqueo de operación)
  const retryCapture = useCallback(async () => {
    setCapturedImage(null);
    setError(null);

    // Marcar operación en progreso para ESTE componente
    isCameraOperationInProgress.current = true;

    // Detener cámara primero
    stopCamera();

    // Delay para móviles
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Liberar flag antes de iniciar (para que startCamera pueda proceder)
    isCameraOperationInProgress.current = false;

    // Ahora sí, iniciar cámara
    startCamera();
  }, [startCamera, stopCamera]);

  // Iniciar cámara automáticamente al montar el componente (solo si está en modo cámara)
  useEffect(() => {
    if (uploadMode === 'camera') {
      startCamera();
    }

    // Cleanup al desmontar
    return () => {
      stopCamera();
    };
  }, [uploadMode, startCamera, stopCamera]);

  // Detección continua de alineación
  useEffect(() => {
    if (isCameraActive && !capturedImage) {
      // Si está en countdown, reducir frecuencia de verificación (más tolerante)
      // Si no está en countdown, verificar más frecuentemente
      const detectionInterval = countdown !== null ? 400 : 200;

      detectionIntervalRef.current = setInterval(() => {
        detectAlignment();
      }, detectionInterval);

      return () => {
        if (detectionIntervalRef.current) {
          clearInterval(detectionIntervalRef.current);
          detectionIntervalRef.current = null;
        }
      };
    }
    return undefined;
  }, [isCameraActive, capturedImage, detectAlignment, countdown]);

  // Countdown automático cuando está alineado
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      countdownIntervalRef.current = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => {
        if (countdownIntervalRef.current) {
          clearTimeout(countdownIntervalRef.current);
        }
      };
    } else if (countdown === 0) {
      // Capturar automáticamente cuando el countdown llega a 0
      capturePhoto();
    }
    return undefined;
  }, [countdown, capturePhoto]);

  // Countdown para captura manual
  useEffect(() => {
    if (manualCaptureCountdown !== null && manualCaptureCountdown > 0) {
      manualCaptureIntervalRef.current = setTimeout(() => {
        setManualCaptureCountdown(manualCaptureCountdown - 1);
      }, 1000);

      return () => {
        if (manualCaptureIntervalRef.current) {
          clearTimeout(manualCaptureIntervalRef.current);
        }
      };
    } else if (manualCaptureCountdown === 0) {
      // Capturar cuando el countdown manual llega a 0
      capturePhoto();
      setManualCaptureCountdown(null);
    }
    return undefined;
  }, [manualCaptureCountdown, capturePhoto]);

  return (
    <Card
      sx={{
        p: 3,
        maxWidth: 600,
        mx: 'auto',
      }}
    >
      <Typography variant="h5" sx={{ mb: 2, textAlign: 'center' }}>
        {t('register.documentCapture.title')} - {sideLabel}
      </Typography>

      {/* Selector de modo (solo en el paso front) */}
      {allowManualUpload && side === 'front' && !capturedImage && (
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              p: 0.5,
              borderRadius: 1.5,
              bgcolor: 'background.neutral',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Button
              fullWidth
              variant={uploadMode === 'camera' ? 'contained' : 'text'}
              size="large"
              startIcon={<Iconify icon="solar:camera-add-bold" />}
              onClick={switchToCameraMode}
              sx={{
                borderRadius: 1,
                textTransform: 'none',
              }}
            >
              {t('register.documentCapture.manualUpload.switchToCamera')}
            </Button>
            <Button
              fullWidth
              variant={uploadMode === 'manual' ? 'contained' : 'text'}
              size="large"
              startIcon={<Iconify icon="solar:file-text-bold" />}
              onClick={switchToManualMode}
              sx={{
                borderRadius: 1,
                textTransform: 'none',
              }}
            >
              {t('register.documentCapture.manualUpload.switchToManual')}
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
            {uploadMode === 'camera'
              ? t('register.documentCapture.manualUpload.cameraDescription')
              : t('register.documentCapture.manualUpload.manualDescription')
            }
          </Typography>
        </Box>
      )}

      {error && (
        <Box
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 1,
            bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
            color: 'error.main',
          }}
        >
          <Typography variant="body2">{error}</Typography>
        </Box>
      )}

      {/* Área de captura o carga */}
      {uploadMode === 'manual' && !capturedImage ? (
        // Área de drag & drop
        <Fade in>
          <Box
            onClick={handleDropAreaClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            sx={{
              position: 'relative',
              width: '100%',
              aspectRatio: '4/3',
              borderRadius: 2,
              border: '3px dashed',
              borderColor: isDragging ? 'primary.main' : 'divider',
              bgcolor: isDragging
                ? (theme) => alpha(theme.palette.primary.main, 0.08)
                : 'background.neutral',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              p: 4,
              mb: 2,
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
              },
            }}
          >
            <Iconify
              icon={(isDragging ? "solar:folder-with-files-bold" : "solar:file-text-bold") as any}
              width={80}
              sx={{
                color: isDragging ? 'primary.main' : 'text.secondary',
                transition: 'all 0.3s ease',
              }}
            />
            <Typography variant="h6" color={isDragging ? 'primary.main' : 'text.primary'}>
              {isDragging
                ? t('register.documentCapture.manualUpload.dropZoneTitleActive')
                : t('register.documentCapture.manualUpload.dropZoneTitle')
              }
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              {t('register.documentCapture.manualUpload.dropZoneSubtitle')}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              {t('register.documentCapture.manualUpload.dropZoneFormat')}
            </Typography>
            <Box
              component="input"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              sx={{ display: 'none' }}
            />
          </Box>
        </Fade>
      ) : (
        // Área de captura con cámara
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            aspectRatio: '4/3',
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: 'grey.900',
            mb: 2,
          }}
        >
          {/* Video preview */}
          {isCameraActive && !capturedImage && uploadMode === 'camera' && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />

              {/* Guías visuales para el documento */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '85%',
                  height: '60%', // Más rectangular para documentos en formato cuadrado
                  border: '3px solid',
                  borderColor: isAligned ? 'success.main' : 'primary.main',
                  borderRadius: 2,
                  boxShadow: (theme) => `0 0 0 9999px ${alpha(theme.palette.common.black, 0.5)}`,
                  transition: 'border-color 0.3s ease',
                  '&::before, &::after': {
                    content: '""',
                    position: 'absolute',
                    width: 20,
                    height: 20,
                    borderColor: isAligned ? 'success.main' : 'primary.main',
                    borderStyle: 'solid',
                    transition: 'border-color 0.3s ease',
                  },
                  '&::before': {
                    top: -3,
                    left: -3,
                    borderWidth: '3px 0 0 3px',
                  },
                  '&::after': {
                    top: -3,
                    right: -3,
                    borderWidth: '3px 3px 0 0',
                  },
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -3,
                    left: -3,
                    width: 20,
                    height: 20,
                    borderWidth: '0 0 3px 3px',
                    borderColor: isAligned ? 'success.main' : 'primary.main',
                    borderStyle: 'solid',
                    transition: 'border-color 0.3s ease',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -3,
                    right: -3,
                    width: 20,
                    height: 20,
                    borderWidth: '0 3px 3px 0',
                    borderColor: isAligned ? 'success.main' : 'primary.main',
                    borderStyle: 'solid',
                    transition: 'border-color 0.3s ease',
                  }}
                />

                {/* Countdown en el centro cuando está alineado (automático) */}
                {countdown !== null && countdown > 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 100,
                      height: 100,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: (theme) => alpha(theme.palette.success.main, 0.9),
                      borderRadius: '50%',
                      animation: 'pulse 1s ease-in-out',
                      '@keyframes pulse': {
                        '0%': {
                          transform: 'translate(-50%, -50%) scale(1)',
                        },
                        '50%': {
                          transform: 'translate(-50%, -50%) scale(1.1)',
                        },
                        '100%': {
                          transform: 'translate(-50%, -50%) scale(1)',
                        },
                      },
                    }}
                  >
                    <Typography
                      variant="h1"
                      sx={{
                        color: 'common.white',
                        fontWeight: 'bold',
                      }}
                    >
                      {countdown}
                    </Typography>
                  </Box>
                )}

                {/* Countdown en el centro para captura manual */}
                {manualCaptureCountdown !== null && manualCaptureCountdown > 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 120,
                      height: 120,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: (theme) => alpha(theme.palette.warning.main, 0.95),
                      borderRadius: '50%',
                      animation: 'pulse 1s ease-in-out',
                      '@keyframes pulse': {
                        '0%': {
                          transform: 'translate(-50%, -50%) scale(1)',
                        },
                        '50%': {
                          transform: 'translate(-50%, -50%) scale(1.1)',
                        },
                        '100%': {
                          transform: 'translate(-50%, -50%) scale(1)',
                        },
                      },
                    }}
                  >
                    <Typography
                      variant="h1"
                      sx={{
                        color: 'common.white',
                        fontWeight: 'bold',
                        mb: 0.5,
                      }}
                    >
                      {manualCaptureCountdown}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'common.white',
                        fontWeight: 'medium',
                      }}
                    >
                      {t('register.documentCapture.preparing')}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Indicador de detección con SCORE en la esquina superior */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  alignItems: 'flex-end',
                }}
              >
                {/* Indicador de estado */}
                <Box
                  sx={{
                    bgcolor: (theme) => alpha(
                      isAligned
                        ? theme.palette.success.main
                        : theme.palette.warning.main,
                      0.9
                    ),
                    color: 'common.white',
                    px: 2,
                    py: 0.5,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    transition: 'background-color 0.3s ease',
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: 'common.white',
                      animation: isAligned ? 'none' : 'blink 1.5s infinite',
                      '@keyframes blink': {
                        '0%, 100%': { opacity: 1 },
                        '50%': { opacity: 0.3 },
                      },
                    }}
                  />
                  <Typography variant="caption" fontWeight="bold" fontSize={10}>
                    {isAligned ? t('register.documentCapture.detected') : t('register.documentCapture.searching')}
                  </Typography>
                </Box>

                {/* Score en tiempo real */}
                <Box
                  sx={{
                    bgcolor: (theme) => alpha(
                      detectionScore >= 40
                        ? theme.palette.success.main
                        : detectionScore >= 30
                          ? theme.palette.info.main
                          : theme.palette.warning.main,
                      0.9
                    ),
                    color: 'common.white',
                    px: 2,
                    py: 1,
                    borderRadius: 1,
                    transition: 'background-color 0.3s ease',
                    minWidth: 80,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="h6" fontWeight="bold">
                    {detectionScore}%
                  </Typography>
                  <Typography variant="caption" fontSize={9}>
                    {detectionScore >= 40 ? t('register.documentCapture.ready') : detectionScore >= 30 ? t('register.documentCapture.almost') : t('register.documentCapture.continue')}
                  </Typography>
                </Box>
              </Box>

            </>
          )}

          {/* Imagen capturada */}
          {capturedImage && (
            <img
              src={capturedImage}
              alt="Documento capturado"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          )}

          {/* Placeholder cuando no hay cámara activa */}
          {!isCameraActive && !capturedImage && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
              }}
            >
              <Iconify
                icon="solar:file-bold-duotone"
                width={64}
                sx={{ color: 'text.disabled', mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                {t('register.documentCapture.pressStartCamera')}
              </Typography>
            </Box>
          )}

          {/* Canvas oculto para captura */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </Box>
      )}

      {/* Estado actual simple debajo del recuadro */}
      {isCameraActive && !capturedImage && uploadMode === 'camera' && (
        <Box
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 2,
            bgcolor: (theme) => alpha(
              isAligned
                ? theme.palette.success.main
                : theme.palette.primary.main,
              0.08
            ),
            border: '1px solid',
            borderColor: (theme) => alpha(
              isAligned
                ? theme.palette.success.main
                : theme.palette.primary.main,
              0.24
            ),
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            transition: 'all 0.3s ease',
          }}
        >
          <Iconify
            icon={isAligned ? "solar:check-circle-bold" : "solar:eye-bold"}
            width={32}
            sx={{
              color: isAligned ? 'success.main' : 'primary.main',
              flexShrink: 0,
            }}
          />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {isAligned
                ? t('register.documentCapture.documentDetected')
                : t('register.documentCapture.placeDocument')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isAligned
                ? t('register.documentCapture.keepPosition')
                : t('register.documentCapture.useButton')}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Barra de progreso durante procesamiento */}
      {isProcessing && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {t('register.documentCapture.processing')}
          </Typography>
        </Box>
      )}

      {/* Botones de acción */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', textAlign: 'center' }}>
        {/* Mostrar estado de carga mientras se inicia la cámara (solo si no fue cancelado manualmente y está en modo cámara) */}
        {uploadMode === 'camera' && !isCameraActive && !capturedImage && !error && !userCancelled && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary">
              {t('register.documentCapture.startingCamera')}
            </Typography>
          </Box>
        )}

        {/* Botones mientras la cámara está activa */}
        {uploadMode === 'camera' && isCameraActive && !capturedImage && (
          <>
            {manualCaptureCountdown === null ? (
              <Button
                variant="contained"
                size="large"
                color="primary"
                onClick={startManualCapture}
                startIcon={<Iconify icon="solar:camera-add-bold" />}
              >
                {t('register.documentCapture.captureNow')}
              </Button>
            ) : (
              <Button
                variant="contained"
                size="large"
                color="warning"
                onClick={cancelManualCapture}
                startIcon={<Iconify icon="solar:clock-circle-bold" />}
              >
                {t('register.documentCapture.capturingIn')} {manualCaptureCountdown}...
              </Button>
            )}
            <Button
              variant="outlined"
              size="large"
              onClick={() => stopCamera(true)}
              startIcon={<Iconify icon="solar:close-circle-bold" />}
            >
              {t('register.documentCapture.cancel')}
            </Button>
          </>
        )}

        {/* Botones cuando el usuario cancela (cámara detenida pero no capturada) - solo en modo cámara */}
        {uploadMode === 'camera' && !isCameraActive && !capturedImage && !error && userCancelled && (
          <>
            <Button
              variant="contained"
              size="large"
              color="primary"
              onClick={() => {
                setUserCancelled(false);
                startCamera();
              }}
              startIcon={<Iconify icon="solar:camera-add-bold" />}
            >
              {t('register.documentCapture.startCamera')}
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => router.back()}
            >
              {t('register.documentCapture.goBack')}
            </Button>
          </>
        )}

        {/* Botones después de capturar */}
        {capturedImage && !isProcessing && (
          <>
            <Button
              variant="contained"
              size="large"
              startIcon={<Iconify icon="solar:shield-check-bold" />}
              onClick={processDocument}
            >
              {t('register.documentCapture.validate')}
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<Iconify icon="solar:restart-bold" />}
              onClick={retryCapture}
            >
              {t('register.documentCapture.retakePhoto')}
            </Button>
          </>
        )}

        {/* Botón de reintentar si hay error */}
        {error && !isCameraActive && (
          <Button
            variant="contained"
            size="large"
            startIcon={<Iconify icon="solar:restart-bold" />}
            onClick={startCamera}
          >
            {t('register.documentCapture.tryAgain')}
          </Button>
        )}
      </Box>

      {/* Instrucciones paso a paso al final (solo en modo cámara) */}
      {uploadMode === 'camera' && isCameraActive && !capturedImage && (
        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 2,
            bgcolor: 'background.neutral',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Iconify icon="solar:list-bold" width={20} />
            {t('register.documentCapture.instructions.title')}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {/* Paso 1 */}
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
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
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  flexShrink: 0,
                }}
              >
                1
              </Box>
              <Typography variant="body2" sx={{ pt: 0.3 }}>
                {t('register.documentCapture.instructions.step1').split(t('register.documentCapture.instructions.step1Bold'))[0]}
                <strong>{t('register.documentCapture.instructions.step1Bold')}</strong>
                {t('register.documentCapture.instructions.step1').split(t('register.documentCapture.instructions.step1Bold'))[1]}
              </Typography>
            </Box>

            {/* Paso 2 */}
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
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
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  flexShrink: 0,
                }}
              >
                2
              </Box>
              <Typography variant="body2" sx={{ pt: 0.3 }}>
                {t('register.documentCapture.instructions.step2').split(t('register.documentCapture.instructions.step2Bold'))[0]}
                <strong>{t('register.documentCapture.instructions.step2Bold')}</strong>
                {t('register.documentCapture.instructions.step2').split(t('register.documentCapture.instructions.step2Bold'))[1]}
              </Typography>
            </Box>

            {/* Paso 3 */}
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
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
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  flexShrink: 0,
                }}
              >
                3
              </Box>
              <Typography variant="body2" sx={{ pt: 0.3 }}>
                {t('register.documentCapture.instructions.step3').split(t('register.documentCapture.instructions.step3Bold'))[0]}
                <strong>{t('register.documentCapture.instructions.step3Bold')}</strong>
                {t('register.documentCapture.instructions.step3').split(t('register.documentCapture.instructions.step3Bold'))[1]}
              </Typography>
            </Box>

            {/* Paso 4 */}
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
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
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  flexShrink: 0,
                }}
              >
                4
              </Box>
              <Typography variant="body2" sx={{ pt: 0.3 }}>
                {t('register.documentCapture.instructions.step4').split(t('register.documentCapture.instructions.step4Bold'))[0]}
                <strong>{t('register.documentCapture.instructions.step4Bold')}</strong>
                {t('register.documentCapture.instructions.step4').split(t('register.documentCapture.instructions.step4Bold'))[1]}
              </Typography>
            </Box>

            {/* Paso 5 */}
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
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
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  flexShrink: 0,
                }}
              >
                5
              </Box>
              <Typography variant="body2" sx={{ pt: 0.3 }}>
                {t('register.documentCapture.instructions.step5').split(t('register.documentCapture.instructions.step5Bold'))[0]}
                <strong>{t('register.documentCapture.instructions.step5Bold')}</strong>
                {t('register.documentCapture.instructions.step5').split(t('register.documentCapture.instructions.step5Bold'))[1]}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Card>
  );
}
