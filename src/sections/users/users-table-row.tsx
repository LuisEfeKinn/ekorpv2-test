import type { IUser } from 'src/types/users';

import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';



// ----------------------------------------------------------------------

type Props = {
  row: IUser;
  onDeleteRow: () => void;
  editHref: string;
};

export function UsersTableRow({ row, onDeleteRow, editHref }: Props) {
  const { t } = useTranslate('security');
  
  const confirmDialog = useBoolean();
  const popover = usePopover();

  const fullName = `${row.names} ${row.lastnames}`;

  const renderPrimary = (
    <TableRow hover>
      <TableCell>
        <IconButton
          color={popover.open ? 'inherit' : 'default'}
          onClick={popover.onOpen}
        >
          <Iconify icon="eva:more-vertical-fill" />
        </IconButton>
      </TableCell>

      <TableCell>
        <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
          <Avatar alt={fullName}>{fullName.charAt(0).toUpperCase()}</Avatar>
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
            <Link
              component={RouterLink}
              href={editHref}
              color="inherit"
              sx={{ cursor: 'pointer' }}
            >
              {fullName}
            </Link>
            <Box component="span" sx={{ color: 'text.disabled' }}>
              {row.email}
            </Box>
          </Stack>
        </Box>
      </TableCell>

      <TableCell>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {row.roles.map((role) => (
            <Chip
              key={role.id}
              size="small"
              variant="soft"
              label={role.name}
              color="primary"
            />
          ))}
        </Stack>
      </TableCell>

      <TableCell>
        <Label
          variant="soft"
          color={row.isActive ? 'success' : 'error'}
        >
          {row.isActive 
            ? t('users.status.active') 
            : t('users.status.inactive')
          }
        </Label>
      </TableCell>
    </TableRow>
  );

  return (
    <>
      {renderPrimary}

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuItem
          component={RouterLink}
          href={editHref}
          onClick={popover.onClose}
        >
          <Iconify icon="solar:pen-bold" />
          {t('users.actions.edit')}
        </MenuItem>

        <MenuItem
          onClick={() => {
            confirmDialog.onTrue();
            popover.onClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          {t('users.actions.delete')}
        </MenuItem>
      </CustomPopover>

      <ConfirmDialog
        open={confirmDialog.value}
        onClose={confirmDialog.onFalse}
        title={t('users.dialogs.delete.title')}
        content={t('users.dialogs.delete.description')}
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            {t('users.dialogs.delete.confirmButton')}
          </Button>
        }
      />
    </>
  );
}