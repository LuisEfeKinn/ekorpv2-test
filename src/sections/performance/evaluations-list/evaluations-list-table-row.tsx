'use client';

import type { IEvaluationList } from 'src/types/performance';

import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
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
            <Box sx={{ fontWeight: 600 }}>{row.employeeName}</Box>
            <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
              ID: {row.participantId}
            </Box>
          </Stack>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Label variant="soft" color="info">
            {row.campaignName}
          </Label>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          {row.jobPosition}
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

        <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
          {row.dueDate ? (
            <Box component="span">
              {new Date(row.dueDate).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Box>
          ) : (
            <Box component="span" sx={{ color: 'text.disabled' }}>
              -
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
            <Iconify icon="solar:eye-bold" />
            {t('evaluations-list.actions.viewParticipants')}
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </>
  );
}
