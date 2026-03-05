import type { IPosition } from 'src/types/organization';

import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: IPosition;
  selected: boolean;
  editHref: string;
  onSelectRow: () => void;
  onDeleteRow: () => void;
};

export function PositionTableRow({ row, selected, editHref, onSelectRow, onDeleteRow }: Props) {
  const { t } = useTranslate('organization');
  const menuActions = usePopover();
  const confirmDialog = useBoolean();

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        <li>
          <MenuItem component={RouterLink} href={editHref} onClick={() => menuActions.onClose()}>
            <Iconify icon="solar:pen-bold" />
            {t('position.actions.edit')}
          </MenuItem>
        </li>

        <MenuItem
          onClick={() => {
            confirmDialog.onTrue();
            menuActions.onClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          {t('position.actions.delete')}
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title={t('position.dialogs.delete.title')}
      content={t('position.dialogs.delete.content')}
      action={
        <Button variant="contained" color="error" onClick={onDeleteRow}>
          {t('position.actions.delete')}
        </Button>
      }
    />
  );

  return (
    <>
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
        {/* <TableCell padding="checkbox">
          <Checkbox
            checked={selected}
            onClick={onSelectRow}
            slotProps={{
              input: {
                id: `${row.id}-checkbox`,
                'aria-label': `${row.id} checkbox`,
              },
            }}
          />
        </TableCell> */}
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color={menuActions.open ? 'inherit' : 'default'}
              onClick={menuActions.onOpen}
            >
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Box>
        </TableCell>

        <TableCell>
          <Stack spacing={0.5} sx={{ typography: 'body2' }}>
            <Box component="span" sx={{ color: 'text.primary', fontWeight: 'fontWeightMedium' }}>
              {row?.name || ''}
            </Box>
            {row?.code && (
              <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                Código: {row.code}
              </Box>
            )}
            {row?.version && (
              <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                Versión: {row.version}
              </Box>
            )}
          </Stack>
        </TableCell>

        <TableCell>
          <Stack spacing={0.5} sx={{ typography: 'body2' }}>
            {row?.superiorJob ? (
              <Box component="span" sx={{ color: 'text.primary', fontWeight: 'fontWeightMedium' }}>
                {row.superiorJob.name}
              </Box>
            ) : (
              <Box component="span" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                {t('position.table.noSuperior')}
              </Box>
            )}
          </Stack>
        </TableCell>

        <TableCell>
          <Stack spacing={0.5} sx={{ typography: 'body2' }}>
            {row?.objectives && (
              <Box
                component="span"
                sx={{
                  color: 'text.primary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {row.objectives}
              </Box>
            )}
            {row?.expectedResults && (
              <Box
                component="span"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.875rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                Resultados: {row.expectedResults}
              </Box>
            )}
          </Stack>
        </TableCell>

        <TableCell>
          <Stack spacing={0.5} sx={{ typography: 'body2' }}>
            {row?.requirements && (
              <Box
                component="span"
                sx={{
                  color: 'text.primary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {row.requirements}
              </Box>
            )}
            {row?.otherFunctions && (
              <Box
                component="span"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.875rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                Otras: {row.otherFunctions}
              </Box>
            )}
          </Stack>
        </TableCell>

        <TableCell>
          <Stack spacing={0.5} sx={{ typography: 'body2', fontSize: '0.875rem' }}>
            {row?.minimumAcademicLevel && (
              <Box component="span" sx={{ color: 'text.secondary' }}>
                Mínimo: {row.minimumAcademicLevel}
              </Box>
            )}
            {row?.desiredAcademicLevel && (
              <Box component="span" sx={{ color: 'text.secondary' }}>
                Deseado: {row.desiredAcademicLevel}
              </Box>
            )}
          </Stack>
        </TableCell>

        <TableCell>
          <Stack spacing={0.5} sx={{ typography: 'body2', fontSize: '0.875rem' }}>
            {row?.minimumExperience && (
              <Box component="span" sx={{ color: 'text.secondary' }}>
                Mínimo: {row.minimumExperience}
              </Box>
            )}
            {row?.desiredExperience && (
              <Box component="span" sx={{ color: 'text.secondary' }}>
                Deseado: {row.desiredExperience}
              </Box>
            )}
          </Stack>
        </TableCell>

        <TableCell>
          <Stack spacing={0.5} sx={{ typography: 'body2', fontSize: '0.875rem' }}>
            {row?.regionalLocation && (
              <Box component="span" sx={{ color: 'text.secondary' }}>
                Región: {row.regionalLocation}
              </Box>
            )}
            {row?.headquarters && (
              <Box component="span" sx={{ color: 'text.secondary' }}>
                Sede: {row.headquarters}
              </Box>
            )}
            {row?.supervises && (
              <Box component="span" sx={{ color: 'text.secondary' }}>
                Supervisa: {row.supervises}
              </Box>
            )}
          </Stack>
        </TableCell>

      </TableRow>

      {renderMenuActions()}
      {renderConfirmDialog()}
    </>
  );
}