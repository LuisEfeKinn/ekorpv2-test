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
  editHref: string;
  onSelectRow: () => void;
  onDeleteRow: () => void;
  onToggleExpand?: (id: number, hasChildren: boolean) => void;
};

export function ProcessTableRow({ row, selected, editHref, onSelectRow, onDeleteRow, onToggleExpand }: Props) {
  const { t } = useTranslate('architecture');
  const menuActions = usePopover();
  const confirmDialog = useBoolean();
  const level = row?.level || 0;
  const hasChildren = row?.hasChildren || (row?.children && row.children.length > 0);
  const isExpanded = row?.isExpanded || false;

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

        <MenuItem component={RouterLink} href={editHref} onClick={() => menuActions.onClose()}>
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
        
        <TableCell sx={{ width: 50 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', pl: level * 1.5, minHeight: 40 }}>
            {hasChildren ? (
              <IconButton
                size="small"
                onClick={() => onToggleExpand?.(row.id, true)}
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
                  icon={isExpanded ? 'eva:arrow-ios-downward-fill' : 'eva:arrow-ios-forward-fill'} 
                  width={14}
                />
              </IconButton>
            ) : (
              <Box sx={{ width: 28, height: 28 }} />
            )}
          </Box>
        </TableCell>

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

        <TableCell>
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
            <Box component="span" sx={{ color: 'text.primary', fontWeight: 'fontWeightMedium' }}>
              {row?.nomenclature || ''}
            </Box>
          </Stack>
        </TableCell>

        <TableCell>
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
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
          </Stack>
        </TableCell>

        <TableCell>
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
            <Box component="span" sx={{ color: 'text.secondary' }}>
              {row?.description || ''}
            </Box>
          </Stack>
        </TableCell>

        <TableCell align="center">
          <Iconify
            icon={row?.requiresOLA ? 'eva:checkmark-circle-2-fill' : 'eva:minus-circle-fill'}
            sx={{
              width: 24,
              height: 24,
              color: row?.requiresOLA ? 'success.main' : 'text.disabled',
            }}
          />
        </TableCell>

        <TableCell align="center">
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'center' }}>
            <Box component="span" sx={{ color: 'text.primary' }}>
              {row?.periodicity || 0}
            </Box>
          </Stack>
        </TableCell>

      </TableRow>

      {renderMenuActions()}
      {renderConfirmDialog()}
    </>
  );
}