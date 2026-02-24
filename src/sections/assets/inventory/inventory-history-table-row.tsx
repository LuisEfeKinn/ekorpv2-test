'use client';

import type { Theme, SxProps } from '@mui/material/styles';
import type { IInventoryHistory } from 'src/types/assets';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import Collapse from '@mui/material/Collapse';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { fDate, fTime } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  row: IInventoryHistory;
  sx?: SxProps<Theme>;
};

export function InventoryHistoryTableRow({ row, sx }: Props) {
  const { t } = useTranslate('assets');
  const [open, setOpen] = useState(false);

  const hasChanges = row.changes && Object.keys(row.changes).length > 0;

  const getTypeColor = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'CREATE':
        return 'success';
      case 'UPDATE':
        return 'info';
      case 'DELETE':
        return 'error';
      case 'ASSIGN':
        return 'warning';
      case 'UNASSIGN':
        return 'default';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type: string) => {
    const typeKey = type?.toUpperCase();
    return t(`inventory.history.types.${typeKey}`, { defaultValue: type });
  };

  return (
    <>
      <TableRow hover sx={sx}>
        <TableCell>
          <Chip
            label={getTypeLabel(row.type)}
            color={getTypeColor(row.type)}
            size="small"
            variant="soft"
          />
        </TableCell>

        <TableCell>
          <Typography variant="body2" noWrap>
            {row.description}
          </Typography>
        </TableCell>

        <TableCell>
          <Stack spacing={0.5}>
            <Typography variant="body2" fontWeight="medium">
              {fDate(row.createdAt)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {fTime(row.createdAt)}
            </Typography>
          </Stack>
        </TableCell>

        <TableCell>
          <Typography variant="body2">
            {row.performedBy?.name || '-'}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2">
            {row.targetEmployee?.name || '-'}
          </Typography>
        </TableCell>

        <TableCell>
          {hasChanges ? (
            <IconButton
              size="small"
              onClick={() => setOpen(!open)}
              sx={{ color: 'primary.main' }}
            >
              <Iconify icon={(open ? 'solar:alt-arrow-up-bold' : 'solar:alt-arrow-down-bold') as any} />
            </IconButton>
          ) : (
            <Typography variant="body2" color="text.secondary">
              -
            </Typography>
          )}
        </TableCell>
      </TableRow>

      {hasChanges && (
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ py: 2, px: 3, bgcolor: 'background.neutral' }}>
                <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
                  {t('inventory.history.changesDetail')}
                </Typography>
                <Stack spacing={1.5}>
                  {Object.entries(row.changes).map(([key, change]) => (
                    <Box key={key}>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">
                        {change.label}:
                      </Typography>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {t('inventory.history.oldValue')}:
                          </Typography>
                          <Typography variant="body2">
                            {change.old || '-'}
                          </Typography>
                        </Box>
                        <Iconify icon={"solar:arrow-right-bold" as any} sx={{ color: 'text.disabled' }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {t('inventory.history.newValue')}:
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {change.new || '-'}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
