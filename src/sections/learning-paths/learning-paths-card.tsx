import type { CardProps } from '@mui/material/Card';
import type { ILearningPath } from 'src/types/learning';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = CardProps & {
  row: ILearningPath;
  onEdit: () => void;
  onDelete: () => void;
  onViewDetails?: () => void;
};

export function LearningPathCard({ row, onEdit, onDelete, onViewDetails, sx, ...other }: Props) {
  const { t } = useTranslate('learning');

  // Validar datos de manera segura
  const safeData = {
    id: row?.id || '',
    name: row?.name || t('learning-paths.card.noName'),
    description: row?.description || t('learning-paths.card.noDescription'),
    positionName: row?.positionName || t('learning-paths.card.noPosition'),
    bannerUrl: row?.bannerUrl || null,
    isActive: row?.isActive ?? true,
    modulesCount: row?.moduleCount || 0,
    coursesCount: row?.courseCount || 0,
    // Calculamos duración basada en el campo duration de cada objeto (asumiendo formato "X hrs")
    totalDuration: row?.modules?.reduce((acc, module) => {
      const moduleDuration = module.learningObjects?.reduce((sum, obj) => {
        if (obj.duration) {
          const match = obj.duration.match(/(\d+)/);
          return sum + (match ? parseInt(match[1], 10) : 0);
        }
        return sum;
      }, 0) || 0;
      return acc + moduleDuration;
    }, 0) || 0,
  };

  // Extraer iniciales del nombre
  const getInitials = (name: string) => {
    const words = name.trim().split(' ').filter(word => word.length > 0);
    if (words.length === 0) return '??';
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  // Obtener color basado en el nombre
  const getAvatarColor = (name: string): 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' => {
    const colors: Array<'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error'> =
      ['primary', 'secondary', 'info', 'success', 'warning', 'error'];
    const charCode = name.charCodeAt(0) || 0;
    return colors[charCode % colors.length];
  };

  // Obtener colores de gradiente basados en el avatarColor
  const getGradientColors = (color: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error') => {
    const colorMap = {
      primary: { from: '#1976d2', to: '#42a5f5' },
      secondary: { from: '#9c27b0', to: '#ba68c8' },
      info: { from: '#0288d1', to: '#29b6f6' },
      success: { from: '#2e7d32', to: '#66bb6a' },
      warning: { from: '#ed6c02', to: '#ffa726' },
      error: { from: '#d32f2f', to: '#ef5350' },
    };
    return colorMap[color];
  };

  const avatarColor = getAvatarColor(safeData.name);
  const initials = getInitials(safeData.name);
  const gradientColors = getGradientColors(avatarColor);

  const renderActions = (
    <Stack
      direction="row"
      spacing={0.5}
      sx={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
      }}
    >
      <Tooltip title={t('learning-paths.actions.edit')} arrow>
        <IconButton
          size="small"
          onClick={onEdit}
          sx={{
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.9),
            backdropFilter: 'blur(8px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            '&:hover': {
              bgcolor: (theme) => alpha(theme.palette.background.paper, 1),
            },
          }}
        >
          <Iconify icon="solar:pen-bold" width={18} />
        </IconButton>
      </Tooltip>

      <Tooltip title={t('learning-paths.actions.delete')} arrow>
        <IconButton
          size="small"
          onClick={onDelete}
          sx={{
            bgcolor: (theme) => alpha(theme.palette.error.main, 0.9),
            backdropFilter: 'blur(8px)',
            color: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            '&:hover': {
              bgcolor: (theme) => alpha(theme.palette.error.main, 1),
            },
          }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" width={18} />
        </IconButton>
      </Tooltip>
    </Stack>
  );

  const renderBadge = (
    <Chip
      label={t('learning-paths.card.badge')}
      size="small"
      sx={{
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 10,
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        fontWeight: 'bold',
        fontSize: '0.625rem',
        height: 24,
        borderRadius: 0.75,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        '& .MuiChip-label': {
          px: 1.5,
        },
      }}
    />
  );

  const renderBanner = (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: 200,
        overflow: 'visible',
        borderRadius: '16px 16px 0 0',
      }}
    >
      {safeData.bannerUrl ? (
        <Box
          component="img"
          src={safeData.bannerUrl}
          alt={safeData.name}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          onError={(e: any) => {
            // Si la imagen falla al cargar, mostrar gradiente
            e.target.style.display = 'none';
            e.target.parentElement.style.background = `linear-gradient(135deg, ${alpha(gradientColors.from, 0.9)} 0%, ${alpha(gradientColors.to, 0.7)} 100%)`;
          }}
        />
      ) : (
        // Gradiente bonito cuando no hay banner
        <Box
          sx={{
            width: '100%',
            height: '100%',
            background: `linear-gradient(135deg, ${alpha(gradientColors.from, 0.9)} 0%, ${alpha(gradientColors.to, 0.7)} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '-50%',
              right: '-20%',
              width: '150%',
              height: '150%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
            },
          }}
        >
          <Iconify
            icon="solar:flag-bold"
            width={80}
            sx={{
              color: 'white',
              opacity: 0.4,
              zIndex: 1,
            }}
          />
        </Box>
      )}

      {/* Avatar con iniciales superpuesto al banner */}
      <Box sx={{ position: 'absolute', bottom: -28, left: 20, zIndex: 2 }}>
        <Avatar
          sx={{
            width: 56,
            height: 56,
            bgcolor: (theme) => alpha(theme.palette[avatarColor].main, 0.95),
            color: `${avatarColor}.contrastText`,
            fontSize: '1.25rem',
            fontWeight: 'bold',
            border: (theme) => `3px solid ${theme.palette.background.paper}`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {initials}
        </Avatar>

        {/* Badge con número de módulos */}
        {safeData.modulesCount > 0 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              bgcolor: `${avatarColor}.main`,
              color: `${avatarColor}.contrastText`,
              minWidth: 24,
              height: 24,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              border: (theme) => `2px solid ${theme.palette.background.paper}`,
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            }}
          >
            {safeData.modulesCount}
          </Box>
        )}
      </Box>
    </Box>
  );

  const renderContent = (
    <Stack spacing={2} sx={{ p: 2.5, pt: 4.5 }}>
      {/* Título */}
      <Typography
        variant="h6"
        sx={{
          minHeight: 48,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          fontWeight: 'bold',
        }}
      >
        {safeData.name}
      </Typography>

      {/* Descripción */}
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          minHeight: 60,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {safeData.description}
      </Typography>

      <Divider sx={{ borderStyle: 'dashed' }} />

      {/* Información inferior */}
      <Stack spacing={1.5}>
        {/* Duración */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: 1.5,
            py: 1,
            bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
            borderRadius: 1,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify
              icon="solar:clock-circle-bold"
              width={20}
              sx={{ color: 'text.secondary' }}
            />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('learning-paths.card.duration')}:
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {safeData.totalDuration} {t('learning-paths.card.hours')}
          </Typography>
        </Stack>

        {/* Cursos */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: 1.5,
            py: 1,
            bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
            borderRadius: 1,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify
              icon="solar:list-bold"
              width={20}
              sx={{ color: 'text.secondary' }}
            />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('learning-paths.card.modules')}:
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {safeData.modulesCount}
          </Typography>

          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify
              icon="solar:list-bold"
              width={20}
              sx={{ color: 'text.secondary' }}
            />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('learning-paths.card.courses')}:
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {safeData.coursesCount}
          </Typography>
        </Stack>
      </Stack>
    </Stack>
  );

  const renderFooter = onViewDetails ? (
    <Box
      sx={{
        p: 2,
        display: 'flex',
        justifyContent: 'flex-end',
        borderTop: (theme) => `solid 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.12)}`,
      }}
    >
      <Tooltip title={t('learning-paths.card.viewDetails')} arrow>
        <IconButton
          size="small"
          color="primary"
          onClick={onViewDetails}
          sx={{
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
            '&:hover': {
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.16),
            },
          }}
        >
          <Iconify icon="eva:arrow-forward-fill" width={20} />
        </IconButton>
      </Tooltip>
    </Box>
  ) : null;

  return (
    <Card
      sx={{
        position: 'relative',
        boxShadow: '0 0 2px 0 rgba(145, 158, 171, 0.2), 0 12px 24px -4px rgba(145, 158, 171, 0.12)',
        border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
        borderRadius: 2,
        transition: (theme) =>
          theme.transitions.create(['box-shadow', 'transform', 'border-color'], {
            duration: theme.transitions.duration.standard,
          }),
        '&:hover': {
          boxShadow: '0 0 2px 0 rgba(145, 158, 171, 0.24), 0 20px 40px -4px rgba(145, 158, 171, 0.24)',
          transform: 'translateY(-8px)',
          borderColor: (theme) => alpha(theme.palette.primary.main, 0.24),
        },
        ...sx,
      }}
      {...other}
    >
      {renderBadge}
      {renderActions}
      {renderBanner}
      {renderContent}
      {renderFooter}
    </Card>
  );
}
