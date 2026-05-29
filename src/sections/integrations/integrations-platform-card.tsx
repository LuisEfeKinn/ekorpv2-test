import type { CardProps } from '@mui/material/Card';
import type { IIntegrationInstance } from 'src/types/settings';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = CardProps & {
  integration: IIntegrationInstance;
  onView?: (id: string) => void;
  onSync?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
};

export function IntegrationsPlatformCard({
  integration,
  onView,
  onSync,
  onEdit,
  onDelete,
  sx,
  ...other
}: Props) {
  const { t } = useTranslate('settings');
  const { id, instanceName, isActive, createdAt, integration: integrationData } = integration;

  const renderHeader = (
    <Box sx={{ position: 'relative', p: 3, pb: 2 }}>
      <Stack direction="row" alignItems="flex-start" spacing={2}>
        <Box
          sx={{
            width: 72,
            height: 72,
            flexShrink: 0,
            borderRadius: 2,
            overflow: 'hidden',
            border: (theme) => `solid 2px ${theme.vars.palette.background.paper}`,
            boxShadow: (theme) => theme.customShadows.z8,
            bgcolor: 'background.neutral',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 1,
          }}
        >
          <Box
            component="img"
            src={integrationData.image}
            alt={integrationData.name}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </Box>

        <Stack spacing={0.5} sx={{ flexGrow: 1, minWidth: 0 }}>
          <Tooltip title={instanceName} arrow placement="top">
            <Typography variant="h6" noWrap>
              {instanceName}
            </Typography>
          </Tooltip>

          <Stack 
            direction="row" 
            alignItems="center" 
            spacing={1}
            sx={{
              flexWrap: 'wrap',
              gap: 0.5,
            }}
          >
            <Chip
              size="small"
              label={integrationData.integrationTypeName || 'N/A'}
              color="primary"
              variant="soft"
              sx={{ height: 24 }}
            />

            <Label
              variant="soft"
              color={isActive ? 'success' : 'error'}
              sx={{ height: 24 }}
            >
              {isActive ? 'Activo' : 'Inactivo'}
            </Label>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );

  const renderContent = (
    <Stack spacing={2} sx={{ px: 3, pb: 3 }}>
      <Stack spacing={0.5}>
        <Typography variant="subtitle2" color="text.secondary" noWrap>
          {integrationData.name}
        </Typography>
        <Tooltip title={integrationData.description || 'Sin descripción disponible'} arrow>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              minHeight: { xs: 36, sm: 40 },
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontSize: { xs: '0.8125rem', sm: '0.875rem' },
            }}
          >
            {integrationData.description || 'Sin descripción disponible'}
          </Typography>
        </Tooltip>
      </Stack>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <Stack direction="row" alignItems="center" spacing={1}>
        <Iconify icon="solar:calendar-date-bold" width={16} sx={{ color: 'text.disabled', flexShrink: 0 }} />
        <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
          {fDate(createdAt)}
        </Typography>
      </Stack>
    </Stack>
  );

  const renderActions = (
    <Stack
      direction="row"
      spacing={0.5}
      sx={{
        px: 2,
        pb: 2,
        borderTop: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
        pt: 2,
        flexWrap: 'wrap',
        justifyContent: { xs: 'center', sm: 'flex-start' },
      }}
    >
      {onView && (
        <Tooltip title={t('integrations.actions.viewCategories')} arrow>
          <IconButton
            size="small"
            color="primary"
            onClick={() => onView(id)}
            sx={{
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
              '&:hover': {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.16),
              },
            }}
          >
            <Iconify icon="solar:eye-bold" />
          </IconButton>
        </Tooltip>
      )}

      {onSync && (
        <Tooltip title={t('integrations.actions.sync')} arrow>
          <IconButton
            size="small"
            color="info"
            onClick={() => onSync(id)}
            sx={{
              bgcolor: (theme) => alpha(theme.palette.info.main, 0.08),
              '&:hover': {
                bgcolor: (theme) => alpha(theme.palette.info.main, 0.16),
              },
            }}
          >
            <Iconify icon="solar:download-bold" />
          </IconButton>
        </Tooltip>
      )}

      <Box sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }} />

      {onEdit && (
        <Tooltip title={t('integrations.actions.edit')} arrow>
          <IconButton
            size="small"
            color="default"
            onClick={() => onEdit(id)}
            sx={{
              bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
              '&:hover': {
                bgcolor: (theme) => alpha(theme.palette.grey[500], 0.16),
              },
            }}
          >
            <Iconify icon="solar:pen-bold" />
          </IconButton>
        </Tooltip>
      )}

      {onDelete && (
        <Tooltip title={t('integrations.actions.delete')} arrow>
          <IconButton
            size="small"
            color="error"
            onClick={() => onDelete(id)}
            sx={{
              bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
              '&:hover': {
                bgcolor: (theme) => alpha(theme.palette.error.main, 0.16),
              },
            }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );

  return (
    <Card
      sx={{
        boxShadow: (theme) => theme.customShadows.z8,
        transition: (theme) =>
          theme.transitions.create(['box-shadow', 'transform'], {
            duration: theme.transitions.duration.standard,
          }),
        '&:hover': {
          boxShadow: (theme) => theme.customShadows.z24,
          transform: 'translateY(-4px)',
        },
        ...sx,
      }}
      {...other}
    >
      {renderHeader}
      {renderContent}
      {renderActions}
    </Card>
  );
}
