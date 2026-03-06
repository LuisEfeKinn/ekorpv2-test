'use client';

import type { IConfigureEvaluation } from 'src/types/performance';
import type { IconifyName } from 'src/components/iconify/register-icons';

import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import LinearProgress from '@mui/material/LinearProgress';

import { fDate } from 'src/utils/format-time';
import { fNumber } from 'src/utils/format-number';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';


// ----------------------------------------------------------------------

type TypeColor = 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';

type TypeConfigEntry = {
  color: TypeColor;
  icon: IconifyName;
};

const TYPE_CONFIG: Record<string, TypeConfigEntry> = {
  PERFORMANCE_90: { color: 'primary', icon: 'solar:chart-2-bold-duotone' },
  PERFORMANCE_180: { color: 'info', icon: 'solar:graph-up-bold-duotone' },
  PERFORMANCE_270: { color: 'warning', icon: 'solar:chart-square-bold-duotone' },
  PERFORMANCE_360: { color: 'secondary', icon: 'solar:radar-bold-duotone' },
  CLIMA_LABORAL: { color: 'success', icon: 'solar:cloud-sun-2-bold-duotone' },
  OBJECTIVES: { color: 'secondary', icon: 'solar:target-bold-duotone' },
};

const STATUS_COLOR: Record<string, 'success' | 'warning' | 'info' | 'error' | 'default'> = {
  ACTIVE: 'success',
  DRAFT: 'warning',
  COMPLETED: 'info',
  CANCELLED: 'error',
};

// ----------------------------------------------------------------------

type Props = {
  row: IConfigureEvaluation;
  onEditRow: () => void;
  onLaunchRow: () => void;
  onDeleteRow: () => void | Promise<void>;
  onCancelRow: () => void | Promise<void>;
};

