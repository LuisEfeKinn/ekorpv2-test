import type { IProject } from 'src/types/project-management';

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

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type ChipColor = 'default' | 'info' | 'warning' | 'success' | 'error';

const PROJECT_STATUS_COLOR: Record<string, ChipColor> = {
  '1': 'info',
  '2': 'warning',
  '3': 'success',
  '4': 'default',
};

const PROJECT_IMPORTANCE_COLOR: Record<string, ChipColor> = {
  '1': 'default',
  '2': 'info',
  '3': 'warning',
  '4': 'error',
};

const getClientInitials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();

// ----------------------------------------------------------------------

type Props = {
  project: IProject;
  onEdit: () => void;
  onDelete: () => void;
  onViewDetail: () => void;
};

export function ProjectsCard({ project, onEdit, onDelete, onViewDetail }: Props) {
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
        <Stack sx={{ flex: 1, p: 2.5, gap: 2 }}>
          {/* Header */}
          <Stack direction="row" alignItems="flex-start" spacing={1.5}>
            <Avatar sx={{ width: 44, height: 44, flexShrink: 0 }}>
              {getClientInitials(project.clientName)}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap title={project.name}>
                {project.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }} noWrap>
                {project.clientName}
              </Typography>
            </Box>

            <IconButton size="small" onClick={menuActions.onOpen} sx={{ flexShrink: 0, mt: -0.25 }}>
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Stack>

          {/* Chips */}
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            <Chip
              label={project.statusName}
              size="small"
              variant="soft"
              color={PROJECT_STATUS_COLOR[project.statusId] ?? 'default'}
            />
            <Chip
              label={project.importanceLevelName}
              size="small"
              variant="soft"
              color={PROJECT_IMPORTANCE_COLOR[project.importanceLevelId] ?? 'default'}
            />
            {project.generatesIncome && (
              <Chip
                icon={<Iconify icon="solar:wad-of-money-bold" width={13} />}
                label={t('projects.card.generatesIncome')}
                size="small"
                variant="soft"
                color="success"
              />
            )}
          </Stack>

          {/* Metadata */}
          <Stack spacing={0.6}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Iconify icon="solar:calendar-date-bold" width={14} sx={{ color: 'text.disabled', flexShrink: 0 }} />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {fDate(project.startDate)} — {fDate(project.endDate)}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Iconify icon="solar:tag-horizontal-bold-duotone" width={14} sx={{ color: 'text.disabled', flexShrink: 0 }} />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {project.sizeName} · {project.complexityName}
              </Typography>
            </Stack>

            {/* PENDIENTE: progreso de tareas — requiere taskCount y taskCompletedCount en el listado */}
            {/* PENDIENTE: avatares del equipo — requiere team members en el listado */}
          </Stack>
        </Stack>

        <Divider />

        <Box sx={{ px: 2.5, py: 1.5 }}>
          <Button
            fullWidth
            size="small"
            variant="soft"
            color="primary"
            onClick={onViewDetail}
            endIcon={<Iconify icon="solar:forward-bold" width={16} />}
          >
            {t('projects.actions.viewDetail')}
          </Button>
        </Box>
      </Card>

      <CustomPopover
        open={menuActions.open}
        anchorEl={menuActions.anchorEl}
        onClose={menuActions.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem onClick={() => { onEdit(); menuActions.onClose(); }}>
            <Iconify icon="solar:pen-bold" />
            {t('projects.actions.edit')}
          </MenuItem>
          <MenuItem
            onClick={() => { confirmDialog.onTrue(); menuActions.onClose(); }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            {t('projects.actions.delete')}
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirmDialog.value}
        onClose={confirmDialog.onFalse}
        title={t('projects.dialogs.delete.title')}
        content={t('projects.dialogs.delete.content', { name: project.name })}
        action={
          <Button variant="contained" color="error" onClick={onDelete}>
            {t('projects.actions.delete')}
          </Button>
        }
      />
    </>
  );
}
