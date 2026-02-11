'use client';

import type { Theme, SxProps } from '@mui/material/styles';
import type { IInventoryHistory } from 'src/types/assets';

import Chip from '@mui/material/Chip';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

import { fDate, fTime } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';

// ----------------------------------------------------------------------

type Props = {
  row: IInventoryHistory;
  sx?: SxProps<Theme>;
};

export function AssetRecordTableRow({ row, sx }: Props) {
  const { t } = useTranslate('assets');

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'CREATE':
        return 'success';
      case 'UPDATE':
        return 'info';
      case 'ASSIGN':
        return 'primary';
      case 'UNASSIGN':
        return 'warning';
      case 'STATE_CHANGE':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <TableRow hover sx={sx}>
      <TableCell>
        <Chip
          label={t(`record.types.${row.type}`)}
          color={getTypeColor(row.type)}
          size="small"
          variant="soft"
        />
      </TableCell>

      <TableCell>
        <Typography variant="body2" noWrap>
          {row.asset.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {row.asset.internalId}
        </Typography>
      </TableCell>

      <TableCell>
        <Typography variant="body2">{row.description}</Typography>
      </TableCell>

      <TableCell>
        <Typography variant="body2">{fDate(row.createdAt)}</Typography>
        <Typography variant="caption" color="text.secondary">
          {fTime(row.createdAt)}
        </Typography>
      </TableCell>

      <TableCell>
        <Typography variant="body2">
          {row.performedBy ? row.performedBy.name : '-'}
        </Typography>
      </TableCell>

      <TableCell>
        <Typography variant="body2">
          {row.targetEmployee ? row.targetEmployee.name : '-'}
        </Typography>
      </TableCell>

      <TableCell>
        <Typography variant="body2">{row.asset.category.name}</Typography>
      </TableCell>
    </TableRow>
  );
}
