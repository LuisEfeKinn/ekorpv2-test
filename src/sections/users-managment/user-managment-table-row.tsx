import type { IUserManagement } from 'src/types/employees';

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

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: IUserManagement;
  extraColumns: string[];
  selected: boolean;
  editHref: string;
  onSelectRow: () => void;
  onDeleteRow: () => void;
  onViewDetails: () => void;
};

export function UserManagmentTableRow({
  row,
  extraColumns,
  selected,
  editHref,
  onSelectRow,
  onDeleteRow,
  onViewDetails,
}: Props) {
  const { t: tUsers } = useTranslate('employees');
  const { t: tCommon } = useTranslate('common');
  const menuActions = usePopover();
  const confirmDialog = useBoolean();

  const languageLabel =
    row.language === 1
      ? tUsers('user-management.enums.language.spanish')
      : row.language === 2
        ? tUsers('user-management.enums.language.english')
        : '-';

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        <MenuItem
          onClick={() => {
            onViewDetails();
            menuActions.onClose();
          }}
        >
          <Iconify icon="solar:eye-bold" />
          {tUsers('user-management.table.actions.viewDetails')}
        </MenuItem>

        <li>
          <MenuItem component={RouterLink} href={editHref} onClick={() => menuActions.onClose()}>
            <Iconify icon="solar:pen-bold" />
            {tUsers('user-management.actions.edit')}
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
          {tUsers('user-management.actions.delete')}
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title={tUsers('user-management.dialogs.delete.title')}
      content={tUsers('user-management.dialogs.delete.content')}
      action={
        <Button variant="contained" color="error" onClick={onDeleteRow}>
          {tCommon('actions.delete')}
        </Button>
      }
    />
  );

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

  const getNameFromRecord = (value: Record<string, unknown>): string | null => {
    const name = value.name;
    if (typeof name === 'string' && name.trim()) return name;
    return null;
  };

  const renderExtraValue = (value: unknown) => {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);

    if (Array.isArray(value)) {
      const items = value.filter((v) => v !== null && v !== undefined);
      if (!items.length) return '-';

      if (items.every((item) => isRecord(item) && typeof (item as Record<string, unknown>).name === 'string')) {
        const names = items
          .map((item) => getNameFromRecord(item as Record<string, unknown>))
          .filter((n): n is string => typeof n === 'string' && n.trim().length > 0);
        return names.length ? names.join(', ') : '-';
      }

      if (items.every((item) => ['string', 'number', 'boolean'].includes(typeof item))) {
        return items.map((item) => String(item)).join(', ');
      }
    }

    if (isRecord(value)) {
      const name = getNameFromRecord(value);
      if (name) return name;
    }

    try {
      const asJson = JSON.stringify(value);
      if (typeof asJson !== 'string') return '-';
      return asJson.length > 60 ? `${asJson.slice(0, 60)}…` : asJson;
    } catch {
      return '-';
    }
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
              {`${row?.firstName || ''} ${row?.secondName || ''} ${row?.firstLastName || ''} ${row?.secondLastName || ''}`}
            </Box>
            <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
              {row?.email || 'Sin email'}
            </Box>
          </Stack>
        </TableCell>

        <TableCell>
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
            <Box component="span" sx={{ color: 'text.primary' }}>
              {row.username || '-'}
            </Box>
          </Stack>
        </TableCell>

        <TableCell>
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
            <Box component="span" sx={{ color: 'text.primary' }}>
              {row.immediateSupervisorId?.name || '-'}
            </Box>
          </Stack>
        </TableCell>

        <TableCell>
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
            <Box component="span" sx={{ color: 'text.primary' }}>
              {row.position?.name || 'Sin posición'}
            </Box>
            <Chip
              label={row.employmentType?.name || ''}
              size="small"
              variant="soft"
              color="primary"
              sx={{ mt: 0.5 }}
            />
          </Stack>
        </TableCell>

        <TableCell>
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
            <Box component="span" sx={{ color: 'text.primary' }}>
              {row.competencyKm && row.competencyKm.length > 0
                ? row.competencyKm.map((skill) => skill.name).join(', ')
                : 'Sin habilidades'}
            </Box>
          </Stack>
        </TableCell>

        <TableCell>
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
            <Box component="span" sx={{ color: 'text.primary' }}>
              {row.location?.municipality?.name || 'N/A'}
            </Box>
            <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
              {row.address || 'Sin dirección'}
            </Box>
          </Stack>
        </TableCell>

        <TableCell>
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
            <Box component="span" sx={{ color: 'text.primary' }}>
              {row?.minimumBillingRatePerHour || '0'} {row.coin?.name || 'COP'}
            </Box>
            <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
              {tUsers('user-management.table.columns.perHour')}
            </Box>
          </Stack>
        </TableCell>

        <TableCell>
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
            <Box component="span" sx={{ color: 'text.primary' }}>
              {row.recurringWeeklyLimitHours || '0'}h
            </Box>
            <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
              {tUsers('user-management.table.columns.perWeek')}
            </Box>
          </Stack>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          {row.startedWorkOn ? new Date(row.startedWorkOn).toLocaleDateString() : 'Sin fecha'}
        </TableCell>

        <TableCell>
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
            <Box component="span" sx={{ color: 'text.primary' }}>
              {languageLabel}
            </Box>
          </Stack>
        </TableCell>

        <TableCell>
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
            <Box component="span" sx={{ color: 'text.primary' }}>
              {row.timezone || '-'}
            </Box>
          </Stack>
        </TableCell>

        {extraColumns.map((colId) => (
          <TableCell key={colId}>
            <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
              <Box component="span" sx={{ color: 'text.primary' }}>
                {renderExtraValue((row as unknown as Record<string, unknown>)[colId])}
              </Box>
            </Stack>
          </TableCell>
        ))}
      </TableRow>

      {renderMenuActions()}
      {renderConfirmDialog()}
    </>
  );
}
