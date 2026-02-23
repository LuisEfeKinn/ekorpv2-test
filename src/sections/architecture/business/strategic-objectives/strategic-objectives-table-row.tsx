
import { useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

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
  onToggleExpand?: () => void;
  expanded?: boolean;
};

export function StrategicObjectivesTableRow({
  row,
  selected,
  onSelectRow,
  onDeleteRow,
  onEditRow,
  onToggleExpand,
  expanded,
}: Props) {
  const { id, name, code, level, hasChildren } = row;

  const popover = usePopover();

  const [openConfirm, setOpenConfirm] = useState(false);

  return (
    <>
      <TableRow hover selected={selected}>
        <TableCell sx={{ width: 50 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', pl: (level || 0) * 1.5, minHeight: 40 }}>
            {hasChildren ? (
              <IconButton
                size="small"
                onClick={onToggleExpand}
                sx={{
                  width: 28,
                  height: 28,
                  color: 'text.secondary',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    borderColor: 'primary.main',
                    color: 'primary.main'
                  }
                }}
              >
                <Iconify
                  icon={expanded ? 'eva:arrow-ios-downward-fill' : 'eva:arrow-ios-forward-fill'}
                  width={14}
                />
              </IconButton>
            ) : (
              <Box sx={{ width: 28, height: 28 }} />
            )}
          </Box>
        </TableCell>

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

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{code}</TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{name}</TableCell>
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
            href={paths.dashboard.architecture.strategicObjectivesTableMap(String(id))}
            onClick={(e) => {
              e.stopPropagation();
              popover.onClose();
            }}
          >
            <Iconify icon="solar:point-on-map-perspective-bold" />
            Ver mapa
          </MenuItem>

          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              onEditRow();
              popover.onClose();
            }}
          >
            <Iconify icon="solar:pen-bold" />
            Editar
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
            Eliminar
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        title="Eliminar"
        content="¿Estás seguro de que quieres eliminar este elemento?"
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              onDeleteRow();
              setOpenConfirm(false);
            }}
          >
            Eliminar
          </Button>
        }
      />
    </>
  );
}
