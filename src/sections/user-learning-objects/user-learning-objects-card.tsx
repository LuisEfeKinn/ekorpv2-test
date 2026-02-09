import type { ILearningObject } from 'src/types/learning';

import { useState } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Rating from '@mui/material/Rating';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import CardContent from '@mui/material/CardContent';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  row: ILearningObject;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  progress?: number; // Progreso del curso (0-100)
  isCertified?: boolean; // Si el curso está certificado
};

export function LearningObjectCard({
  row,
  onView,
  onEdit,
  onDelete,
  progress = 0, // Valor por defecto 0
  isCertified = false, // Valor por defecto false
}: Props) {
  const { t } = useTranslate('learning');
  const [openRatingDialog, setOpenRatingDialog] = useState(false);
  const [rating, setRating] = useState<number | null>(0);

  const handleOpenRatingDialog = () => {
    setOpenRatingDialog(true);
  };

  const handleCloseRatingDialog = () => {
    setOpenRatingDialog(false);
  };

  const handleSaveRating = () => {
    // Aquí iría la lógica para guardar la calificación
    console.log('Calificación guardada:', rating);
    handleCloseRatingDialog();
  };

  const handleDownloadCertificate = async () => {
    try {
      // Fetch del PDF para crear un blob y descargarlo sin navegación
      const response = await fetch('/assets/documents/certificado.pdf');
      const blob = await response.blob();
      
      // Crear URL del blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Crear elemento <a> temporal para descargar
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Certificado_${row.name.replace(/\s+/g, '_')}.pdf`;
      link.style.display = 'none';
      
      // Agregar, hacer clic y limpiar
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Liberar el objeto URL después de un momento
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (error) {
      console.error('Error al descargar el certificado:', error);
    }
  };

  // Validar que la URL sea válida (no sea el texto "string")
  const isValidUrl = (url: string | undefined | null) => {
    if (!url) return false;
    if (url === 'string') return false; // Filtrar el literal "string"
    return url.startsWith('http://') || url.startsWith('https://');
  };

  // Determinar la imagen a usar con prioridad simple
  const imageUrl = 
    (isValidUrl(row.bannerUrl) ? row.bannerUrl : null) ||
    (isValidUrl(row.imageUrl) ? row.imageUrl : null) ||
    (isValidUrl(row.productImage) ? row.productImage : null) ||
    (isValidUrl(row.category?.logo) ? row.category?.logo : null);

  // const getDifficultyColor = (level: string) => {
  //   const lowerLevel = level?.toLowerCase() || '';
  //   if (lowerLevel.includes('básico') || lowerLevel.includes('basico') || lowerLevel.includes('beginner')) {
  //     return 'success';
  //   }
  //   if (lowerLevel.includes('intermedio') || lowerLevel.includes('intermediate')) {
  //     return 'warning';
  //   }
  //   if (lowerLevel.includes('avanzado') || lowerLevel.includes('advanced')) {
  //     return 'error';
  //   }
  //   return 'default';
  // };

  // const truncateText = (text: string, maxLength: number = 120) => {
  //   if (!text) return '';
  //   return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  // };

  return (
    <Card
      sx={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden',
        transition: (theme) => theme.transitions.create(['box-shadow', 'transform'], {
          duration: theme.transitions.duration.shorter,
        }),
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: (theme) => theme.customShadows.z24,
        },
      }}
    >
      {/* Imagen de producto */}
      <Box
        onClick={onView}
        sx={{
          position: 'relative',
          pt: '56.25%', // Aspect ratio 16:9
          overflow: 'hidden',
          bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.12),
          cursor: onView ? 'pointer' : 'default',
        }}
      >
        {imageUrl ? (
          <img
            alt={row.name}
            src={imageUrl}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: (theme) => varAlpha(theme.vars.palette.primary.mainChannel, 0.08),
            }}
          >
            <Iconify
              icon="solar:notebook-bold-duotone"
              width={64}
              sx={{ color: 'primary.main', opacity: 0.48 }}
            />
          </Box>
        )}

        {/* Progreso circular en la esquina superior derecha */}
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
          }}
        >
          <Box 
            sx={{ 
              position: 'relative', 
              display: 'inline-flex',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              borderRadius: '50%',
              padding: '4px',
              backdropFilter: 'blur(4px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            <CircularProgress
              variant="determinate"
              value={100}
              size={56}
              thickness={5}
              sx={{
                color: (theme) => varAlpha(theme.vars.palette.common.whiteChannel, 0.2),
                position: 'absolute',
              }}
            />
            <CircularProgress
              variant="determinate"
              value={progress}
              size={56}
              thickness={5}
              sx={{
                color: 'success.main',
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round',
                },
              }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography
                variant="caption"
                component="div"
                sx={{ 
                  color: 'common.white', 
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                }}
              >
                {`${Math.round(progress)}%`}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Contenido de la tarjeta */}
      <CardContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          p: 2.5,
        }}
      >
        {/* Badge de tipo (CURSO) */}
        <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
          <Chip
            icon={<Iconify icon="solar:notebook-bold-duotone" width={20} />}
            label={t('learning-objects.card.course')}
            size="medium"
            variant="soft"
            color="primary"
            sx={{ fontWeight: 700, fontSize: '0.95rem', py: 0.5 }}
          />
        </Stack>

        {/* Título */}
        <Typography
          variant="h6"
          onClick={onView}
          sx={{
            mb: 1.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            minHeight: '3.6em',
            lineHeight: '1.8em',
            cursor: onView ? 'pointer' : 'default',
            fontWeight: 700,
            fontSize: '1.25rem',
            transition: (theme) => theme.transitions.create(['color'], {
              duration: theme.transitions.duration.shorter,
            }),
            '&:hover': onView ? {
              color: 'primary.main',
            } : {},
          }}
        >
          {row.name}
        </Typography>

        {/* Nivel de dificultad */}
        <Typography
          variant="caption"
          sx={{
            mb: 0.5,
            color: 'text.secondary',
            fontWeight: 600,
            fontSize: '0.875rem',
          }}
        >
          {t('learning-objects.card.theme')}
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{
            mb: 2,
            color: 'warning.main',
            fontWeight: 700,
            fontSize: '1.15rem',
          }}
        >
          {row.category?.name || row.categoryName}
        </Typography>

        {/* Información adicional - Horizontal */}
        <Stack 
          direction="row" 
          spacing={2} 
          sx={{ 
            mb: 2,
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          {/* Duración */}
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Iconify
              icon="solar:clock-circle-bold"
              width={20}
              sx={{ color: 'text.secondary' }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.938rem', fontWeight: 500 }}>
              {row.duration}
            </Typography>
          </Stack>

          {/* Modalidad */}
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Iconify
              icon="solar:monitor-bold"
              width={20}
              sx={{ color: 'text.secondary' }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.938rem', fontWeight: 500 }}>
              {t('learning-objects.card.virtual')}
            </Typography>
          </Stack>

          {/* Nivel */}
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Iconify
              icon="solar:file-bold-duotone"
              width={20}
              sx={{ color: 'text.secondary' }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.938rem', fontWeight: 500 }}>
              {row.difficultyLevel?.name || row.difficultyLevelName}
            </Typography>
          </Stack>
        </Stack>

        {/* Calificación (clickeable) */}
        <Stack 
          direction="row" 
          alignItems="center" 
          spacing={0.5} 
          sx={{ 
            mb: 2,
            cursor: 'pointer',
            transition: 'opacity 0.2s',
            '&:hover': {
              opacity: 0.7,
            },
          }}
          onClick={handleOpenRatingDialog}
        >
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.938rem', fontWeight: 500 }}>
            {t('learning-objects.card.rate')}
          </Typography>
          <Rating 
            value={rating} 
            size="medium" 
            readOnly
            sx={{
              '& .MuiRating-icon': {
                fontSize: '1.25rem',
              },
            }}
          />
        </Stack>

        {/* Botón Ir al Curso / Obtener Certificado */}
        <Button
          fullWidth
          variant="contained"
          color="primary"
          startIcon={isCertified ? <Iconify icon="solar:download-bold" /> : undefined}
          onClick={isCertified ? handleDownloadCertificate : onView}
          sx={{
            mt: 'auto',
            fontWeight: 700,
            py: 1.25,
            borderRadius: 1.5,
            fontSize: '0.938rem',
          }}
        >
          {isCertified 
            ? t('learning-objects.card.getCertificate') 
            : t('learning-objects.card.goToCourse')
          }
        </Button>
      </CardContent>

      {/* Modal de Calificación */}
      <Dialog 
        open={openRatingDialog} 
        onClose={handleCloseRatingDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {row.name}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('learning-objects.card.rateDialog.question')}
          </Typography>
          <Rating
            value={rating}
            onChange={(event, newValue) => {
              setRating(newValue);
            }}
            size="large"
            sx={{
              fontSize: '3rem',
              '& .MuiRating-icon': {
                fontSize: 'inherit',
              },
            }}
          />
          {rating !== null && rating > 0 && (
            <Typography 
              variant="body2" 
              sx={{ 
                mt: 2, 
                fontWeight: 600,
                color: 'text.secondary',
              }}
            >
              {rating === 1 && t('learning-objects.card.rateDialog.veryBad')}
              {rating === 2 && t('learning-objects.card.rateDialog.bad')}
              {rating === 3 && t('learning-objects.card.rateDialog.regular')}
              {rating === 4 && t('learning-objects.card.rateDialog.good')}
              {rating === 5 && t('learning-objects.card.rateDialog.excellent')}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 2 }}>
          <Button 
            onClick={handleCloseRatingDialog}
            variant="outlined"
            sx={{
              minWidth: 120,
              borderRadius: 1.5,
            }}
          >
            {t('learning-objects.card.rateDialog.cancel')}
          </Button>
          <Button 
            onClick={handleSaveRating}
            variant="contained"
            disabled={!rating || rating === 0}
            sx={{
              minWidth: 120,
              borderRadius: 1.5,
            }}
          >
            {t('learning-objects.card.rateDialog.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
