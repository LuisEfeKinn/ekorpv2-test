import React from 'react';
import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
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
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: any;
  selected: boolean;
  onEditRow: () => void;
  onSelectRow: () => void;
  onDeleteRow: () => void;
  onToggleExpand?: (id: number, hasChildren: boolean) => void;
  visibleColumns: string[];
};

export function ProcessTableRow({ row, selected, onEditRow, onSelectRow, onDeleteRow, onToggleExpand, visibleColumns }: Props) {
  const { t } = useTranslate('architecture');
  const menuActions = usePopover();
  const confirmDialog = useBoolean();
  const level = row?.level || 0;
  const hasChildren = row?.hasChildren || (row?.children && row.children.length > 0);
  const isExpanded = row?.isExpanded || false;

  const renderCellContent = (columnId: string) => {
    switch (columnId) {
      case 'nomenclature':
        return (
          <Box component="span" sx={{ color: 'text.primary', fontWeight: 'fontWeightMedium' }}>
            {row?.nomenclature || ''}
          </Box>
        );
      case 'name':
        return (
          <Box 
            component="span" 
            sx={{ 
              color: 'text.primary', 
              fontWeight: level === 0 ? 'fontWeightBold' : 'fontWeightMedium',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              pl: level > 0 ? 1 : 0
            }}
          >
            {level > 0 && (
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: level === 1 ? 'primary.main' : 'text.disabled',
                  mr: 0.5
                }}
              />
            )}
            {row?.name || ''}
          </Box>
        );
      case 'description':
        return (
          <Box component="span" sx={{ color: 'text.secondary' }}>
            {row?.description || ''}
          </Box>
        );
      case 'requiresOLA':
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center', width: 1 }}>
            <Iconify
              icon={row?.requiresOLA ? 'eva:checkmark-circle-2-fill' : 'eva:minus-circle-fill'}
              sx={{
                width: 24,
                height: 24,
                color: row?.requiresOLA ? 'success.main' : 'text.disabled',
              }}
            />
          </Box>
        );
      case 'periodicity':
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center', width: 1 }}>
            <Box component="span" sx={{ color: 'text.primary' }}>
              {row?.periodicity || 0}
            </Box>
          </Box>
        );
      default:
        return (row as any)[columnId];
    }
  };

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        <MenuItem
          component={RouterLink}
          href={paths.dashboard.architecture.processesTableMap(String(row.id))}
          onClick={() => menuActions.onClose()}
        >
          <Iconify icon="solar:point-on-map-perspective-bold" />
          {t('process.table.actions.map')}
        </MenuItem>

        <MenuItem onClick={() => {
          onEditRow();
          menuActions.onClose();
        }}>
          <Iconify icon="solar:pen-bold" />
          {t('process.table.actions.edit')}
        </MenuItem>

        <MenuItem
          onClick={() => {
            confirmDialog.onTrue();
            menuActions.onClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          {t('process.table.actions.delete')}
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title={t('process.table.dialogs.delete.title')}
      content={t('process.table.dialogs.delete.content')}
      action={
        <Button variant="contained" color="error" onClick={onDeleteRow}>
          {t('process.table.actions.delete')}
        </Button>
      }
    />
  );

  return (
    <>
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
        {/* <TableCell padding="checkbox">
          <Checkbox
            checked={selected}
            onClick={onSelectRow}
            slotProps={{
              input: {
                id: `${row.id}-checkbox`,
                'aria-label': `${row.id} checkbox`,
              },
            }}
          />
        </TableCell> */}
        
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color={menuActions.open ? 'inherit' : 'default'}
              onClick={menuActions.onOpen}
            >
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Box>
        </TableCell>

        {visibleColumns.map((columnId, index) => (
          <TableCell key={columnId}>
            {index === 0 ? (
              <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', pl: level * 2 }}>
                  {hasChildren && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleExpand?.(row.id, true);
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
                  {renderCellContent(columnId)}
                </Box>
              </Stack>
            ) : (
              <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
                {renderCellContent(columnId)}
              </Stack>
            )}
          </TableCell>
        ))}
      </TableRow>

      {renderMenuActions()}
      {renderConfirmDialog()}
    </>
  );
}