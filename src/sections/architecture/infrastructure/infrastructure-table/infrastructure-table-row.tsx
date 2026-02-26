import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: any;
  mapHref: string;
  selected: boolean;
  onEditRow: () => void;
  onSelectRow: () => void;
  onDeleteRow: () => void;
  onToggleExpand?: (id: number, hasLoadedChildren: boolean) => void;
  openAddChildModal?: (parentId: number) => void;
  isLoadingChildren?: boolean;
};

export function InfrastructureTableRow({ 
  row, 
  mapHref, 
  selected, 
  onEditRow, 
  onSelectRow, 
  onDeleteRow, 
  onToggleExpand,
  openAddChildModal,
  isLoadingChildren = false 
}: Props) {
  const { t } = useTranslate('architecture');
  const menuActions = usePopover();
  const confirmDialog = useBoolean();
  
  const hasChildren = row?.hasChildren || (row?.children && row.children.length > 0);
  const isExpanded = row?.isExpanded || false;
  const level = row?.level || 0;

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
          href={mapHref}
          onClick={() => menuActions.onClose()}
        >
          <Iconify icon="solar:point-on-map-perspective-bold" />
          {t('infrastructure.table.actions.map')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            onEditRow();
            menuActions.onClose();
          }}
        >
          <Iconify icon="solar:pen-bold" />
          {t('infrastructure.table.actions.edit')}
        </MenuItem>
        
        <MenuItem
          onClick={() => {
            openAddChildModal?.(row.id);
            menuActions.onClose();
          }}
        >
          <Iconify icon="solar:add-circle-bold" />
          {t('infrastructure.table.actions.addChild')}
        </MenuItem>

        <MenuItem
          onClick={() => {
            confirmDialog.onTrue();
            menuActions.onClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          {t('infrastructure.table.actions.delete')}
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title={t('infrastructure.table.dialogs.delete.title')}
      content={t('infrastructure.table.dialogs.delete.content')}
      action={
        <Button variant="contained" color="error" onClick={onDeleteRow}>
          {t('infrastructure.table.actions.delete')}
        </Button>
      }
    />
  );

  return (
    <>
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
        {/* Columna de expansión */}
        <TableCell sx={{ width: 80 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            pl: level * 1.5,
            minHeight: 40
          }}>
            {hasChildren ? (
              <IconButton
                size="small"
                onClick={() => onToggleExpand?.(row.id, hasChildren)}
                disabled={isLoadingChildren}
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
                  <Iconify 
                    icon={isExpanded ? "eva:arrow-ios-downward-fill" : "eva:arrow-ios-forward-fill"} 
                    width={14}
                  />
                )}
              </IconButton>
            ) : (
              <Box sx={{ width: 28, height: 28 }} />
            )}
          </Box>
        </TableCell>
        
        {/* Columna de acciones */}
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
            <Box 
              component="span" 
              sx={{ 
                color: 'text.primary', 
                fontWeight: level === 0 ? 'fontWeightBold' : 'fontWeightMedium',
                fontSize: level === 0 ? '0.95rem' : '0.875rem',
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
              {row?.name || row?.label || ''}
            </Box>
            {row?.nomenclature && (
              <Box 
                component="span" 
                sx={{ 
                  color: 'text.disabled', 
                  fontSize: '0.75rem',
                  pl: level > 0 ? 2 : 0,
                  fontStyle: 'italic'
                }}
              >
                {row.nomenclature}
              </Box>
            )}
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
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'center' }}>
            <Box component="span" sx={{ color: 'text.primary', fontWeight: 'fontWeightMedium' }}>
              {row?.type || '-'}
            </Box>
          </Stack>
        </TableCell>

        <TableCell align="center">
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'center' }}>
            <Box component="span" sx={{ color: 'text.primary', fontWeight: 'fontWeightMedium' }}>
              {row?.localExternal || '-'}
            </Box>
          </Stack>
        </TableCell>

        <TableCell align="center">
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'center' }}>
            <Box component="span" sx={{ color: 'text.primary', fontWeight: 'fontWeightMedium' }}>
              {row?.nomenclature || ''}
            </Box>
          </Stack>
        </TableCell>

        <TableCell align="center">
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'center' }}>
            <Box component="span" sx={{ color: 'text.primary', fontWeight: 'fontWeightMedium' }}>
              {row?.code || ''}
            </Box>
          </Stack>
        </TableCell>

        {/* Fecha de Expiración */}
        <TableCell align="center">
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'center' }}>
            {row?.expirationDate ? (
              <Box
                component="span"
                sx={{
                  color: 'warning.main',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  bgcolor: 'warning.lighter',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                <Iconify icon="solar:calendar-mark-bold" width={14} />
                {new Date(row.expirationDate).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </Box>
            ) : (
              <Box component="span" sx={{ color: 'text.disabled' }}>-</Box>
            )}
          </Stack>
        </TableCell>

        {/* Fecha de Renovación */}
        <TableCell align="center">
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'center' }}>
            {row?.renewalDate ? (
              <Box
                component="span"
                sx={{
                  color: 'success.main',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  bgcolor: 'success.lighter',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                <Iconify icon="solar:refresh-circle-bold" width={14} />
                {new Date(row.renewalDate).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </Box>
            ) : (
              <Box component="span" sx={{ color: 'text.disabled' }}>-</Box>
            )}
          </Stack>
        </TableCell>

        <TableCell align="center">
          <Iconify
            icon={row?.requiresSla ? 'eva:checkmark-circle-2-fill' : 'eva:minus-circle-fill'}
            sx={{
              color: row?.requiresSla ? 'success.main' : 'error.main',
              width: 24,
              height: 24
            }}
          />
        </TableCell>

        <TableCell align="center">
          <Iconify
            icon={row?.hasSla ? 'eva:checkmark-circle-2-fill' : 'eva:minus-circle-fill'}
            sx={{
              color: row?.hasSla ? 'success.main' : 'error.main',
              width: 24,
              height: 24
            }}
          />
        </TableCell>

      </TableRow>

      {renderMenuActions()}
      {renderConfirmDialog()}
    </>
  );
}