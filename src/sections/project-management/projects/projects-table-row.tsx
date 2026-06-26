import type { IProject } from 'src/types/project-management';

import { useState } from 'react';
import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';

const getClientInitials = (name: string) =>
  name.split(' ').slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase();

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

// ----------------------------------------------------------------------

type Props = {
  row: IProject;
  onEdit: () => void;
  onDelete: () => void;
  onViewDetail: () => void;
};

export function ProjectsTableRow({ row, onEdit, onDelete, onViewDetail }: Props) {
  const { t } = useTranslate('project-management');
  const menuActions = usePopover();
  const confirmDialog = useBoolean();
  const [deleteInput, setDeleteInput] = useState('');

  const handleCloseConfirm = () => {
    confirmDialog.onFalse();
    setDeleteInput('');
  };

  return (
    <>
      <TableRow hover tabIndex={-1}>
        <TableCell>
          <IconButton
            color={menuActions.open ? 'inherit' : 'default'}
            onClick={menuActions.onOpen}
          >
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>

        <TableCell>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ width: 36, height: 36, flexShrink: 0 }}>
              {getClientInitials(row.clientName)}
            </Avatar>
            <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start', minWidth: 0 }}>
              <Box component="span" sx={{ color: 'text.primary', fontWeight: 'fontWeightMedium', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                {row.name}
              </Box>
              <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                {row.clientName}
              </Box>
            </Stack>
          </Stack>
        </TableCell>

        <TableCell>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            <Chip
              label={row.statusName}
              size="small"
              variant="soft"
              color={PROJECT_STATUS_COLOR[row.statusId] ?? 'default'}
            />
            {row.generatesIncome && (
              <Chip
                icon={<Iconify icon="solar:wad-of-money-bold" width={13} />}
                label={t('projects.card.generatesIncome')}
                size="small"
                variant="soft"
                color="success"
              />
            )}
          </Stack>
        </TableCell>

        <TableCell>
          <Chip
            label={row.importanceLevelName}
            size="small"
            variant="soft"
            color={PROJECT_IMPORTANCE_COLOR[row.importanceLevelId] ?? 'default'}
          />
        </TableCell>

        <TableCell>
          <Box component="span" sx={{ typography: 'body2' }}>
            {row.sizeName}
          </Box>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap', typography: 'body2', color: 'text.secondary' }}>
          {fDate(row.startDate)} — {fDate(row.endDate)}
        </TableCell>
      </TableRow>

      <CustomPopover
        open={menuActions.open}
        anchorEl={menuActions.anchorEl}
        onClose={menuActions.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem onClick={() => { onViewDetail(); menuActions.onClose(); }}>
            <Iconify icon="solar:eye-bold" />
            {t('projects.actions.viewDetail')}
          </MenuItem>
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
        onClose={handleCloseConfirm}
        title={t('projects.dialogs.delete.title')}
        content={
          <Stack spacing={2}>
            <Alert severity="error">{t('projects.dialogs.delete.warning')}</Alert>
            <Typography variant="body2">
              {t('projects.dialogs.delete.typeToConfirmPrefix')}{' '}
              <strong>&quot;{row.name}&quot;</strong>{' '}
              {t('projects.dialogs.delete.typeToConfirmSuffix')}
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder={row.name}
            />
          </Stack>
        }
        action={
          <Button
            variant="contained"
            color="error"
            disabled={deleteInput !== row.name}
            onClick={onDelete}
          >
            {t('projects.actions.delete')}
          </Button>
        }
      />
    </>
  );
}
