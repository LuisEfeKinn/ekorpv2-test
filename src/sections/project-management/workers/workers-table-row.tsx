import type { IWorker } from 'src/types/project-management';

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

import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type ChipColor = 'success' | 'error' | 'info' | 'default';

const WORKER_STATUS_COLOR: Record<string, ChipColor> = {
  '1': 'success',  // Activo
  '2': 'error',    // Inactivo
  '3': 'info',     // Disponible
};

type Props = {
  row: IWorker;
  onEditRow: () => void;
  onViewDetail: () => void;
};

export function WorkersTableRow({ row, onEditRow, onViewDetail }: Props) {
  const { t } = useTranslate('project-management');
  const menuActions = usePopover();

  return (
    <>
    <TableRow hover tabIndex={-1}>
        <TableCell>
          <IconButton
            color={menuActions.open ? 'inherit' : 'default'}
            onClick={menuActions.onOpen}
          >
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>

        <TableCell>
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
            <Box component="span" sx={{ color: 'text.primary', fontWeight: 'fontWeightMedium' }}>
              {row.fullName}
            </Box>
            <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
              {row.email}
            </Box>
          </Stack>
        </TableCell>

        <TableCell>
          <Box component="span" sx={{ typography: 'body2' }}>
            {row.positionName ?? '-'}
          </Box>
        </TableCell>

        <TableCell>
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
            <Box component="span" sx={{ color: 'text.primary' }}>
              {row.experienceLevelName ?? '-'}
            </Box>
            <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
              {row.experienceSummary}
            </Box>
          </Stack>
        </TableCell>

        <TableCell>
          <Box
            component="span"
            sx={{ typography: 'body2', color: row.technologies ? 'text.primary' : 'text.disabled' }}
          >
            {row.technologies ?? '-'}
          </Box>
        </TableCell>

        <TableCell align="center">
          <Box component="span" sx={{ typography: 'body2', fontWeight: 'fontWeightBold' }}>
            {row.projectCount ?? 0}
          </Box>
        </TableCell>

        <TableCell align="center">
          <Box
            component="span"
            sx={{
              typography: 'body2',
              fontWeight: 'fontWeightBold',
              color: (row.totalDedicacion ?? 0) > 100 ? 'error.main' : 'text.primary',
            }}
          >
            {row.totalDedicacion ?? 0}%
          </Box>
        </TableCell>

        <TableCell align="center">
          <Box component="span" sx={{ typography: 'body2' }}>
            {row.pendingActivities ?? 0}
          </Box>
        </TableCell>

        <TableCell>
          {row.workerStatusName ? (
            <Chip
              label={row.workerStatusName}
              size="small"
              variant="soft"
              color={WORKER_STATUS_COLOR[row.workerStatusId ?? ''] ?? 'default'}
            />
          ) : (
            <Box component="span" sx={{ typography: 'body2', color: 'text.disabled' }}>-</Box>
          )}
        </TableCell>

        <TableCell>
          <Box component="span" sx={{ typography: 'body2' }}>
            {row.employmentTypeName ?? '-'}
          </Box>
        </TableCell>
      </TableRow>

      <CustomPopover
        open={menuActions.open}
        anchorEl={menuActions.anchorEl}
        onClose={menuActions.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              onViewDetail();
              menuActions.onClose();
            }}
          >
            <Iconify icon="solar:eye-bold" />
            {t('workers.actions.viewDetail')}
          </MenuItem>

          <MenuItem
            onClick={() => {
              onEditRow();
              menuActions.onClose();
            }}
          >
            <Iconify icon="solar:pen-bold" />
            {t('workers.actions.edit')}
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </>
  );
}
