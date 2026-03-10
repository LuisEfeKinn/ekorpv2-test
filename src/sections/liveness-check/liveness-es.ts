import type { FaceLivenessDetectorProps } from '@aws-amplify/ui-react-liveness';

type DisplayText = NonNullable<FaceLivenessDetectorProps['displayText']>;

/** Helper: acepta cualquier mapa de strings y lo castea al tipo esperado por el componente */
function asDisplayText(dict: Record<string, string>): DisplayText {
  return dict as unknown as DisplayText;
}

/** Diccionario único ES (incluye claves presentes y variantes usadas por otras builds) */
export const LIVENESS_ES = asDisplayText({
  // ——— Pantalla inicial / instrucciones (algunas builds) ———
  startScreenHeadingText: 'Verificación facial',
  startScreenBodyText:
    'Sigue las instrucciones en pantalla. Asegúrate de tener buena iluminación y mantén tu rostro dentro del óvalo.',
  startScreenBeginCheckText: 'Comenzar verificación',

  // ——— Advertencia de fotosensibilidad (si tu reto usa luces) ———
  photosensitivityWarningHeadingText: 'Advertencia de fotosensibilidad',
  photosensitivityWarningBodyText:
    'Esta verificación muestra luces de colores. Ten precaución si eres fotosensible.',
  photosensitivityWarningInfoText:
    'Si sientes molestia, detén la verificación.',
  photosensitivityWarningLabelText: 'Entendido',

  // ——— Hints / captions del encuadre ———
  hintCenterFaceText: 'Centra tu rostro',
  hintTooFarText: 'Acércate',
  hintTooCloseText: 'Aléjate un poco',
  goodFitCaptionText: 'Buen encuadre',
  tooFarCaptionText: 'Demasiado lejos',
  tooCloseCaptionText: 'Demasiado cerca',

  // Variantes que algunas versiones usan para "acércate / aléjate"
  moveCloserText: 'Acércate',
  moveBackText: 'Aléjate un poco',
  hintMoveFaceCloserText: 'Acércate a la cámara',
  hintMoveFaceFartherText: 'Aléjate un poco de la cámara',
  moveFaceCloserText: 'Acércate',
  moveFaceFartherText: 'Aléjate un poco',
  ovalMoveCloserText: 'Acércate',
  ovalMoveFartherText: 'Aléjate un poco',

  // ——— "Hold still" y variantes ———
  holdStillText: 'Mantente quieto',
  hintHoldStillText: 'Mantente quieto',
  keepStillText: 'Mantente quieto',
  keepStillHeadingText: 'Mantente quieto',
  lookStraightAheadText: 'Mira al frente',

  // ——— Estados/proceso ———
  hintConnectingText: 'Conectando…',
  hintVerifyingText: 'Verificando…',
  hintCheckCompleteText: 'Verificación completa',
  followInstructionsText: 'Sigue las instrucciones',
  recordingIndicatorText: 'Rec',
  progressBarAccessibilityText: 'Progreso de la verificación',

  // ——— Permisos de cámara ———
  cameraPermissionHeadingText: 'Permiso para usar la cámara',
  cameraPermissionBodyText:
    'Necesitamos acceder a tu cámara para completar la verificación.',
  allowCameraText: 'Permitir cámara',

  // ——— Botones / accesibilidad ———
  cancelText: 'Cancelar',
  cancelButtonText: 'Cancelar',
  closeButtonText: 'Cerrar',
  closeButtonAriaLabelText: 'Cerrar',
  retryButtonText: 'Reintentar',
  backButtonText: 'Regresar',
  tryAgainText: 'Intentar de nuevo',

  // ——— Errores / timeouts ———
  errorLabelText: 'Error',
  errorHeadingText: 'No pudimos completar la verificación',
  errorBodyText:
    'Ocurrió un problema durante la verificación. Revisa tu conexión e inténtalo nuevamente.',
  connectionTimeoutHeaderText: 'Se agotó el tiempo de conexión',
  connectionTimeoutContentText:
    'No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo.',
  timeoutHeadingText: 'Se agotó el tiempo',
  timeoutBodyText:
    'No logramos encuadrar el rostro a tiempo. Asegúrate de estar centrado y con buena iluminación.',

  // --- HOLD STILL (todas las variantes conocidas) ---
  holdStillHeadingText: 'Mantente quieto',
  holdStillBodyText: 'Mantén tu rostro quieto unos segundos.',
  holdStillInstructionText: 'Mantente quieto',
  holdStillCaptionText: 'Mantente quieto',
  holdSteadyText: 'Mantente quieto',
  stayStillText: 'Mantente quieto',
  keepYourHeadStillText: 'Mantén la cabeza quieta',

  // --- WAITING FOR CAMERA PERMISSION (todas las variantes conocidas) ---
  waitingForCameraPermissionText: 'Esperando que autorices el uso de la cámara…',
  waitingCameraPermissionText: 'Esperando que autorices el uso de la cámara…',
  waitingForPermissionText: 'Esperando que autorices el uso de la cámara…',
  requestingCameraPermissionText: 'Solicitando permiso de cámara…',
  requestingCameraPermissionsText: 'Solicitando permiso de cámara…',
  requestCameraPermissionText: 'Solicitando permiso de cámara…',
  requestCameraPermissionsText: 'Solicitando permiso de cámara…',
  cameraPermissionAwaitingText: 'Esperando que autorices el uso de la cámara…',
  cameraPermissionWaitingText: 'Esperando que autorices el uso de la cámara…',
  cameraPermissionHintText: 'Autoriza el permiso de cámara para continuar.',
  cameraPermissionPromptText: 'Autoriza el permiso de cámara para continuar.',

  // HINTS existentes en tu tipo (afectan el banner turquesa):
  hintHoldFaceForFreshnessText: 'Mantente quieto',
  hintCenterFaceInstructionText: 'Mantente quieto',

  // opcional: para el indicador de coincidencia/encuadre si aparece
  hintMatchIndicatorText: 'Buen encuadre',

  // Más variantes encontradas en diferentes versiones
  hintFaceDetectedText: 'Rostro detectado',
  hintCanNotIdentifyText: 'Muévete para mejorar la detección',
  hintTooManyFacesText: 'Asegúrate de estar solo',
  hintMoveFaceFrontOfCameraText: 'Mueve tu rostro frente a la cámara',
  cameraMinSpecificationsHeadingText: 'Especificaciones mínimas de la cámara',
  cameraMinSpecificationsMessageText: 'La cámara debe soportar al menos 320x240 píxeles',
  cameraNotFoundHeadingText: 'Cámara no encontrada',
  cameraNotFoundMessageText: 'No se pudo acceder a tu cámara. Verifica los permisos.',
  a11yVideoLabelText: 'Video de verificación de liveness',
  cancelLivenessCheckText: 'Cancelar verificación',
});
