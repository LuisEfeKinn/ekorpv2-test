import type { ICategoriesInventory } from 'src/types/assets';

import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: ICategoriesInventory;
  editHref?: string;
  onDeleteRow: () => void;
};

export function CategoriesInventoryTableRow({ row, editHref, onDeleteRow }: Props) {
  const { t } = useTranslate('assets');

  const confirm = useBoolean();
  const popover = usePopover();

  return (
    <>
      <TableRow hover>
        <TableCell padding="checkbox">
          <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>

        <TableCell>
          <Typography variant="subtitle2" noWrap>
            {row.name}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="subtitle2" noWrap>
            {row.assetCount}
          </Typography>
        </TableCell>

        <TableCell>
          <Label
            variant="soft"
            color={row.isActive ? 'success' : 'error'}
          >
            {row.isActive ? t('categories.status.active') : t('categories.status.inactive')}
          </Label>
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
              {t('categories.actions.edit')}
            </MenuItem>
          )}
          <MenuItem
            onClick={() => {
              confirm.onTrue();
              popover.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            {t('categories.actions.delete')}
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title={t('categories.actions.delete')}
        content={t('categories.messages.confirmDelete')}
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            {t('categories.actions.delete')}
          </Button>
        }
      />
    </>
  );
}