import type { IWorker } from 'src/types/project-management';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';

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
};

export function WorkersTableRow({ row, onEditRow }: Props) {

  return (
    <TableRow hover tabIndex={-1}>
        <TableCell>
          <IconButton onClick={onEditRow}>
            <Iconify icon="solar:pen-bold" />
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
  );
}
