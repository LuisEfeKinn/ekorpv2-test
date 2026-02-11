import type { IOrganizationalUnit } from 'src/types/organization';

import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type RowItem = IOrganizationalUnit & {
  level?: number;
  hasChildren?: boolean;
};

type Props = {
  row: RowItem;
  selected: boolean;
  onSelectRow: () => void;
  onDeleteRow: () => void;
  onEditRow: () => void;
  onToggleExpand?: () => void;
  expanded?: boolean;
};

export function OrganizationalStructureTableRow({
  row,
  selected,
  onSelectRow,
  onDeleteRow,
  onEditRow,
  onToggleExpand,
  expanded,
}: Props) {
  const menuActions = usePopover();
  const confirmDialog = useBoolean();
  const router = useRouter();

  return (
    <>
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
        <TableCell sx={{ width: 50, px: 1, whiteSpace: 'nowrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', pl: (row.level ?? 0) * 1.5, minHeight: 40 }}>
            {row.hasChildren ? (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand?.();
                }}
                sx={{
                  width: 28,
                  height: 28,
                  color: 'text.secondary',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    borderColor: 'primary.main',
                    color: 'primary.main',
                  },
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
            color={menuActions.open ? 'inherit' : 'default'}
            onClick={(e) => {
              e.stopPropagation();
              menuActions.onOpen(e);
            }}
          >
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{row?.code || ''}</TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{row?.name || ''}</TableCell>
      </TableRow>

      <CustomPopover
        open={menuActions.open}
        anchorEl={menuActions.anchorEl}
        onClose={menuActions.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              menuActions.onClose();
              onEditRow();
            }}
          >
            <Iconify icon="solar:pen-bold" />
            Editar
          </MenuItem>

          <MenuItem
            disabled={!row?.id}
            onClick={(e) => {
              e.stopPropagation();
              menuActions.onClose();
              router.push(paths.dashboard.architecture.organizationalStructureTableMap(String(row.id)));
            }}
          >
            <Iconify icon="solar:map-point-bold" />
            Ver mapa
          </MenuItem>

          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              menuActions.onClose();
              confirmDialog.onTrue();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            Eliminar
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirmDialog.value}
        onClose={confirmDialog.onFalse}
        title="Eliminar"
        content="¿Está seguro de que desea eliminar este elemento?"
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              confirmDialog.onFalse();
              onDeleteRow();
            }}
          >
            Eliminar
          </Button>
        }
      />
    </>
  );
}
