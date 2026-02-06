'use client';

import type { IAiModelSetting } from 'src/types/ai-model-settings';

import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: IAiModelSetting;
  onEditRow: () => void;
  onDeleteRow: () => void;
};

export function AiModelSettingsTableRow({
  row,
  onEditRow,
  onDeleteRow,
}: Props) {
  const { t } = useTranslate('ai');

  const confirm = useBoolean();
  const popover = usePopover();

  // Parse capabilities from JSON string or array
  const capabilities = (() => {
    try {
      // Si ya es un array, retornarlo directamente
      if (Array.isArray(row.capabilities)) {
        return row.capabilities as string[];
      }
      // Si es un string, parsearlo
      if (typeof row.capabilities === 'string') {
        return JSON.parse(row.capabilities) as string[];
      }
      return [];
    } catch {
      return [];
    }
  })();

  return (
    <>
      <TableRow hover>
        <TableCell>
          <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>

        <TableCell>
          <Stack spacing={0.5}>
            <Typography variant="subtitle2" noWrap>
              {row.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {row.modelKey}
            </Typography>
          </Stack>
        </TableCell>

        <TableCell>
          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
            {row.description || '-'}
          </Typography>
        </TableCell>

        <TableCell align="center">
          <Typography variant="body2">
            {row.maxTokens > 0 ? row.maxTokens.toLocaleString() : '-'}
          </Typography>
        </TableCell>

        <TableCell align="center">
          <Typography variant="body2">
            {row.contextWindow > 0 ? row.contextWindow.toLocaleString() : '-'}
          </Typography>
        </TableCell>

        <TableCell>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {capabilities.map((cap) => (
              <Chip
                key={cap}
                label={cap}
                size="small"
                variant="soft"
                color={getCapabilityColor(cap)}
              />
            ))}
          </Stack>
        </TableCell>

        <TableCell align="center">
          {row.isDefault ? (
            <Label color="success">{t('models.table.default')}</Label>
          ) : (
            <Label color="default">-</Label>
          )}
        </TableCell>
      </TableRow>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem onClick={() => {
            onEditRow();
            popover.onClose();
          }}>
            <Iconify icon="solar:pen-bold" />
            {t('models.actions.edit')}
          </MenuItem>

          <MenuItem
            onClick={() => {
              confirm.onTrue();
              popover.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            {t('models.actions.delete')}
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title={t('models.dialogs.delete.title')}
        content={t('models.dialogs.delete.content')}
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            {t('models.actions.delete')}
          </Button>
        }
      />
    </>
  );
}

// ----------------------------------------------------------------------

function getCapabilityColor(capability: string): 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' | 'default' {
  switch (capability.toLowerCase()) {
    case 'text':
      return 'primary';
    case 'code':
      return 'info';
    case 'reasoning':
      return 'success';
    case 'image':
      return 'warning';
    case 'video':
      return 'error';
    case 'audio':
      return 'secondary';
    default:
      return 'default';
  }
}
