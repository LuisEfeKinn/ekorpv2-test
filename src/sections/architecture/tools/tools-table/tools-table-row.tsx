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
import { useRouter } from 'src/routes/hooks';

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
  onToggleExpand?: () => void;
};

export function ToolsTableRow({ row, selected, onEditRow, onSelectRow, onDeleteRow, onToggleExpand }: Props) {
  const { t } = useTranslate('architecture');
  const router = useRouter();
  const menuActions = usePopover();
  const confirmDialog = useBoolean();

  const hasChildren = !!row?.hasChildren || (Array.isArray(row?.children) && row.children.length > 0);
  const isExpanded = !!row?.isExpanded;
  const level = row?.level ?? 0;

  const renderMenuActions = () => (
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
          {t('tools.table.actions.edit')}
        </MenuItem>

        <MenuItem
          disabled={!row?.id}
          onClick={(e) => {
            e.stopPropagation();
            menuActions.onClose();
            router.push(paths.dashboard.architecture.toolsTableMap(String(row.id)));
          }}
        >
          <Iconify icon="solar:map-point-bold" />
          {t('tools.map.actions.viewMap')}
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
          {t('tools.table.actions.delete')}
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title={t('tools.table.dialogs.delete.title')}
      content={t('tools.table.dialogs.delete.content')}
      action={
        <Button variant="contained" color="error" onClick={onDeleteRow}>
          {t('tools.table.actions.delete')}
        </Button>
      }
    />
  );

  return (
    <>
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
        <TableCell sx={{ width: 80 }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            pl: level * 1.5,
            minHeight: 40,
          }}>
            {hasChildren ? (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onToggleExpand) onToggleExpand();
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
              onClick={(e) => {
                e.stopPropagation();
                menuActions.onOpen(e);
              }}
            >
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Box>
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
                pl: level > 0 ? 1 : 0,
              }}
            >
              {level > 0 && (
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: level === 1 ? 'primary.main' : 'text.disabled',
                    mr: 0.5,
                  }}
                />
              )}
              {row?.code || ''}
            </Box>
          </Stack>
        </TableCell>

        <TableCell>
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
            <Box component="span" sx={{ color: 'text.primary', fontWeight: 'fontWeightMedium' }}>
              {row?.name || ''}
            </Box>
          </Stack>
        </TableCell>
      </TableRow>

      {renderMenuActions()}
      {renderConfirmDialog()}
    </>
  );
}
