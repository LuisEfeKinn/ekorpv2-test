import type { IVigency } from 'src/types/organization';

import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: IVigency;
  editHref?: string;
  onDeleteRow: () => void;
};

export function VigenciesTableRow({ row, editHref, onDeleteRow }: Props) {
  const { t } = useTranslate('organization');

  const confirm = useBoolean();
  const popover = usePopover();
  const periodsPopover = usePopover();

  const firstPeriod = row.periods && row.periods.length > 0 ? row.periods[0] : null;
  const hasMorePeriods = row.periods && row.periods.length > 1;

  return (
    <>
      <TableRow hover>
        <TableCell padding="checkbox">
          <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>

        <TableCell>
          <Typography variant="subtitle2" noWrap>
            {row.name}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {fDate(row.startDate)}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {fDate(row.endDate)}
          </Typography>
        </TableCell>

        <TableCell>
          {firstPeriod ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label={firstPeriod.name} 
                size="small" 
                variant="outlined"
                onClick={(event) => {
                  event.stopPropagation();
                  periodsPopover.onOpen(event);
                }}
                sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
              />
              {hasMorePeriods && (
                <Chip
                  label={`+${row.periods!.length - 1}`}
                  size="small"
                  variant="filled"
                  color="default"
                  onClick={(event) => {
                    event.stopPropagation();
                    periodsPopover.onOpen(event);
                  }}
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                />
              )}
            </Box>
          ) : (
            <Typography variant="body2" color="text.disabled">
              {t('vigencies.periods.noPeriods')}
            </Typography>
          )}
        </TableCell>

        <TableCell>
          <Label
            variant="soft"
            color={row.isActive ? 'success' : 'error'}
          >
            {row.isActive ? t('vigencies.status.active') : t('vigencies.status.inactive')}
          </Label>
        </TableCell>
      </TableRow>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          {editHref && (
            <MenuItem component={RouterLink} href={editHref} onClick={() => popover.onClose()}>
              <Iconify icon="solar:pen-bold" />
              {t('vigencies.actions.edit')}
            </MenuItem>
          )}
          <MenuItem
            onClick={() => {
              confirm.onTrue();
              popover.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            {t('vigencies.actions.delete')}
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <CustomPopover
        open={periodsPopover.open}
        anchorEl={periodsPopover.anchorEl}
        onClose={periodsPopover.onClose}
        slotProps={{ arrow: { placement: 'bottom-right' } }}
      >
        <Box sx={{ p: 2, minWidth: 320 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            {t('vigencies.periods.title')}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {row.periods?.map((period) => (
              <Box
                key={period.id}
                sx={{
                  p: 1.5,
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="subtitle2">{period.name}</Typography>
                  <Chip label={period.abbreviation} size="small" />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  {fDate(period.startDate)} - {fDate(period.endDate)}
                </Typography>
                <Typography variant="caption" fontWeight="bold">
                  {period.percentage}%
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title={t('vigencies.actions.delete')}
        content={t('vigencies.messages.confirmDelete')}
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            {t('vigencies.actions.delete')}
          </Button>
        }
      />
    </>
  );
}