'use client';

import type { Announcement } from 'src/types/notifications';

import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { fDateTime } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { FileThumbnail } from 'src/components/file-thumbnail';
import { CustomPopover } from 'src/components/custom-popover';

type Props = {
  row: Announcement;
  onEdit: () => void;
  onDelete: () => void;
};

export function AnnouncementsTableRow({ row, onEdit, onDelete }: Props) {
  const confirm = useBoolean();
  const popover = usePopover();

  const hasStatus = row.status !== null && row.status !== undefined;
  const statusValue = Number(row.status ?? 0);
  const statusLabel =
    !hasStatus ? '-' : statusValue === 1 ? 'Activo' : statusValue === 2 ? 'Eliminado' : 'Inactivo';
  const statusColor =
    !hasStatus ? 'default' : statusValue === 1 ? 'success' : statusValue === 2 ? 'warning' : 'error';

  const typeLabel =
    row.type === 'NOTICIA'
      ? 'Noticia'
      : row.type === 'EVENTO'
        ? 'Evento'
        : row.type === 'ARTICULO'
          ? 'Artículo'
          : row.type || '-';

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
          <Typography variant="subtitle2" noWrap>
            {row.title}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2" noWrap>
            {typeLabel}
          </Typography>
        </TableCell>

        <TableCell>
          <Label variant="soft" color={statusColor}>
            {statusLabel}
          </Label>
        </TableCell>

        <TableCell align="center">
          <Typography variant="body2" noWrap>
            {row.order}
          </Typography>
        </TableCell>

        <TableCell>
          {row.file ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FileThumbnail file={row.file} tooltip showImage sx={{ width: 36, height: 36 }} />
              <Link href={row.file} target="_blank" rel="noreferrer" underline="hover" noWrap>
                Ver
              </Link>
            </Box>
          ) : (
            '-'
          )}
        </TableCell>

        <TableCell>
          <Typography variant="body2" noWrap>
            {row.deadlineDate ? fDateTime(row.deadlineDate) : '-'}
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

          <MenuItem
            onClick={() => {
              popover.onClose();
              confirm.onTrue();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            Eliminar
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Eliminar anuncio"
        content="¿Seguro que quieres eliminar este anuncio?"
        action={
          <Button variant="contained" color="error" onClick={onDelete}>
            Eliminar
          </Button>
        }
      />
    </>
  );
}
