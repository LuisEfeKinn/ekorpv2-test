import type { IScale } from 'src/types/performance';

import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: IScale;
  selected: boolean;
  editHref: string;
  onSelectRow: () => void;
  onDeleteRow: () => void;
};

export function ScalesTableRow({ row, selected, editHref, onSelectRow, onDeleteRow }: Props) {
  const { t } = useTranslate('performance');
  const menuActions = usePopover();
  const confirmDialog = useBoolean();

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        <li>
          <MenuItem component={RouterLink} href={editHref} onClick={() => menuActions.onClose()}>
            <Iconify icon="solar:pen-bold" />
            {t('scales.actions.edit')}
          </MenuItem>
        </li>

        <MenuItem
          onClick={() => {
            confirmDialog.onTrue();
            menuActions.onClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          {t('scales.actions.delete')}
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title={t('scales.dialogs.delete.title')}
      content={t('scales.dialogs.delete.content')}
      action={
        <Button variant="contained" color="error" onClick={onDeleteRow}>
          {t('scales.actions.delete')}
        </Button>
      }
    />
  );

  const getTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      LIKERT: t('scales.form.fields.type.options.LIKERT'),
      PERFORMANCE: t('scales.form.fields.type.options.PERFORMANCE'),
      NINEBOX_PERFORMANCE: t('scales.form.fields.type.options.NINEBOX_PERFORMANCE'),
      NINEBOX_POTENTIAL: t('scales.form.fields.type.options.NINEBOX_POTENTIAL'),
    };
    return typeLabels[type] || type;
  };

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

        <TableCell>
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
            <Box component="span" sx={{ color: 'text.primary', fontWeight: 'fontWeightMedium' }}>
              {row?.name || 'N/A'}
            </Box>
          </Stack>
        </TableCell>

        <TableCell>
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
            <Box component="span" sx={{ color: 'text.secondary' }}>
              {row?.description || 'N/A'}
            </Box>
          </Stack>
        </TableCell>

        <TableCell>
          <Chip
            label={getTypeLabel(row.type)}
            size="small"
            variant="soft"
            color="primary"
          />
        </TableCell>

        <TableCell align="center">
          <Box component="span" sx={{ color: 'text.primary', fontWeight: 'fontWeightMedium' }}>
            {row?.maxValue || 0}
          </Box>
        </TableCell>

        <TableCell align="center">
          <Chip
            label={row?.levels?.length || 0}
            size="small"
            variant="soft"
            color="info"
          />
        </TableCell>

        <TableCell>
          {row.isDefault ? (
            <Label color="success" variant="soft">
              Sí
            </Label>
          ) : (
            <Label color="default" variant="soft">
              No
            </Label>
          )}
        </TableCell>
      </TableRow>

      {renderMenuActions()}
      {renderConfirmDialog()}
    </>
  );
}