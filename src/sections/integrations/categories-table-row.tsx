import type { ICategory } from 'src/types/settings';

import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: ICategory;
  instanceId: string;
};

export function CategoriesTableRow({ row, instanceId }: Props) {
  const { t } = useTranslate('settings');
  const router = useRouter();
  const popover = usePopover();

  // Validar que row exista
  if (!row) {
    return null;
  }

  const handleViewCourses = () => {
    popover.onClose();
    router.push(paths.dashboard.settings.courseListing(instanceId, row.id));
  };

  return (
    <>
      <TableRow hover tabIndex={-1}>

        <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
          <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>

        <TableCell>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box>
              <Typography variant="subtitle2" noWrap>
                {row.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {row.courseCount} {row.courseCount === 1 ? 'curso' : 'cursos'}
              </Typography>
            </Box>
          </Stack>
        </TableCell>

        <TableCell>
          <Typography variant="body2" noWrap>
            {row.description || 'Sin descripción'}
          </Typography>
        </TableCell>

        <TableCell>
          <Label variant="soft" color={row.isActive ? 'success' : 'error'}>
            {row.isActive ? 'Activo' : 'Inactivo'}
          </Label>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{fDate(row.createdAt)}</TableCell>
      </TableRow>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuItem onClick={handleViewCourses}>
          <Iconify icon="solar:eye-bold" />
          {t('categories.table.actions.viewCourses')}
        </MenuItem>
      </CustomPopover>
    </>
  );
}
