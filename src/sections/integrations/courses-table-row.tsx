import type { ICourse } from 'src/types/settings';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

type Props = {
  row: ICourse;
};

export function CoursesTableRow({ row }: Props) {
  const { t } = useTranslate('settings');
  if (!row) {
    return null;
  }

  return (
    <TableRow hover tabIndex={-1}>
      <TableCell>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box>
            <Typography variant="subtitle2" noWrap>
              {row.fullName}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {row.codeCourse}
            </Typography>
          </Box>
        </Stack>
      </TableCell>

      <TableCell>
        <Typography variant="body2" noWrap>
          {row.displayName}
        </Typography>
      </TableCell>

      <TableCell>
        {row.description ? (
          <Typography
            variant="body2"
            sx={{
              maxWidth: 300,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              '& p': { margin: 0 },
              '& *': { fontSize: 'inherit', lineHeight: 'inherit' },
            }}
            dangerouslySetInnerHTML={{ __html: row.description }}
          />
        ) : (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('courses.table.columns.noDescription')}
          </Typography>
        )}
      </TableCell>

      <TableCell>
        <Label variant="soft" color={row.isActive ? 'success' : 'error'}>
          {row.isActive ? 'Activo' : 'Inactivo'}
        </Label>
      </TableCell>
    </TableRow>
  );
}
