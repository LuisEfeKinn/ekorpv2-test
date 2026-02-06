import type { IJob } from 'src/types/architecture/jobs';

import { useState } from 'react';

import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: IJob;
  selected: boolean;
  onSelectRow: () => void;
  onDeleteRow: () => void;
  onEditRow: () => void;
};

export function JobsTableRow({
  row,
  selected,
  onSelectRow,
  onDeleteRow,
  onEditRow,
}: Props) {
  const { t } = useTranslate('business');
  const { name, code } = row;

  const popover = usePopover();

  const [openConfirm, setOpenConfirm] = useState(false);

  const typeName =
    row?.jobType?.name ||
    (row as any)?.jobTypeName ||
    (row as any)?.jobType ||
    (row as any)?.type?.name ||
    (row as any)?.type ||
    (row?.superiorJob ? 'Subcargo' : 'Principal');

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

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{code || '-'}</TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{name}</TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{typeName || '-'}</TableCell>
      </TableRow>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            component={RouterLink}
            href={paths.dashboard.architecture.positionsTableMap(String(row.id))}
            onClick={(e) => {
              e.stopPropagation();
              popover.onClose();
            }}
          >
            <Iconify icon="solar:point-on-map-perspective-bold" />
            {t('positions.table.actions.viewMap')}
          </MenuItem>

          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              onEditRow();
              popover.onClose();
            }}
          >
            <Iconify icon="solar:pen-bold" />
            {t('positions.table.actions.edit')}
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
            {t('positions.table.actions.delete')}
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        title={t('positions.table.actions.delete')}
        content={t('positions.table.messages.deleteConfirm')}
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              onDeleteRow();
              setOpenConfirm(false);
            }}
          >
            {t('positions.table.actions.delete')}
          </Button>
        }
      />
    </>
  );
}

