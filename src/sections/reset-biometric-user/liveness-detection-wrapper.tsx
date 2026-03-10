'use client';

import dynamic from 'next/dynamic';

import { Box, CircularProgress } from '@mui/material';

// Carga dinámica del componente de liveness detection (solo en el cliente)
const LivenessDetectionDynamic = dynamic(
  () => import('./liveness-detection').then((mod) => ({ default: mod.LivenessDetection })),
  {
    ssr: false, // NO renderizar en el servidor
    loading: () => (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400,
        }}
      >
        <CircularProgress />
      </Box>
    ),
  }
);

interface LivenessDetectionWrapperProps {
  documentId: string;
  onSuccess: (sessionId: string) => void;
  onError?: (error: Error) => void;
}

export function LivenessDetectionWrapper({
  documentId,
  onSuccess,
  onError,
}: LivenessDetectionWrapperProps) {
  return (
    <LivenessDetectionDynamic documentId={documentId} onSuccess={onSuccess} onError={onError} />
  );
}
