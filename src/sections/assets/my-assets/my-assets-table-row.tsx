'use client';

import type { IMyAssets } from 'src/types/assets';

import { Chip } from '@mui/material';
import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';
import { fDate, fTime } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

type Props = {
  row: IMyAssets;
};

export function MyAssetsTableRow({ row }: Props) {
  const { t } = useTranslate('assets');

  const getStateColor = (state?: string) => {
    const normalized = state?.toLowerCase();

    if (normalized?.includes('disponible') || normalized?.includes('available')) return 'success';
    if (normalized?.includes('mantenimiento') || normalized?.includes('maintenance')) return 'warning';
    if (normalized?.includes('asignado') || normalized?.includes('assigned')) return 'info';

    return 'default';
  };

  const getWarrantyStatus = (warrantyExpiration?: string) => {
    if (!warrantyExpiration) return null;

    const expirationDate = new Date(warrantyExpiration);
    const now = new Date();
    const daysDiff = Math.ceil(
      (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff < 0) {
      return { label: t('myAssets.table.warrantyExpired'), color: 'error' as const };
    }

    if (daysDiff <= 30) {
      return { label: t('myAssets.table.warrantyExpiringSoon'), color: 'warning' as const };
    }

    return { label: t('myAssets.table.warrantyActive'), color: 'success' as const };
  };

  const warrantyStatus = getWarrantyStatus(row.warrantyExpiration);

  return (
    <TableRow
      hover
      sx={{
        '&:nth-of-type(odd)': { backgroundColor: 'background.neutral' },
        '& .MuiTableCell-root': { borderColor: 'divider', verticalAlign: 'top' },
      }}
    >
      <TableCell>
        <Stack spacing={0.5}>
          <Typography variant="subtitle2">{row.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {row.internalId}
          </Typography>
        </Stack>
      </TableCell>

      <TableCell>
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {row.internalId}
        </Typography>
      </TableCell>

      <TableCell>
        {row.category?.name ? (
          <Label variant="soft" color="info">
            {row.category.name}
          </Label>
        ) : (
          '-'
        )}
      </TableCell>

      <TableCell>
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {row.serial || '-'}
        </Typography>
      </TableCell>

      <TableCell>
        <Typography variant="body2" color={row.note ? 'text.primary' : 'text.secondary'}>
          {row.note || '-'}
        </Typography>
      </TableCell>

      <TableCell>{row.purchaseDate ? fDate(row.purchaseDate) : '-'}</TableCell>

      <TableCell>
        <Typography variant="body2" fontWeight={600}>
          {row.purchaseValue != null ? fCurrency(row.purchaseValue) : '-'}
        </Typography>
      </TableCell>

      <TableCell>{row.deprecationDate ? fDate(row.deprecationDate) : '-'}</TableCell>

      <TableCell>
        {row.warrantyExpiration ? (
          <Stack spacing={0.5}>
            <Typography variant="body2">{fDate(row.warrantyExpiration)}</Typography>
            {warrantyStatus && (
              <Label variant="soft" color={warrantyStatus.color}>
                {warrantyStatus.label}
              </Label>
            )}
          </Stack>
        ) : (
          '-'
        )}
      </TableCell>

      <TableCell>
        {row.state ? (
          <Chip label={row.state.name} size="small" variant="soft" color={getStateColor(row.state.name)} />
        ) : (
          '-'
        )}
      </TableCell>

      <TableCell>
        {row.assignedAt ? (
          <Stack spacing={0.25}>
            <Typography variant="body2">{fDate(row.assignedAt)}</Typography>
            <Typography variant="caption" color="text.secondary">
              {fTime(row.assignedAt)}
            </Typography>
          </Stack>
        ) : (
          '-'
        )}
      </TableCell>

      <TableCell>
        <Typography variant="body2" color={row.assignmentNotes ? 'text.primary' : 'text.secondary'}>
          {row.assignmentNotes || '-'}
        </Typography>
      </TableCell>
    </TableRow>
  );
}
