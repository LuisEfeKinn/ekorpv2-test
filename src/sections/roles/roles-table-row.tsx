import type { IRole } from 'src/types/roles';

import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: IRole;
  selected: boolean;
  editHref: string;
  permissionsHref?: string;
  onSelectRow: () => void;
  onDeleteRow: () => void;
};

export function RoleTableRow({ row, selected, editHref, permissionsHref, onSelectRow, onDeleteRow }: Props) {
  const { t } = useTranslate('security');
  const menuActions = usePopover();
  const confirmDialog = useBoolean();

  const isDefault = row.isDefault === 1;

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        {!isDefault && (
          <li>
            <MenuItem component={RouterLink} href={editHref} onClick={() => menuActions.onClose()}>
              <Iconify icon="solar:pen-bold" />
              {t('roles.actions.edit')}
            </MenuItem>
          </li>
        )}

        <li>
          <MenuItem
            component={RouterLink}
            href={permissionsHref ?? paths.dashboard.security.rolePermissions(row.id)}
            onClick={() => menuActions.onClose()}
          >
            <Iconify icon="solar:shield-check-bold" sx={{ color: 'success.main' }} />
            {t('roles.actions.permissions')}
          </MenuItem>
        </li>

        {!isDefault && (
          <MenuItem
            onClick={() => {
              confirmDialog.onTrue();
              menuActions.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            {t('roles.actions.delete')}
          </MenuItem>
        )}
      </MenuList>
    </CustomPopover>
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title={t('roles.dialogs.delete.title')}
      content={t('roles.dialogs.delete.description')}
      action={
        <Button variant="contained" color="error" onClick={onDeleteRow}>
          {t('roles.actions.delete')}
        </Button>
      }
    />
  );

  return (
    <>
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color={menuActions.open ? 'inherit' : 'default'}
              onClick={menuActions.onOpen}
            >
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Box>
        </TableCell>

        <TableCell>
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
            <Box component="span" sx={{ color: 'text.primary', fontWeight: 'fontWeightMedium' }}>
              {row.name}
            </Box>
          </Stack>
        </TableCell>

        <TableCell>
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
            <Box component="span" sx={{ color: 'text.secondary' }}>
              {row.description}
            </Box>
          </Stack>
        </TableCell>

        <TableCell>
          <Label
            variant="soft"
            color={isDefault ? 'warning' : 'default'}
          >
            {isDefault ? t('roles.table.isDefault.default') : t('roles.table.isDefault.custom')}
          </Label>
        </TableCell>
      </TableRow>

      {renderMenuActions()}
      {renderConfirmDialog()}
    </>
  );
}
