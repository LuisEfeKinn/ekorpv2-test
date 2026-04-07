'use client';

import type { ActionMeasureRow } from 'src/types/architecture/action-measures';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

type Props = {
  row: ActionMeasureRow & { level?: number; hasChildren?: boolean; isExpanded?: boolean; description?: string };
  selected: boolean;
  onSelectRow: () => void;
  onEditRow: () => void;
  onDeleteRow: () => void;
  onToggleExpand?: (id: string, isExpanded: boolean) => void;
};

export function ActionMeasuresTableRow({ row, selected, onSelectRow, onEditRow, onDeleteRow, onToggleExpand }: Props) {
  const popover = usePopover();
  const level = row.level || 0;
  const isExpanded = row.isExpanded || false;
  const hasChildren = row.hasChildren || false;

  return (
    <>
      <TableRow hover selected={selected} onClick={onSelectRow} sx={{ cursor: 'pointer' }}>
        <TableCell sx={{ width: 50 }}>
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

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
           <Box sx={{ display: 'flex', alignItems: 'center', pl: level * 2 }}>
            {hasChildren && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand?.(row.id, !isExpanded);
                }}
                sx={{
                  mr: 1,
                  width: 24,
                  height: 24,
                  ...(isExpanded && {
                    transform: 'rotate(90deg)',
                  }),
                }}
              >
                <Iconify icon="eva:arrow-ios-forward-fill" width={16} />
              </IconButton>
            )}
            {!hasChildren && <Box sx={{ width: 24, mr: 1 }} />}
            <Box component="span" sx={{ color: 'text.primary', fontWeight: 'fontWeightMedium' }}>
              {row.code || '-'}
            </Box>
          </Box>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
            <Box 
              component="span" 
              sx={{ 
                color: 'text.primary', 
                fontWeight: level === 0 ? 'fontWeightBold' : 'fontWeightMedium',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {row.name || '-'}
            </Box>
          </Stack>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Box component="span" sx={{ color: 'text.secondary' }}>
            {row.description || '-'}
          </Box>
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
              onEditRow();
              popover.onClose();
            }}
          >
            <Iconify icon="solar:pen-bold" />
            Editar
          </MenuItem>

          <MenuItem
            onClick={() => {
              onDeleteRow();
              popover.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            Eliminar
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </>
  );
}
