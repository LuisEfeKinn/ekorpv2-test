'use client';

import type { IConfigureTest } from 'src/types/performance';

import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: IConfigureTest;
  selected: boolean;
  onEditRow: () => void;
  onSelectRow: () => void;
  onDeleteRow: () => void;
};

export function ConfigureTestsTableRow({
  row,
  selected,
  onEditRow,
  onSelectRow,
  onDeleteRow,
}: Props) {
  const { t } = useTranslate('performance');
  const confirm = useBoolean();
  const popover = usePopover();

  const translateType = (type: string) => {
    const translationKey = `configure-evaluations.types.${type}`;
    return t(translationKey);
  };

  return (
    <>
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
        <TableCell>
          <Stack direction="row" alignItems="center">
            <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Stack>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Stack spacing={0.5} alignItems="flex-start">
            <Label variant="soft">{row.name}</Label>
          </Stack>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.description}</TableCell>

        <TableCell>
          <Label variant="soft" color="info">
            {translateType(row.type)}
          </Label>
        </TableCell>

        <TableCell>
          <Label variant="soft" color={row.isActive ? 'success' : 'default'}>
            {row.isActive ? 'Activo' : 'Inactivo'}
          </Label>
        </TableCell>

        <TableCell align="center">{row.totalCompetences}</TableCell>

        <TableCell align="center">{row.totalObjectives}</TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{fDate(row.createdAt)}</TableCell>
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
            {t('configure-tests.actions.edit')}
          </MenuItem>

          <MenuItem
            onClick={() => {
              confirm.onTrue();
              popover.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            {t('configure-tests.actions.delete')}
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title={t('configure-tests.dialogs.delete.title')}
        content={t('configure-tests.dialogs.delete.content')}
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            {t('configure-tests.actions.delete')}
          </Button>
        }
      />
    </>
  );
}
