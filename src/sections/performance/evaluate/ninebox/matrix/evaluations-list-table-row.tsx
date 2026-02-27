'use client';

import type { IConfigureEvaluation } from 'src/types/performance';

import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: IConfigureEvaluation;
  selected: boolean;
  onEditRow: () => void;
  onViewRow: () => void;
  onSelectRow: () => void;
  onDeleteRow: () => void;
};

export function EvaluationsListTableRow({
  row,
  selected,
  onViewRow,
  onDeleteRow,
}: Props) {
  const { t } = useTranslate('performance');
  const confirm = useBoolean();
  const popover = usePopover();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'COMPLETED':
        return 'info';
      case 'DRAFT':
        return 'warning';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const translateType = (type: string) => {
    const translationKey = `nine-box.types.${type}`;
    return t(translationKey);
  };

  const translateStatus = (status: string) => {
    const translationKey = `nine-box.statuses.${status}`;
    return t(translationKey);
  };

  return (
    <>
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
        <TableCell>
          <Stack direction="row" alignItems="center">
            <IconButton
              color={popover.open ? 'inherit' : 'default'}
              onClick={popover.onOpen}
            >
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Stack>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Stack spacing={0.5} alignItems="flex-start">
            <Label variant="soft">
              {row.name}
            </Label>
          </Stack>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.description}</TableCell>

        <TableCell>
          <Label variant="soft" color="info">
            {translateType(row.type)}
          </Label>
        </TableCell>

        <TableCell>{row.period}</TableCell>

        <TableCell>
          <Label variant="soft" color={getStatusColor(row.status)}>
            {translateStatus(row.status)}
          </Label>
        </TableCell>

        <TableCell align="center">{row.totalCompetences}</TableCell>

        <TableCell align="center">{row.totalObjectives}</TableCell>

        <TableCell align="center">{row.totalDepartments}</TableCell>

        <TableCell align="center">{row.totalPositions}</TableCell>

        <TableCell align="center">{row.totalEmployees}</TableCell>

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
              onViewRow();
              popover.onClose();
            }}
          >
            <Iconify icon="solar:pen-bold" />
            {t('nine-box.actions.view')}
          </MenuItem>

          <MenuItem
            onClick={() => {
              confirm.onTrue();
              popover.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            {t('nine-box.actions.delete')}
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title={t('nine-box.dialogs.delete.title')}
        content={t('nine-box.dialogs.delete.content')}
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            {t('nine-box.actions.delete')}
          </Button>
        }
      />
    </>
  );
}