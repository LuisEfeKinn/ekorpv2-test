'use client';

import type { TableRowProps } from '@mui/material/TableRow';

import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

// ----------------------------------------------------------------------

export type TableEmptyRowsProps = TableRowProps & {
  height?: number;
  emptyRows: number;
  preserveHeight?: boolean;
};

export function TableEmptyRows({ emptyRows, height, preserveHeight = false, sx, ...other }: TableEmptyRowsProps) {
  if (!emptyRows || !preserveHeight) {
    return null;
  }

  return (
    <TableRow
      sx={[
        () => ({
          ...(height && { height: height * emptyRows }),
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <TableCell colSpan={9} />
    </TableRow>
  );
}
