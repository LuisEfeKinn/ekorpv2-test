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
  visibleColumns: string[];
};

export function ToolsTableRow({ row, selected, onEditRow, onSelectRow, onDeleteRow, onToggleExpand, visibleColumns }: Props) {
  const { t } = useTranslate('architecture');
  const router = useRouter();
  const menuActions = usePopover();
  const confirmDialog = useBoolean();

  const hasChildren = !!row?.hasChildren || (Array.isArray(row?.children) && row.children.length > 0);
  const isExpanded = !!row?.isExpanded;
  const level = row?.level ?? 0;

  const renderCellContent = (columnId: string) => {
    switch (columnId) {
      case 'code':
        return (
          <Box 
            component="span" 
            sx={{ 
              color: 'text.primary', 
              fontWeight: level === 0 ? 'fontWeightBold' : 'fontWeightMedium',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {row?.code || ''}
          </Box>
        );
      case 'name':
        return (
          <Box component="span" sx={{ color: 'text.primary', fontWeight: 'fontWeightMedium' }}>
            {row?.name || ''}
          </Box>
        );
      case 'toolType':
        return row?.toolType?.name || '';
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
                        if (onToggleExpand) onToggleExpand();
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
