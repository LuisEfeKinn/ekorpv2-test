'use client';

import type { IAssignment } from 'src/types/project-management';

import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { fDate } from 'src/utils/format-time';
import { stringToAvatarColor } from 'src/utils/avatar-color';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type ChipColor = 'default' | 'info' | 'warning' | 'success' | 'error';

const ASSIGNMENT_STATUS_COLOR: Record<string, ChipColor> = {
  '1': 'success',
  '2': 'warning',
  '3': 'error',
};

const ASSIGNMENT_PRIORITY_COLOR: Record<string, ChipColor> = {
  '1': 'default',
  '2': 'info',
  '3': 'warning',
  '4': 'error',
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();

// ----------------------------------------------------------------------

type Props = {
  assignment: IAssignment;
  onEdit: () => void;
  onUnassign: () => void;
  readOnly?: boolean;
};

export function AssignmentCard({ assignment, onEdit, onUnassign, readOnly = false }: Props) {
  const { t } = useTranslate('project-management');
  const menuActions = usePopover();
  const confirmDialog = useBoolean();

  return (
    <>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          '&:hover': { boxShadow: (theme) => theme.customShadows?.z8 ?? theme.shadows[4] },
          transition: 'box-shadow 0.2s',
        }}
      >
        <Stack sx={{ flex: 1, p: 2.5, gap: 1.5 }}>
          {/* Header */}
          <Stack direction="row" alignItems="flex-start" spacing={1.5}>
            <Avatar sx={{ width: 44, height: 44, flexShrink: 0, color: '#fff', bgcolor: stringToAvatarColor(String(assignment.employeeId)) }}>
              {getInitials(assignment.employeeFullName)}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap title={assignment.employeeFullName}>
                {assignment.employeeFullName}
              </Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                <Chip
                  label={assignment.statusName}
                  size="small"
                  variant="soft"
                  color={ASSIGNMENT_STATUS_COLOR[assignment.statusId] ?? 'default'}
                />
                <Chip
                  label={assignment.priorityName}
                  size="small"
                  variant="soft"
                  color={ASSIGNMENT_PRIORITY_COLOR[assignment.priorityId] ?? 'default'}
                />
              </Stack>
            </Box>

            {!readOnly && (
              <IconButton size="small" onClick={menuActions.onOpen} sx={{ flexShrink: 0, mt: -0.25 }}>
                <Iconify icon="eva:more-vertical-fill" />
              </IconButton>
            )}
          </Stack>

          {/* Dedication */}
          <Stack direction="row" spacing={1} alignItems="center">
            <Iconify icon="solar:pie-chart-bold-duotone" width={14} sx={{ color: 'text.disabled', flexShrink: 0 }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('detail.summary.fields.dedication')}: <strong>{assignment.dedicacion}%</strong>
            </Typography>
          </Stack>

          {/* Roles */}
          {assignment.roles.length > 0 && (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {assignment.roles.slice(0, 2).map((role) => (
                <Chip
                  key={role.id}
                  label={role.name}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: 11, height: 22 }}
                />
              ))}
              {assignment.roles.length > 2 && (
                <Chip
                  label={`+${assignment.roles.length - 2}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: 11, height: 22 }}
                />
              )}
            </Stack>
          )}

          {/* Dates */}
          <Stack direction="row" spacing={1} alignItems="center">
            <Iconify icon="solar:calendar-date-bold" width={14} sx={{ color: 'text.disabled', flexShrink: 0 }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {fDate(assignment.startDate)} — {fDate(assignment.endDate)}
            </Typography>
          </Stack>
        </Stack>

        <Divider />

        {!readOnly && (
          <Box sx={{ px: 2.5, py: 1.5 }}>
            <Button
              fullWidth
              size="small"
              variant="soft"
              color="error"
              onClick={confirmDialog.onTrue}
              startIcon={<Iconify icon="solar:user-minus-bold-duotone" width={16} />}
            >
              {t('detail.team.card.unassign')}
            </Button>
          </Box>
        )}
      </Card>

      {!readOnly && (
        <>
          <CustomPopover
            open={menuActions.open}
            anchorEl={menuActions.anchorEl}
            onClose={menuActions.onClose}
            slotProps={{ arrow: { placement: 'right-top' } }}
          >
            <MenuList>
              <MenuItem onClick={() => { onEdit(); menuActions.onClose(); }}>
                <Iconify icon="solar:pen-bold" />
                {t('detail.team.card.edit')}
              </MenuItem>
              <MenuItem
                onClick={() => { confirmDialog.onTrue(); menuActions.onClose(); }}
                sx={{ color: 'error.main' }}
              >
                <Iconify icon="solar:user-minus-bold-duotone" />
                {t('detail.team.card.unassign')}
              </MenuItem>
            </MenuList>
          </CustomPopover>

          <ConfirmDialog
            open={confirmDialog.value}
            onClose={confirmDialog.onFalse}
            title={t('detail.team.dialogs.unassign.title')}
            content={t('detail.team.dialogs.unassign.content', { name: assignment.employeeFullName })}
            action={
              <Button variant="contained" color="error" onClick={onUnassign}>
                {t('detail.team.card.unassign')}
              </Button>
            }
          />
        </>
      )}
    </>
  );
}
