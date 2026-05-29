import type { IReward } from 'src/types/rewards';

import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: IReward;
  editHref?: string;
  onDeleteRow: () => void;
};

export function RewardsTableRow({ row, editHref, onDeleteRow }: Props) {
  const { t } = useTranslate('rewards');

  const confirm = useBoolean();
  const popover = usePopover();
  const description = row.description?.trim();

  return (
    <>
      <TableRow hover>
        <TableCell padding="checkbox">
          <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>

        <TableCell>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
            <Avatar
              variant="rounded"
              src={row.imageUrl || undefined}
              alt={row.name}
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                flexShrink: 0,
                bgcolor: 'background.neutral',
                border: (theme) => `1px solid ${theme.palette.divider}`,
                boxShadow: (theme) => theme.shadows[2],
              }}
            >
              <Iconify icon="solar:gift-bold-duotone" width={26} />
            </Avatar>

            <Typography variant="subtitle2" noWrap>
              {row.name}
            </Typography>
          </Stack>
        </TableCell>

        <TableCell sx={{ maxWidth: 360 }}>
          <Tooltip
            title={description || ''}
            placement="top-start"
            arrow
            disableHoverListener={!description}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                whiteSpace: 'normal',
                lineHeight: 1.5,
              }}
            >
              {description || '-'}
            </Typography>
          </Tooltip>
        </TableCell>

        <TableCell>
          <Typography variant="body2">
            {row.categoryReward?.name || '-'}
          </Typography>
        </TableCell>

        <TableCell align="center">
          <Typography variant="body2" fontWeight="bold">
            {row.pointsRequired}
          </Typography>
        </TableCell>

        <TableCell align="center">
          <Typography variant="body2">
            {row.stockAvailable}
          </Typography>
        </TableCell>

        <TableCell>
          <Label
            variant="soft"
            color={row.isActive ? 'success' : 'error'}
          >
            {row.isActive ? t('rewards.status.active') : t('rewards.status.inactive')}
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
              {t('rewards.actions.edit')}
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
            {t('rewards.actions.delete')}
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title={t('rewards.actions.delete')}
        content={t('rewards.messages.confirmDelete')}
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            {t('rewards.actions.delete')}
          </Button>
        }
      />
    </>
  );
}