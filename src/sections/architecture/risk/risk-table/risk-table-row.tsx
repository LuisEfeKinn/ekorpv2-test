import { useBoolean, usePopover } from 'minimal-shared/hooks';

import {
  Box,
  Stack,
  Drawer,
  Button,
  MenuList,
  MenuItem,
  TableRow,
  TableCell,
  IconButton,
  Typography,
} from '@mui/material';

import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: any;
  mapHref?: string;
  selected: boolean;
  onEditRow: () => void;
  onSelectRow: () => void;
  onDeleteRow: () => void;
  onRelateRow?: () => void;
  onToggleExpand?: (id: number, hasLoadedChildren: boolean) => void;
  isLoadingChildren?: boolean;
  visibleColumns: string[];
};

export function RiskTableRow({ row, mapHref, selected, onEditRow, onSelectRow, onDeleteRow, onRelateRow, onToggleExpand, isLoadingChildren = false, visibleColumns }: Props) {
  const { t } = useTranslate('architecture');
  const menuActions = usePopover();
  const confirmDialog = useBoolean();
  const hasChildren = row?.hasChildren || (row?.children && row.children.length > 0);
  const isExpanded = row?.isExpanded || false;
  const level = row?.level || 0;

  const renderCellContent = (columnId: string) => {
    switch (columnId) {
      case 'code':
        return row?.code || '';
      case 'name':
        return (
          <Box
            component="span"
            sx={{
              color: 'text.primary',
              fontWeight: level === 0 ? 'fontWeightBold' : 'fontWeightMedium',
              fontSize: level === 0 ? '0.95rem' : '0.875rem',
            }}
          >
            {row?.name || row?.label || ''}
          </Box>
        );
      case 'description':
        return (
          <Box component="span" sx={{ color: 'text.secondary' }}>
            {row?.description || ''}
          </Box>
        );
      case 'riskType':
        return (
          <Box component="span" sx={{ color: 'text.primary', fontWeight: 'fontWeightMedium' }}>
            {row?.riskType?.name || ''}
          </Box>
        );
      case 'superiorRisk':
        return (
          <Box component="span" sx={{ color: 'text.primary', fontWeight: 'fontWeightMedium' }}>
            {row?.risk?.name || row?.superiorRisk?.name || ''}
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
        {mapHref && (
          <MenuItem
            component={RouterLink}
            href={mapHref}
            onClick={() => menuActions.onClose()}
          >
            <Iconify icon="solar:point-on-map-perspective-bold" />
            {t('risk.table.actions.map')}
          </MenuItem>
        )}
        {onRelateRow && (
          <MenuItem
            onClick={() => {
              onRelateRow();
              menuActions.onClose();
            }}
          >
            <Iconify icon="solar:map-point-bold" />
            {t('risk.table.actions.relate')}
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            onEditRow();
            menuActions.onClose();
          }}
        >
          <Iconify icon="solar:pen-bold" />
          {t('risk.table.actions.edit')}
        </MenuItem>

        <MenuItem
          onClick={() => {
            confirmDialog.onTrue();
            menuActions.onClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          {t('risk.table.actions.delete')}
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  const renderConfirmDialog = () => (
    <Drawer anchor="right" open={confirmDialog.value} onClose={confirmDialog.onFalse} PaperProps={{ sx: { width: 360 } }}>
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>{t('risk.table.dialogs.delete.title')}</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>{t('risk.table.dialogs.delete.content')}</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={confirmDialog.onFalse}>{t('risk.table.actions.cancel')}</Button>
          <Button variant="contained" color="error" onClick={onDeleteRow}>{t('risk.table.actions.delete')}</Button>
        </Stack>
      </Box>
    </Drawer>
  );

  return (
    <>
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>


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
              <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'center' }}>
                <Box
                  component="span"
                  sx={{
                    color: 'text.primary',
                    fontWeight: 'fontWeightMedium',
                    display: 'flex',
                    alignItems: 'center',
                    pl: level * 2,
                  }}
                >
                  {hasChildren && (
                    <IconButton
                      size="small"
                      onClick={() => onToggleExpand?.(row.id, hasChildren)}
                      disabled={isLoadingChildren}
                      sx={{
                        mr: 1,
                        width: 24,
                        height: 24,
                        ...(isExpanded && {
                          transform: 'rotate(90deg)',
                        }),
                      }}
                    >
                      {isLoadingChildren ? (
                        <Box sx={{
                          width: 14,
                          height: 14,
                          border: '2px solid',
                          borderColor: 'currentColor',
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                          '@keyframes spin': {
                            '0%': { transform: 'rotate(0deg)' },
                            '100%': { transform: 'rotate(360deg)' },
                          },
                        }} />
                      ) : (
                        <Iconify icon="eva:arrow-ios-forward-fill" width={16} />
                      )}
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
