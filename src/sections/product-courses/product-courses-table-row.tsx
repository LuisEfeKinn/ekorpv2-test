import type { IProductCourse } from 'src/types/learning';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  row: IProductCourse;
  onViewRow?: () => void;
};

export function ProductCoursesTableRow({ row }: Props) {
  const { t } = useTranslate('learning');

  // Validar que la URL sea válida
  const isValidUrl = (url: string | undefined | null) => {
    if (!url) return false;
    if (url === 'string') return false;
    return url.startsWith('http://') || url.startsWith('https://');
  };

  const imageUrl = isValidUrl(row.image) ? row.image : null;

  return (
    <TableRow hover>
      {/* Imagen y Nombre en una sola celda */}
      <TableCell sx={{ minWidth: 380 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            alt={row.displayName || row.codeCourse}
            src={imageUrl || undefined}
            variant="rounded"
            sx={{ 
              width: 96, 
              height: 54,
              flexShrink: 0,
              '& img': {
                objectFit: 'cover',
              },
            }}
          >
            <Iconify icon="solar:notebook-bold-duotone" width={32} />
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle2" sx={{ 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
            }}>
              {row.displayName || row.codeCourse || t('product-courses.card.noName')}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                mt: 0.5,
              }}
              dangerouslySetInnerHTML={{ 
                __html: row.shortDescription || t('product-courses.card.noDescription') 
              }}
            />
          </Box>
        </Box>
      </TableCell>

      {/* Código */}
      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        <Typography variant="body2" color="text.secondary">
          {row.codeCourse}
        </Typography>
      </TableCell>

      {/* Integración */}
      <TableCell>
        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 150 }}>
          {row.integrationName || '-'}
        </Typography>
      </TableCell>

      {/* Idioma */}
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {row.codeLanguague || '-'}
        </Typography>
      </TableCell>

      {/* Estado */}
      <TableCell>
        <Chip
          label={row.isActive ? t('product-courses.card.active') : t('product-courses.card.inactive')}
          size="small"
          color={row.isActive ? 'success' : 'default'}
          variant="soft"
        />
      </TableCell>
    </TableRow>
  );
}
