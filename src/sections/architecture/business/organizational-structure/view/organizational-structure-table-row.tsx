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

import { useTranslate } from 'src/locales';

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
  visibleColumns: string[];
};

export function OrganizationalStructureTableRow({
  row,
  selected,
  onSelectRow,
  onDeleteRow,
  onEditRow,
  onToggleExpand,
  expanded,
  visibleColumns,
}: Props) {
  const { t } = useTranslate('organization');
  const menuActions = usePopover();
  const confirmDialog = useBoolean();
  const router = useRouter();

  const renderCellContent = (columnId: string) => {
    switch (columnId) {
      case 'code':
        return row?.code || '';
      case 'name':
        return row?.name || '';
      case 'description':
        return row?.description || '';
      case 'color':
        return row?.color ? (
          <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: row.color }} />
        ) : '';
      case 'expectedResults':
        return row?.expectedResults || '';
      default:
        return (row as any)[columnId];
    }
  };

  return (
    <>
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
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

        {visibleColumns.map((columnId, index) => (
          <TableCell key={columnId} sx={{ whiteSpace: 'nowrap' }}>
            {index === 0 ? (
              <Box
                component="span"
                sx={{
                  color: 'text.primary',
                  fontWeight: (row.level || 0) === 0 ? 'fontWeightBold' : 'fontWeightMedium',
                  display: 'flex',
                  alignItems: 'center',
                  pl: (row.level || 0) * 2,
                }}
              >
                {row.hasChildren && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleExpand?.();
                    }}
                    sx={{
                      mr: 1,
                      width: 24,
                      height: 24,
                      ...(expanded && {
                        transform: 'rotate(90deg)',
                      }),
                    }}
                  >
                    <Iconify icon="eva:arrow-ios-forward-fill" width={16} />
                  </IconButton>
                )}
                {!row.hasChildren && <Box sx={{ width: 24, mr: 1 }} />}
                {renderCellContent(columnId)}
              </Box>
            ) : (
              renderCellContent(columnId)
            )}
          </TableCell>
        ))}
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
            {t('organization.actions.edit')}
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
            {t('organization.actions.viewMap')}
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
            {t('organization.actions.delete')}
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirmDialog.value}
        onClose={confirmDialog.onFalse}
        title={t('organization.dialogs.delete.title')}
        content={t('organization.dialogs.delete.content')}
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              confirmDialog.onFalse();
              onDeleteRow();
            }}
          >
            {t('organization.dialogs.delete.confirm')}
          </Button>
        }
      />
    </>
  );
}
