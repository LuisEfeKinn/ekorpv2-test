'use client';

import type { IConfigureEvaluation } from 'src/types/performance';

import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { Tooltip } from '@mui/material';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { alpha, useTheme } from '@mui/material/styles';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  evaluation: IConfigureEvaluation;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCloseCampaign: () => void;
  onViewHistory: () => void;
};

export function EvaluationCard({
  evaluation,
  onView,
  onEdit,
  onDelete,
  onCloseCampaign,
  onViewHistory,
}: Props) {
  const theme = useTheme();
  const { t } = useTranslate('performance');
  const confirmDelete = useBoolean();
  const confirmClose = useBoolean();
  const popover = usePopover();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'COMPLETED':
        return 'info';
      case 'DRAFT':
        return 'warning';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTypeColor = (type: string): 'primary' | 'secondary' | 'info' | 'success' | 'warning' => {
    switch (type) {
      case 'PERFORMANCE_360':
        return 'primary';
      case 'PERFORMANCE_270':
        return 'secondary';
      case 'PERFORMANCE_180':
        return 'info';
      case 'PERFORMANCE_90':
        return 'success';
      case 'OBJECTIVES':
        return 'warning';
      default:
        return 'primary';
    }
  };

  const translateType = (type: string) => {
    const translationKey = `nine-box.types.${type}`;
    return t(translationKey);
  };

  const translateStatus = (status: string) => {
    const translationKey = `nine-box.statuses.${status}`;
    return t(translationKey);
  };

  const isActive = evaluation.status === 'ACTIVE';
  const canClose = isActive && (evaluation.totalEmployees > 0 || evaluation.totalObjectives > 0 || evaluation.totalCompetences > 0);

  return (
    <>
      <Card
        sx={{
          height: '100%',
          minHeight: 520,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: theme.shadows[12],
            transform: 'translateY(-4px)',
          },
        }}
      >
        {/* Header con gradiente */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${alpha(theme.palette[getTypeColor(evaluation.type)].main, 0.08)} 0%, ${alpha(theme.palette[getTypeColor(evaluation.type)].main, 0.02)} 100%)`,
            p: 3,
            pb: 2,
            borderBottom: `3px solid ${theme.palette[getTypeColor(evaluation.type)].main}`,
            position: 'relative',
          }}
        >
          {/* Botón de menú */}
          <IconButton
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
            }}
            color={popover.open ? 'inherit' : 'default'}
            onClick={popover.onOpen}
          >
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>

          {/* Nombre y descripción */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              mb: 0.5,
              pr: 5,
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {evaluation.name}
          </Typography>

          <Tooltip title={evaluation.description || ''} placement="top" arrow>
            <Box
              sx={{
                mb: 2,
                minHeight: 40,
                cursor: evaluation.description ? 'help' : 'default',
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  wordBreak: 'break-word',
                }}
              >
                {evaluation.description || '\u00A0'}
              </Typography>
            </Box>
          </Tooltip>

          {/* Tipo y Estado */}
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Label variant="soft" color={getTypeColor(evaluation.type)}>
              {translateType(evaluation.type)}
            </Label>
            <Label variant="soft" color={getStatusColor(evaluation.status)}>
              {translateStatus(evaluation.status)}
            </Label>
            <Chip
              label={evaluation.period}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            />
          </Stack>
        </Box>

        {/* Fechas */}
        <Box sx={{ px: 3, py: 2, bgcolor: alpha(theme.palette.grey[500], 0.04) }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Stack spacing={0.5} flex={1}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {t('nine-box.table.columns.startDate')}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Iconify icon="solar:calendar-date-bold" width={16} color="text.secondary" />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {fDate(evaluation.startDate)}
                </Typography>
              </Stack>
            </Stack>

            <Iconify icon="eva:arrow-forward-fill" width={20} color="text.disabled" />

            <Stack spacing={0.5} flex={1} alignItems="flex-end">
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {t('nine-box.table.columns.endDate')}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Iconify icon="solar:calendar-date-bold" width={16} color="text.secondary" />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {fDate(evaluation.endDate)}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        </Box>

        <Divider />

        {/* Estadísticas */}
        <Box sx={{ p: 2.5, flex: 1 }}>
          <Stack spacing={1.5}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Iconify icon="solar:users-group-rounded-bold" width={18} color="primary.main" />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
                  {t('nine-box.table.columns.totalEmployees')}
                </Typography>
              </Stack>
              <Chip
                label={evaluation.totalEmployees}
                size="small"
                color="primary"
                sx={{ fontWeight: 700, minWidth: 48 }}
              />
            </Stack>

            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.info.main, 0.08),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Iconify icon="solar:medal-star-bold" width={18} color="info.main" />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
                  {t('nine-box.table.columns.totalCompetences')}
                </Typography>
              </Stack>
              <Chip
                label={evaluation.totalCompetences}
                size="small"
                color="info"
                sx={{ fontWeight: 700, minWidth: 48 }}
              />
            </Stack>

            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.warning.main, 0.08),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Iconify icon="solar:list-bold" width={18} color="warning.main" />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
                  {t('nine-box.table.columns.totalObjectives')}
                </Typography>
              </Stack>
              <Chip
                label={evaluation.totalObjectives}
                size="small"
                color="warning"
                sx={{ fontWeight: 700, minWidth: 48 }}
              />
            </Stack>
          </Stack>
        </Box>

        <Divider />

        {/* Acciones */}
        <Stack direction="row" spacing={1} sx={{ p: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:eye-bold" />}
            onClick={onView}
            sx={{ fontWeight: 600 }}
          >
            {t('nine-box.actions.view')}
          </Button>
          {canClose && (
            <Button
              fullWidth
              variant="contained"
              color="error"
              startIcon={<Iconify icon="solar:close-circle-bold" />}
              onClick={confirmClose.onTrue}
              sx={{ fontWeight: 600 }}
            >
              {t('nine-box.actions.closeCampaign')}
            </Button>
          )}
        </Stack>
      </Card>

      {/* Popover de acciones */}
      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              onView();
              popover.onClose();
            }}
          >
            <Iconify icon="solar:eye-bold" />
            {t('nine-box.actions.view')}
          </MenuItem>

          <MenuItem
            onClick={() => {
              onViewHistory();
              popover.onClose();
            }}
          >
            <Iconify icon="solar:history-bold" />
            {t('nine-box.actions.viewHistory')}
          </MenuItem>

          <Divider sx={{ borderStyle: 'dashed' }} />

          {canClose && (
            <MenuItem
              onClick={() => {
                confirmClose.onTrue();
                popover.onClose();
              }}
              sx={{ color: 'warning.main' }}
            >
              <Iconify icon="solar:close-circle-bold" />
              {t('nine-box.actions.closeCampaign')}
            </MenuItem>
          )}

          <MenuItem
            onClick={() => {
              confirmDelete.onTrue();
              popover.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            {t('nine-box.actions.delete')}
          </MenuItem>
        </MenuList>
      </CustomPopover>

      {/* Dialog de confirmación - Eliminar */}
      <ConfirmDialog
        open={confirmDelete.value}
        onClose={confirmDelete.onFalse}
        title={t('nine-box.dialogs.delete.title')}
        content={t('nine-box.dialogs.delete.content')}
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              onDelete();
              confirmDelete.onFalse();
            }}
          >
            {t('nine-box.actions.delete')}
          </Button>
        }
      />

      {/* Dialog de confirmación - Cerrar campaña */}
      <ConfirmDialog
        open={confirmClose.value}
        onClose={confirmClose.onFalse}
        title={t('nine-box.actions.closeCampaign')}
        content={
          <Stack spacing={2}>
            <Typography>
              {t('nine-box.dialogs.closeCampaign.content', { name: evaluation.name })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('nine-box.dialogs.closeCampaign.warning')}
            </Typography>
          </Stack>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              onCloseCampaign();
              confirmClose.onFalse();
            }}
          >
            {t('nine-box.actions.closeCampaign')}
          </Button>
        }
      />
    </>
  );
}
