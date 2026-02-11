'use client';

// ----------------------------------------------------------------------
// AI Course Card Component
// ----------------------------------------------------------------------

import type { IAiCourse } from 'src/types/ai-course';

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
  row: IAiCourse;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
};

export function AiCourseCard({
  row,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
}: Props) {
  const { t } = useTranslate('ai-course');

  // Validate URL
  const isValidUrl = (url: string | undefined | null) => {
    if (!url) return false;
    if (url === 'string') return false;
    return url.startsWith('http://') || url.startsWith('https://');
  };

  const imageUrl = isValidUrl(row.bannerUrl) ? row.bannerUrl :
    isValidUrl(row.bannerUrl) ? row.bannerUrl : null;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'warning';
      case 'advanced':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'generating':
        return 'info';
      case 'completed':
        return 'success';
      case 'published':
        return 'primary';
      case 'archived':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return 'solar:file-text-bold';
      case 'generating':
        return 'solar:restart-bold';
      case 'completed':
        return 'solar:check-circle-bold';
      case 'published':
        return 'solar:verified-check-bold';
      case 'archived':
        return 'solar:inbox-bold';
      default:
        return 'solar:file-text-bold';
    }
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
        icon={<Iconify icon={getStatusIcon(row.status)} width={16} />}
        label={t(`status.${row.status}`)}
        color={getStatusColor(row.status) as any}
        size="small"
        sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 9,
          backdropFilter: 'blur(8px)',
          bgcolor: (theme) => {
            const statusColor = getStatusColor(row.status);
            const alpha = statusColor === 'default' ? 0.92 : 0.88;
            return varAlpha(theme.vars.palette.background.paperChannel, alpha);
          },
          boxShadow: (theme) => `0 4px 12px ${varAlpha(theme.vars.palette.grey['900Channel'], 0.24)}`,
          border: (theme) => `1px solid ${varAlpha(theme.vars.palette.grey['500Channel'], 0.16)}`,
          fontWeight: 600,
          '& .MuiChip-icon': {
            color: (theme) => {
              switch (row.status) {
                case 'draft':
                  return theme.vars.palette.warning.main;
                case 'published':
                  return theme.vars.palette.success.main;
                case 'generating':
                  return theme.vars.palette.info.main;
                case 'completed':
                  return theme.vars.palette.success.main;
                case 'archived':
                  return theme.vars.palette.text.disabled;
                default:
                  return theme.vars.palette.text.secondary;
              }
            },
          },
          '& .MuiChip-label': {
            color: (theme) => theme.vars.palette.text.primary,
          },
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
              icon="tabler:robot"
              width={64}
              sx={{ color: 'primary.main', opacity: 0.48 }}
            />
          </Box>
        )}
      </Box>

      {/* Content */}
      <CardContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          p: 2.5,
        }}
      >
        {/* Title */}
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
          {row.title}
        </Typography>

        {/* Description */}
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
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
          {row.difficulty && (
            <Chip
              label={t(`difficulty.${row.difficulty}`)}
              size="small"
              color={getDifficultyColor(row.difficulty) as any}
              variant="soft"
            />
          )}
          {row.duration && (
            <Chip
              icon={<Iconify icon="solar:clock-circle-bold" width={14} />}
              label={row.duration}
              size="small"
              variant="outlined"
            />
          )}
          {row.sections?.length > 0 && (
            <Chip
              icon={<Iconify icon="solar:list-bold" width={14} />}
              label={`${row.sections.length} ${t('sections')}`}
              size="small"
              variant="outlined"
            />
          )}
          {row?.sectionsCount > 0 && (
            <Chip
              icon={<Iconify icon="solar:list-bold" width={14} />}
              label={`${row.sectionsCount} ${t('sections')}`}
              size="small"
              variant="outlined"
            />
          )}
        </Stack>

        {/* AI Provider Badge */}
        {row.aiProvider && (
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 2 }}>
            <Iconify icon="tabler:robot" width={16} sx={{ color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {t(`provider.${row.aiProvider}`)}
            </Typography>
          </Stack>
        )}

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Actions */}
        <Stack
          direction="row"
          justifyContent="flex-end"
          spacing={0.5}
          sx={{
            pt: 2,
            borderTop: (theme) => `1px dashed ${varAlpha(theme.vars.palette.grey['500Channel'], 0.2)}`,
          }}
        >
          <Tooltip title={t('actions.view')}>
            <IconButton size="small" color="primary" onClick={onView}>
              <Iconify icon="solar:eye-bold" width={20} />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('actions.edit')}>
            <IconButton size="small" color="info" onClick={onEdit}>
              <Iconify icon="solar:pen-bold" width={20} />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('actions.delete')}>
            <IconButton size="small" color="error" onClick={onDelete}>
              <Iconify icon="solar:trash-bin-trash-bold" width={20} />
            </IconButton>
          </Tooltip>
        </Stack>
      </CardContent>
    </Card>
  );
}
