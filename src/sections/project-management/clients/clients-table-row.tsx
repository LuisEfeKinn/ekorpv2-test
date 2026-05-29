import type { IClient } from 'src/types/project-management';

import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: IClient;
  onEditRow: () => void;
  onDeleteRow: () => void;
};

export function ClientsTableRow({ row, onEditRow, onDeleteRow }: Props) {
  const { t } = useTranslate('project-management');
  const menuActions = usePopover();
  const confirmDialog = useBoolean();

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
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
            <Box component="span" sx={{ color: 'text.primary', fontWeight: 'fontWeightMedium' }}>
              {row.name}
            </Box>
            <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
              {row.email}
            </Box>
          </Stack>
        </TableCell>

        <TableCell>
          <Box component="span" sx={{ typography: 'body2' }}>
            {row.nit}
          </Box>
        </TableCell>

        <TableCell>
          <Chip
            label={row.isActive ? t('clients.status.active') : t('clients.status.inactive')}
            size="small"
            variant="soft"
            color={row.isActive ? 'success' : 'default'}
          />
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap', typography: 'body2', color: 'text.secondary' }}>
          {fDate(row.createdAt)}
        </TableCell>
      </TableRow>

      <CustomPopover
        open={menuActions.open}
        anchorEl={menuActions.anchorEl}
        onClose={menuActions.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              onEditRow();
              menuActions.onClose();
            }}
          >
            <Iconify icon="solar:pen-bold" />
            {t('clients.actions.edit')}
          </MenuItem>

          <MenuItem
            onClick={() => {
              confirmDialog.onTrue();
              menuActions.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            {t('clients.actions.delete')}
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirmDialog.value}
        onClose={confirmDialog.onFalse}
        title={t('clients.dialogs.delete.title')}
        content={t('clients.dialogs.delete.content', { name: row.name })}
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            {t('clients.actions.delete')}
          </Button>
        }
      />
    </>
  );
}
