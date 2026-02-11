import type { IProductCourse } from 'src/types/learning';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  row: IProductCourse;
  onView?: () => void;
};

export function ProductCoursesCard({
  row,
  onView,
}: Props) {
  const { t } = useTranslate('learning');

  // Validar que la URL sea válida
  const isValidUrl = (url: string | undefined | null) => {
    if (!url) return false;
    if (url === 'string') return false;
    return url.startsWith('http://') || url.startsWith('https://');
  };

  const imageUrl = isValidUrl(row.image) ? row.image : null;

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
      {/* Imagen del curso */}
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
            alt={row.displayName || row.codeCourse}
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

        {/* Badge de estado activo/inactivo */}
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
          }}
        >
          <Chip
            label={row.isActive ? t('product-courses.card.active') : t('product-courses.card.inactive')}
            size="small"
            color={row.isActive ? 'success' : 'default'}
            sx={{
              fontWeight: 'bold',
              bgcolor: (theme) => row.isActive 
                ? theme.vars.palette.success.main 
                : theme.vars.palette.grey[400],
              color: 'common.white',
            }}
          />
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
          {row.displayName || row.codeCourse || t('product-courses.card.noName')}
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
            minHeight: '4.5em',
            '& *': { display: 'inline' },
          }}
          dangerouslySetInnerHTML={{ __html: row.shortDescription || t('product-courses.card.noDescription') }}
        />

        {/* Información adicional */}
        <Stack spacing={1.5} sx={{ mb: 2 }}>
          {/* Código del curso */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify
              icon="solar:copy-bold"
              width={20}
              sx={{ color: 'text.secondary' }}
            />
            <Typography variant="body2" color="text.secondary">
              {row.codeCourse}
            </Typography>
          </Stack>

          {/* Integración */}
          {row.integrationName && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify
                icon="solar:map-point-bold"
                width={20}
                sx={{ color: 'text.secondary' }}
              />
              <Typography variant="body2" color="text.secondary">
                {row.integrationName}
              </Typography>
            </Stack>
          )}

          {/* Idioma */}
          {row.codeLanguague && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify
                icon="solar:flag-bold"
                width={20}
                sx={{ color: 'text.secondary' }}
              />
              <Typography variant="body2" color="text.secondary">
                {row.codeLanguague}
              </Typography>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

