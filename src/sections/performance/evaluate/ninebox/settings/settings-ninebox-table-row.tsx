import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  row: any;
  mapHref: string;
  selected: boolean;
  onEditRow: () => void;
  onSelectRow: () => void;
  onDeleteRow: () => void;
};

export function SettingsNineBoxTableRow({ row, onEditRow }: Props) {

  return (
    <TableRow hover>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={onEditRow}>
            <Iconify icon="solar:pen-bold" />
          </IconButton>
        </Box>
      </TableCell>

      <TableCell>
        <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
          <Box component="span" sx={{ color: 'text.primary', fontWeight: 'fontWeightMedium' }}>
            {row?.label || ''}
          </Box>
        </Stack>
      </TableCell>

      <TableCell>
        <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {row?.color && (
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: row.color,
                  border: '1px solid',
                  borderColor: 'divider',
                  flexShrink: 0,
                }}
              />
            )}
            <Box component="span" sx={{ color: 'text.primary', fontWeight: 'fontWeightMedium' }}>
              {row?.color || 'N/A'}
            </Box>
          </Box>
        </Stack>
      </TableCell>

      <TableCell>
        <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
          <Box component="span" sx={{ color: 'text.primary', fontWeight: 'fontWeightMedium' }}>
            {row?.description || ''}
          </Box>
        </Stack>
      </TableCell>

      <TableCell>
        <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
          <Box component="span" sx={{ color: 'text.primary', fontWeight: 'fontWeightMedium' }}>
            {row?.recommendedAction || ''}
          </Box>
        </Stack>
      </TableCell>

      <TableCell>
        <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
          <Box component="span" sx={{ color: 'text.primary', fontWeight: 'fontWeightMedium' }}>
            {row?.minScoreX || ''}
          </Box>
        </Stack>
      </TableCell>

      <TableCell>
        <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
          <Box component="span" sx={{ color: 'text.primary', fontWeight: 'fontWeightMedium' }}>
            {row?.maxScoreX || ''}
          </Box>
        </Stack>
      </TableCell>
    </TableRow>
  );
}
