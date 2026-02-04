import type { IProductCourse } from 'src/types/learning';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardContent from '@mui/material/CardContent';

import { fCurrency } from 'src/utils/format-number';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  row: IProductCourse;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function ProductCoursesCard({
  row,
  onView,
  onEdit,
  onDelete,
}: Props) {
  const { t } = useTranslate('learning');

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
    (isValidUrl(row.category?.logo) ? row.category?.logo : null);

  const getDifficultyColor = (level: string) => {
    const lowerLevel = level?.toLowerCase() || '';
    if (lowerLevel.includes('básico') || lowerLevel.includes('basico') || lowerLevel.includes('beginner')) {
      return 'success';
    }
    if (lowerLevel.includes('intermedio') || lowerLevel.includes('intermediate')) {
      return 'warning';
    }
    if (lowerLevel.includes('avanzado') || lowerLevel.includes('advanced')) {
      return 'error';
    }
    return 'default';
  };

  return (
    <Card
      sx={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: (theme) => theme.transitions.create(['box-shadow', 'transform'], {
          duration: theme.transitions.duration.shorter,
        }),
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: (theme) => theme.customShadows.z20,
        },
      }}
    >
      {/* Imagen de producto */}
      <Box
        sx={{
          position: 'relative',
          pt: '56.25%', // Aspect ratio 16:9
          overflow: 'hidden',
          bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.12),
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

        {/* Badge de precio o gratis */}
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
          }}
        >
          {row.isFree ? (
            <Chip
              label={t('product-courses.card.free')}
              size="small"
              color="success"
              sx={{
                fontWeight: 'bold',
                bgcolor: (theme) => theme.vars.palette.success.main,
                color: 'common.white',
              }}
            />
          ) : (
            <Stack
              direction="column"
              spacing={0.5}
              alignItems="flex-end"
            >
              {(row.priceDiscount ?? 0) > 0 && (
                <Chip
                  label={fCurrency(row.price ?? 0)}
                  size="small"
                  sx={{
                    fontWeight: 'bold',
                    bgcolor: (theme) => varAlpha(theme.vars.palette.common.blackChannel, 0.48),
                    color: 'common.white',
                    textDecoration: 'line-through',
                    opacity: 0.8,
                  }}
                />
              )}
              <Chip
                label={fCurrency((row.priceDiscount ?? 0) > 0 ? (row.priceDiscount ?? 0) : (row.price ?? 0))}
                size="small"
                sx={{
                  fontWeight: 'bold',
                  bgcolor: (theme) => (row.priceDiscount ?? 0) > 0 
                    ? theme.vars.palette.success.main 
                    : varAlpha(theme.vars.palette.common.blackChannel, 0.72),
                  color: 'common.white',
                }}
              />
              {(row.priceDiscount ?? 0) > 0 && (row.price ?? 0) > 0 && (
                <Chip
                  label={`-${Math.round((((row.price ?? 0) - (row.priceDiscount ?? 0)) / (row.price ?? 0)) * 100)}%`}
                  size="small"
                  color="error"
                  sx={{
                    fontWeight: 'bold',
                    fontSize: '0.7rem',
                    height: '20px',
                  }}
                />
              )}
            </Stack>
          )}
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
        {/* Título */}
        <Typography
          variant="h6"
          sx={{
            mb: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            minHeight: '3.2em',
            lineHeight: '1.6em',
          }}
        >
          {row.name}
        </Typography>

        {/* Descripción */}
        <Typography
          variant="body2"
          color="text.secondary"
          component="div"
          sx={{
            mb: 2,
            flexGrow: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            // Ensure inline elements inside the HTML respect the clamp
            '& *': { display: 'inline' },
          }}
          // Render HTML content received from the API (assumes server provides safe HTML)
          dangerouslySetInnerHTML={{ __html: row.description || '' }}
        />

        {/* Información adicional */}
        <Stack spacing={1.5} sx={{ mb: 2 }}>
          {/* Categoría */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify
              icon="solar:file-bold-duotone"
              width={20}
              sx={{ color: 'text.secondary' }}
            />
            <Typography variant="body2" color="text.secondary">
              {row.category?.name || row.categoryName}
            </Typography>
          </Stack>

          {/* Duración */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify
              icon="solar:clock-circle-bold"
              width={20}
              sx={{ color: 'text.secondary' }}
            />
            <Typography variant="body2" color="text.secondary">
              {row.duration}
            </Typography>
          </Stack>
        </Stack>

        {/* Nivel de dificultad */}
        <Box sx={{ mb: 2 }}>
          <Chip
            label={row.difficultyLevel?.name || row.difficultyLevelName}
            size="small"
            color={getDifficultyColor(row.difficultyLevel?.name || row.difficultyLevelName || '')}
            variant="soft"
            sx={{ fontWeight: 600 }}
          />
        </Box>

        {/* Acciones */}
        <Stack
          direction="row"
          spacing={1}
          sx={{
            pt: 2,
            borderTop: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
          }}
        >
          {onView && (
            <Tooltip title={t('product-courses.actions.viewDetails', 'Ver detalles')}>
              <IconButton
                color="primary"
                onClick={onView}
                sx={{
                  bgcolor: (theme) => varAlpha(theme.vars.palette.primary.mainChannel, 0.08),
                  '&:hover': {
                    bgcolor: (theme) => varAlpha(theme.vars.palette.primary.mainChannel, 0.16),
                  },
                }}
              >
                <Iconify icon="solar:eye-bold" />
              </IconButton>
            </Tooltip>
          )}

          {onEdit && (
            <Tooltip title={t('product-courses.actions.edit', 'Editar')}>
              <IconButton
                color="default"
                onClick={onEdit}
                sx={{
                  bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
                  '&:hover': {
                    bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.16),
                  },
                }}
              >
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip>
          )}

          {onDelete && (
            <Tooltip title={t('product-courses.actions.delete', 'Eliminar')}>
              <IconButton
                color="error"
                onClick={onDelete}
                sx={{
                  bgcolor: (theme) => varAlpha(theme.vars.palette.error.mainChannel, 0.08),
                  '&:hover': {
                    bgcolor: (theme) => varAlpha(theme.vars.palette.error.mainChannel, 0.16),
                  },
                }}
              >
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
