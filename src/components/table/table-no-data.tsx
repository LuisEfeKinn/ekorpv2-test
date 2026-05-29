'use client';

import type { Theme, SxProps } from '@mui/material/styles';

import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

import { useTranslate } from 'src/locales';

import { EmptyContent } from '../empty-content';

// ----------------------------------------------------------------------

export type TableNoDataProps = {
  notFound: boolean;
  sx?: SxProps<Theme>;
};

export function TableNoData({ notFound, sx }: TableNoDataProps) {
  const { t } = useTranslate();
  return (
    <TableRow>
      {notFound ? (
        <TableCell colSpan={12}>
          <EmptyContent title={t('filters.noResults')} filled sx={[{ py: 10 }, ...(Array.isArray(sx) ? sx : [sx])]} />
        </TableCell>
      ) : (
        <TableCell colSpan={12} sx={{ p: 0 }} />
      )}
    </TableRow>
  );
}
