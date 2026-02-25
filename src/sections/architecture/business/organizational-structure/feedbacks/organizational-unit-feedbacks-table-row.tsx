import { useState } from 'react';

import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: any;
  selected: boolean;
  onSelectRow: () => void;
  onDeleteRow: () => void;
  onEditRow: () => void;
};

export function OrganizationalUnitFeedbacksTableRow({
  row,
  selected,
  onSelectRow,
  onDeleteRow,
  onEditRow,
}: Props) {
  const { t } = useTranslate('common');
  const { name, description, type } = row;

  const popover = usePopover();

  const [openConfirm, setOpenConfirm] = useState(false);

  return (
    <>
      <TableRow hover selected={selected} onClick={onSelectRow} sx={{ cursor: 'pointer' }}>
        <TableCell sx={{ px: 1, whiteSpace: 'nowrap' }}>
          <IconButton
            color={popover.open ? 'inherit' : 'default'}
            onClick={(e) => {
              e.stopPropagation();
              popover.onOpen(e);
            }}
          >
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{name}</TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{description}</TableCell>
        
        <TableCell sx={{ whiteSpace: 'nowrap' }}>{type}</TableCell>
      </TableRow>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              onEditRow();
              popover.onClose();
            }}
          >
            <Iconify icon="solar:pen-bold" />
            {t('edit')}
          </MenuItem>

          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              setOpenConfirm(true);
              popover.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            {t('delete')}
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        title={t('delete')}
        content={t('delete_confirm')}
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              onDeleteRow();
              setOpenConfirm(false);
            }}
          >
            {t('delete')}
          </Button>
        }
      />
    </>
  );
}
