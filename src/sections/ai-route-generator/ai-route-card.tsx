'use client';

// ----------------------------------------------------------------------
// AI Route Card Component
// ----------------------------------------------------------------------

import type { IAiRoute } from 'src/types/ai-route-generation';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardContent from '@mui/material/CardContent';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  row: IAiRoute;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function AiRouteCard({ row, onView, onEdit, onDelete }: Props) {
  const { t } = useTranslate('ai');

  const isValidUrl = (url: string | undefined | null) => {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://');
  };

  const imageUrl = isValidUrl(row.bannerUrl) ? row.bannerUrl : null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'generating': return 'info';
      case 'completed': return 'success';
      case 'published': return 'primary';
      case 'archived': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    const key = `status.${status}` as const;
    return t(key) || status;
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
      {/* Status Badge */}
      <Chip
        label={getStatusLabel(row.status)}
        color={getStatusColor(row.status) as any}
        size="small"
        sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 9,
          backdropFilter: 'blur(8px)',
          bgcolor: (theme) => varAlpha(theme.vars.palette.background.paperChannel, 0.9),
          fontWeight: 600,
        }}
      />

      {/* Thumbnail */}
      <Box
        sx={{
          position: 'relative',
          pt: '56.25%',
          overflow: 'hidden',
          bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.12),
        }}
      >
        {imageUrl ? (
          <img
            alt={row.title}
            src={imageUrl}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
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
            <Iconify icon="solar:map-point-bold" width={64} sx={{ color: 'primary.main', opacity: 0.48 }} />
          </Box>
        )}
      </Box>

      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="subtitle1" noWrap sx={{ mb: 0.5 }}>
          {row.title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {row.description}
        </Typography>

        {/* Metadata */}
        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mb: 2, gap: 0.5 }}>
          <Chip
            icon={<Iconify icon="solar:book-bold" width={14} />}
            label={t('ai-route-generation.modulesCount', { count: row.modules?.length || 0 })}
            size="small"
            variant="soft"
          />
        </Stack>

        {/* Actions */}
        <Stack direction="row" spacing={1} sx={{ mt: 'auto' }}>
          {onView && (
            <Tooltip title={t('ai-route-generation.actions.view')}>
              <IconButton size="small" onClick={onView}>
                <Iconify icon="solar:eye-bold" width={18} />
              </IconButton>
            </Tooltip>
          )}
          {onEdit && (
            <Tooltip title={t('ai-route-generation.actions.edit')}>
              <IconButton size="small" onClick={onEdit}>
                <Iconify icon="solar:pen-bold" width={18} />
              </IconButton>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title={t('ai-route-generation.actions.delete')}>
              <IconButton size="small" color="error" onClick={onDelete}>
                <Iconify icon="solar:trash-bin-trash-bold" width={18} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
