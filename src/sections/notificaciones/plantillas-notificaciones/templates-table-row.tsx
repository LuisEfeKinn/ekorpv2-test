'use client';

import type { NotifiableEvent } from 'src/types/notifications';

import { usePopover } from 'minimal-shared/hooks';

import TableRow from '@mui/material/TableRow';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

type Props = {
  row: NotifiableEvent;
  onEdit: () => void;
};

export function TemplatesTableRow({ row, onEdit }: Props) {
  const popover = usePopover();
  const auditableObjectName = row.auditableObject?.objectKey ?? String(row.auditableObject?.id ?? '-');

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
            {row.id}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2" noWrap>
            {row.notificationEventKey}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2" noWrap>
            {auditableObjectName}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2" noWrap>
            {row.subjectTemplate}
          </Typography>
        </TableCell>
      </TableRow>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              popover.onClose();
              onEdit();
            }}
          >
            <Iconify icon="solar:pen-bold" />
            Editar
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </>
  );
}