export function ConfigureEvaluationsCard({ row, onEditRow, onLaunchRow, onDeleteRow, onCancelRow }: Props) {
  const theme = useTheme();
  const { t } = useTranslate('performance');
  const confirm = useBoolean();
  const cancelConfirm = useBoolean();
  const popover = usePopover();

  const typeConfig: TypeConfigEntry = TYPE_CONFIG[row.type] ?? {
    color: 'primary',
    icon: 'solar:chart-bold',
  };
  const statusColor = STATUS_COLOR[row.status] ?? 'default';

  const progress = {
    answered: row.progress?.completedAssignments ?? 0,
    total: row.progress?.totalAssignments ?? 0,
    pct: row.progress?.percent ?? 0,
  };

  const handleConfirmDelete = async () => {
    try {
      await Promise.resolve(onDeleteRow());
    } finally {
      confirm.onFalse();
    }
  };

  const handleConfirmCancel = async () => {
    try {
      await Promise.resolve(onCancelRow());
    } finally {
      cancelConfirm.onFalse();
    }
  };

  const statItems = [
    {
      icon: 'solar:star-bold-duotone',
      label: t('configure-evaluations.table.columns.totalCompetences'),
      value: row.totalCompetences,
      color: 'primary' as TypeColor,
    },
    {
      icon: 'solar:target-bold-duotone',
      label: t('configure-evaluations.table.columns.totalObjectives'),
      value: row.totalObjectives,
      color: 'warning' as TypeColor,
    },
    {
      icon: 'solar:users-group-rounded-bold',
      label: t('configure-evaluations.table.columns.totalEmployees'),
      value: row.totalEmployees,
      color: 'info' as TypeColor,
    },
    {
      icon: 'solar:buildings-2-bold',
      label: t('configure-evaluations.table.columns.totalDepartments'),
      value: row.totalDepartments,
      color: 'success' as TypeColor,
    },
    {
      icon: 'solar:bag-bold',
      label: t('configure-evaluations.table.columns.totalPositions'),
      value: row.totalPositions,
      color: 'secondary' as TypeColor,
    },
  ];

  return (
    <>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          boxShadow: `0 4px 16px ${alpha(theme.palette.grey[900], 0.12)}, 0 1px 4px ${alpha(theme.palette.grey[900], 0.08)}`,
          transition: theme.transitions.create(['box-shadow', 'transform'], {
            duration: theme.transitions.duration.shorter,
          }),
          '&:hover': {
            boxShadow: `0 12px 32px ${alpha(theme.palette.grey[900], 0.2)}, 0 4px 12px ${alpha(theme.palette.grey[900], 0.12)}`,
            transform: 'translateY(-3px)',
          },
        }}
      >
        {/* ── Header ── */}
        <Box sx={{ p: 2.5, pb: 1.5 }}>
          <Stack
            direction="row"
            alignItems="flex-start"
            justifyContent="space-between"
            spacing={1}
          >
            {/* Badges */}
            <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ flex: 1 }}>
              <Label
                variant="soft"
                color={typeConfig.color}
                startIcon={<Iconify icon={typeConfig.icon} width={13} />}
                sx={{ fontSize: '0.68rem' }}
              >
                {t(`configure-evaluations.types.${row.type}`)}
              </Label>

              <Label variant="soft" color={statusColor} sx={{ fontSize: '0.68rem' }}>
                {t(`configure-evaluations.statuses.${row.status}`)}
              </Label>

            </Stack>

            {/* Actions trigger */}
            <IconButton
              size="small"
              color={popover.open ? 'primary' : 'default'}
              onClick={popover.onOpen}
              sx={{ flexShrink: 0, mt: -0.25 }}
            >
              <Iconify icon="eva:more-vertical-fill" width={18} />
            </IconButton>
          </Stack>

          {/* Title */}
          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={{
              mt: 1.5,
              mb: 0.5,
              lineHeight: 1.3,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {row.name}
          </Typography>

          {/* Description */}
          <Tooltip title={row.description} placement="top">
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                minHeight: 40,
                lineHeight: 1.57,
              }}
            >
              {row.description || '—'}
            </Typography>
          </Tooltip>
        </Box>

        <Divider sx={{ borderStyle: 'dashed' }} />

        {/* ── Date range ── */}
        <Box sx={{ px: 2.5, pt: 1.5, pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Iconify
              icon="solar:calendar-date-bold"
              width={15}
              sx={{ color: 'text.disabled', flexShrink: 0 }}
            />
            <Typography variant="caption" color="text.secondary">
              {fDate(row.startDate, 'DD MMM YYYY')}
              {' — '}
              {fDate(row.endDate, 'DD MMM YYYY')}
            </Typography>
          </Stack>
        </Box>

        {/* ── Progress ── */}
        <Box sx={{ px: 2.5, pb: 2 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 0.75 }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {t('configure-evaluations.card.responses')}
            </Typography>

            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography variant="caption" fontWeight={700} color="text.primary">
                {fNumber(progress.answered)}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                /
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {fNumber(progress.total)}
              </Typography>
              <Label
                variant="soft"
                color={statusColor}
                sx={{ fontSize: '0.63rem', height: 18, px: 0.75 }}
              >
                {progress.pct}%
              </Label>
            </Stack>
          </Stack>

          <LinearProgress
            variant="determinate"
            value={progress.pct}
            color="primary"
            sx={{
              height: 6,
              borderRadius: 1,
              bgcolor: alpha(theme.palette.primary.main, 0.12),
            }}
          />
        </Box>

        <Divider sx={{ borderStyle: 'dashed' }} />

        {/* ── Stats row ── */}
        <Box sx={{ px: 2, py: 1.5, mt: 'auto' }}>
          <Stack direction="row" flexWrap="wrap" gap={0.75}>
            {statItems.map((item) => (
              <Tooltip key={item.label} title={item.label} placement="top">
                <Stack
                  component="span"
                  direction="row"
                  alignItems="center"
                  spacing={0.5}
                  sx={{
                    px: 1,
                    py: 0.4,
                    borderRadius: 0.75,
                    bgcolor: alpha(theme.palette[item.color].main, 0.08),
                    cursor: 'default',
                  }}
                >
                  <Iconify
                    icon={item.icon as any}
                    width={14}
                    sx={{ color: `${item.color}.main`, flexShrink: 0 }}
                  />
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    sx={{ color: `${item.color}.dark`, lineHeight: 1 }}
                  >
                    {item.value}
                  </Typography>
                </Stack>
              </Tooltip>
            ))}
          </Stack>
        </Box>
      </Card>

      {/* ── Popover actions ── */}
      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          {/* Ver / Editar — siempre visible */}
          <MenuItem
            onClick={() => {
              onEditRow();
              popover.onClose();
            }}
          >
            <Iconify icon={row.status === 'DRAFT' ? 'solar:pen-bold' : 'solar:eye-bold'} />
            {row.status === 'DRAFT'
              ? t('configure-evaluations.actions.edit')
              : t('configure-evaluations.actions.view')}
          </MenuItem>

          {/* Lanzar — solo DRAFT */}
          {row.status === 'DRAFT' && (
            <MenuItem
              onClick={() => {
                onLaunchRow();
                popover.onClose();
              }}
            >
              <Iconify icon="solar:flag-bold" />
              {t('configure-evaluations.actions.launch')}
            </MenuItem>
          )}

          {/* Cancelar — DRAFT y ACTIVE */}
          {(row.status === 'DRAFT' || row.status === 'ACTIVE') && (
            <MenuItem
              onClick={() => {
                cancelConfirm.onTrue();
                popover.onClose();
              }}
              sx={{ color: 'warning.main' }}
            >
              <Iconify icon="solar:close-circle-bold" />
              {t('configure-evaluations.actions.cancel')}
            </MenuItem>
          )}

          {/* Eliminar — DRAFT y CANCELLED */}
          {(row.status === 'DRAFT' || row.status === 'CANCELLED') && (
            <MenuItem
              onClick={() => {
                confirm.onTrue();
                popover.onClose();
              }}
              sx={{ color: 'error.main' }}
            >
              <Iconify icon="solar:trash-bin-trash-bold" />
              {t('configure-evaluations.actions.delete')}
            </MenuItem>
          )}
        </MenuList>
      </CustomPopover>

      {/* ── Confirm delete ── */}
      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title={t('configure-evaluations.dialogs.delete.title')}
        content={t('configure-evaluations.dialogs.delete.content')}
        action={
          <Button variant="contained" color="error" onClick={() => void handleConfirmDelete()}>
            {t('configure-evaluations.actions.delete')}
          </Button>
        }
      />

      {/* ── Confirm cancel ── */}
      <ConfirmDialog
        open={cancelConfirm.value}
        onClose={cancelConfirm.onFalse}
        title={t('configure-evaluations.dialogs.cancel.title')}
        content={t('configure-evaluations.dialogs.cancel.content')}
        action={
          <Button variant="contained" color="warning" onClick={() => void handleConfirmCancel()}>
            {t('configure-evaluations.actions.cancel')}
          </Button>
        }
      />
    </>
  );
}
