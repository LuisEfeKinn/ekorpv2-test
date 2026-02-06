import type { IAssetsItem } from 'src/types/assets';

import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import AvatarGroup from '@mui/material/AvatarGroup';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: IAssetsItem;
  editHref?: string;
  onDeleteRow: () => void;
};

export function InventoryTableRow({ row, editHref, onDeleteRow }: Props) {
  const { t } = useTranslate('assets');

  const confirm = useBoolean();
  const popover = usePopover();

  const renderAssignedTo = () => {
    if (!row.currentAssignments || row.currentAssignments.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary">
          {t('inventory.table.noAssigned')}
        </Typography>
      );
    }

    if (row.currentAssignments.length === 1) {
      const assigned = row.currentAssignments[0];
      return (
        <Tooltip title={assigned.employeeName}>
          <Avatar sx={{ width: 32, height: 32, cursor: 'pointer' }}>
            {assigned.employeeName.charAt(0).toUpperCase()}
          </Avatar>
        </Tooltip>
      );
    }

    return (
      <Stack direction="row" alignItems="center" spacing={1}>
        <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, cursor: 'pointer' } }}>
          {row.currentAssignments.map((assigned) => (
            <Tooltip key={assigned.id} title={assigned.employeeName}>
              <Avatar>
                {assigned.employeeName.charAt(0).toUpperCase()}
              </Avatar>
            </Tooltip>
          ))}
        </AvatarGroup>
        <Typography variant="body2" color="text.secondary">
          {t('inventory.table.multipleAssigned', { count: row.currentAssignments.length })}
        </Typography>
      </Stack>
    );
  };

  const getStateColor = (state: string) => {
    switch (state?.toLowerCase()) {
      case 'disponible':
      case 'available':
        return 'success';
      case 'asignado':
      case 'assigned':
        return 'warning';
      case 'en mantenimiento':
      case 'mantenimiento':
      case 'maintenance':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <>
      <TableRow hover>
        <TableCell padding="checkbox">
          <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>

        <TableCell>
          <Typography variant="body2" fontWeight="medium">
            {row.internalId}
          </Typography>
        </TableCell>

        <TableCell>
          <Stack spacing={0.5}>
            <Typography variant="subtitle2" noWrap>
              {row.name}
            </Typography>
            {row.note && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {row.note}
              </Typography>
            )}
          </Stack>
        </TableCell>

        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {row.serial || '-'}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2">
            {row.category?.name || '-'}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2">
            {row.purchaseDate ? new Date(row.purchaseDate).toLocaleDateString('es-ES', { 
              year: 'numeric', 
              month: '2-digit', 
              day: '2-digit' 
            }) : '-'}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2" fontWeight="medium">
            {row.purchaseValue ? new Intl.NumberFormat('es-CO', { 
              style: 'currency', 
              currency: 'COP',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(row.purchaseValue) : '-'}
          </Typography>
        </TableCell>

        <TableCell>
          <Stack spacing={0.5}>
            <Typography variant="body2">
              {row.warrantyExpiration ? new Date(row.warrantyExpiration).toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit' 
              }) : '-'}
            </Typography>
            {row.warrantyExpiration && (
              <Typography variant="caption" color={
                new Date(row.warrantyExpiration) < new Date() ? 'error.main' : 
                new Date(row.warrantyExpiration) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'warning.main' : 'text.secondary'
              }>
                {new Date(row.warrantyExpiration) < new Date() 
                  ? t('inventory.table.warrantyExpired') 
                  : new Date(row.warrantyExpiration) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                  ? t('inventory.table.warrantyExpiringSoon')
                  : t('inventory.table.warrantyActive')}
              </Typography>
            )}
          </Stack>
        </TableCell>

        <TableCell>
          <Label
            variant="soft"
            color={getStateColor(row.state?.name || '')}
            sx={{
              ...(row.state?.color && {
                backgroundColor: `${row.state.color}20`, // 20% opacity
                color: row.state.color,
                borderColor: `${row.state.color}40`
              })
            }}
          >
            {row.state?.name || '-'}
          </Label>
        </TableCell>

        <TableCell>
          {renderAssignedTo()}
        </TableCell>
      </TableRow>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          {editHref && (
            <MenuItem component={RouterLink} href={editHref} onClick={() => popover.onClose()}>
              <Iconify icon="solar:pen-bold" />
              {t('inventory.actions.edit')}
            </MenuItem>
          )}
          <MenuItem
            component={RouterLink}
            href={paths.dashboard.assets.inventoryHistoryById(row.id)}
            onClick={popover.onClose}
          >
            <Iconify icon="solar:clock-circle-bold" />
            {t('inventory.actions.history')}
          </MenuItem>
          <MenuItem
            onClick={() => {
              confirm.onTrue();
              popover.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            {t('inventory.actions.delete')}
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title={t('inventory.actions.delete')}
        content={t('inventory.messages.confirmDelete')}
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            {t('inventory.actions.delete')}
          </Button>
        }
      />
    </>
  );
}