'use client';

import type { IQuestion } from 'src/types/performance';

import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: IQuestion;
  selected: boolean;
  onEditRow: () => void;
  onSelectRow: () => void;
  onDeleteRow: () => void;
};

export function ConfigureQuestionsTableRow({
  row,
  selected,
  onEditRow,
  onSelectRow,
  onDeleteRow,
}: Props) {
  const { t } = useTranslate('performance');
  const confirm = useBoolean();
  const popover = usePopover();
  const scalePopover = usePopover();

  const translateRelationship = (relationship: string) => {
    const translationKey = `configure-evaluations.relationships.${relationship}`;
    return t(translationKey);
  };

  return (
    <>
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
        <TableCell>
          <Stack direction="row" alignItems="center">
            <IconButton
              color={popover.open ? 'inherit' : 'default'}
              onClick={popover.onOpen}
            >
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Stack>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'wrap', maxWidth: 400 }}>
          {row.description}
        </TableCell>

        <TableCell align="center">
          <Label variant="soft" color="info">
            {row.weight*100}%
          </Label>
        </TableCell>

        <TableCell align="center">
          <Label variant="soft" color={row.isOptional ? 'warning' : 'success'}>
            {row.isOptional ? t('questions.table.columns.optional') : t('questions.table.columns.required')}
          </Label>
        </TableCell>

        <TableCell>
          {row.scale && (
            <Chip
              label={row.scale.name}
              variant="soft"
              color="primary"
              onClick={scalePopover.onOpen}
              sx={{ cursor: 'pointer' }}
            />
          )}
        </TableCell>

        <TableCell>
          <Stack direction="row" flexWrap="wrap" spacing={0.5}>
            {row.visibleFor?.map((relation, index) => (
              <Label key={index} variant="soft" color="default" sx={{ mb: 0.5 }}>
                {translateRelationship(relation?.relationship)}
              </Label>
            ))}
          </Stack>
        </TableCell>
      </TableRow>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              onEditRow();
              popover.onClose();
            }}
          >
            <Iconify icon="solar:pen-bold" />
            {t('questions.actions.edit')}
          </MenuItem>

          <MenuItem
            onClick={() => {
              confirm.onTrue();
              popover.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            {t('questions.actions.delete')}
          </MenuItem>
        </MenuList>
      </CustomPopover>

      {/* Scale Levels Popover */}
      <CustomPopover
        open={scalePopover.open}
        anchorEl={scalePopover.anchorEl}
        onClose={scalePopover.onClose}
        slotProps={{ arrow: { placement: 'bottom-center' } }}
      >
        <Box sx={{ p: 2, minWidth: 320, maxWidth: 400 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            {row.scale?.name}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {row.scale?.description}
          </Typography>

          <Divider sx={{ mb: 2 }} />

          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            {t('questions.scalePopover.levels')}:
          </Typography>

          <Stack spacing={1.5}>
            {row.scale?.levels?.map((level: any) => (
              <Box
                key={level.id}
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.neutral',
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: level.color,
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="subtitle2">
                    {level.label} ({level.value})
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {level.description}
                </Typography>
              </Box>
            ))}
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              {t('questions.scalePopover.type')}: {row.scale?.type}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('questions.scalePopover.maxValue')}: {row.scale?.maxValue}
            </Typography>
          </Box>
        </Box>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title={t('questions.dialogs.delete.title')}
        content={t('questions.dialogs.delete.content')}
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            {t('questions.actions.delete')}
          </Button>
        }
      />
    </>
  );
}
