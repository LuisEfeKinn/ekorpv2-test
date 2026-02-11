'use client';

import type { IMyAssets } from 'src/types/assets';

import { Chip } from '@mui/material';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

import { fDate, fTime } from 'src/utils/format-time';

// ----------------------------------------------------------------------

type Props = {
  row: IMyAssets;
};

export function MyAssetsTableRow({ row }: Props) {
  return (
    <TableRow hover>
      <TableCell>{row.name}</TableCell>

      <TableCell>{row.internalId}</TableCell>

      <TableCell>{row.category?.name || '-'}</TableCell>

      <TableCell>{row.serial}</TableCell>

      <TableCell>
        {row.state ? (
          <Chip label={row.state.name} size="small" variant="soft" color="default" />
        ) : (
          '-'
        )}
      </TableCell>

      <TableCell>
        {row.assignedAt ? (
          <>
            {fDate(row.assignedAt)}
            <br />
            <small style={{ color: 'text.secondary' }}>{fTime(row.assignedAt)}</small>
          </>
        ) : (
          '-'
        )}
      </TableCell>

      <TableCell>{row.assignmentNotes || '-'}</TableCell>
    </TableRow>
  );
}
