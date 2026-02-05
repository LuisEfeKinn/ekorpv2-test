'use client';

import type { IEvaluationList } from 'src/types/performance';

import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: IEvaluationList;
  onViewParticipants: () => void;
};

export function EvaluationsListTableRow({ row, onViewParticipants }: Props) {
  const { t } = useTranslate('performance');
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

  const translateStatus = (status: string) => {
    const translationKey = `evaluations-list.statuses.${status}`;
    return t(translationKey);
  };

  return (
    <>
      <TableRow hover tabIndex={-1}>
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

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          {row.vigencyName || (
            <Box component="span" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
              {t('evaluations-list.table.empty.noVigency')}
            </Box>
          )}
        </TableCell>

        <TableCell>
          <Label variant="soft" color={getStatusColor(row.status)}>
            {translateStatus(row.status)}
          </Label>
        </TableCell>

        <TableCell>
          {row.organizationalUnits.length > 0 ? (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {row.organizationalUnits.slice(0, 2).map((unit) => (
                <Chip key={unit.id} label={unit.name} size="small" variant="outlined" />
              ))}
              {row.organizationalUnits.length > 2 && (
                <Chip
                  label={`+${row.organizationalUnits.length - 2}`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Stack>
          ) : (
            <Box component="span" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
              {t('evaluations-list.table.empty.noUnits')}
            </Box>
          )}
        </TableCell>

        <TableCell align="center">
          {row.participants.length > 0 ? (
            <Label variant="soft" color="primary">
              {row.participants.length}
            </Label>
          ) : (
            <Box component="span" sx={{ color: 'text.disabled' }}>
              0
            </Box>
          )}
        </TableCell>
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
              onViewParticipants();
              popover.onClose();
            }}
          >
            <Iconify icon="solar:users-group-rounded-bold" />
            {t('evaluations-list.actions.viewParticipants')}
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </>
  );
}
