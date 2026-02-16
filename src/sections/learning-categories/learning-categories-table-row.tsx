import type { ILearningCategories } from 'src/types/learning';

import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
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
  row: ILearningCategories;
  selected: boolean;
  editHref: string;
  onSelectRow: () => void;
  onDeleteRow: () => void;
};

export function LearningCategoriesTableRow({ row, selected, editHref, onSelectRow, onDeleteRow }: Props) {
  const { t } = useTranslate('learning');
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
            {t('learningCategories.actions.edit')}
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
          {t('learningCategories.actions.delete')}
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title={t('learningCategories.dialogs.delete.title')}
      content={t('learningCategories.dialogs.delete.content')}
      action={
        <Button variant="contained" color="error" onClick={onDeleteRow}>
          {t('learningCategories.actions.delete')}
        </Button>
      }
    />
  );

  return (
    <>
      <TableRow 
        hover 
        selected={selected} 
        aria-checked={selected} 
        tabIndex={-1}
        sx={{
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
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
              sx={{
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Box>
        </TableCell>

        <TableCell>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={row?.logo || undefined}
              alt={row?.name || ''}
              variant="rounded"
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1,
              }}
            >
              {!row?.logo && row?.name?.[0]?.toUpperCase()}
            </Avatar>
            <Stack spacing={0.5}>
              <Box component="span" sx={{ typography: 'body2', fontWeight: 'fontWeightMedium' }}>
                {row?.name || ''}
              </Box>
              <Box component="span" sx={{ color: 'text.secondary', typography: 'caption' }}>
                {row?.abreviation || ''}
              </Box>
            </Stack>
          </Stack>
        </TableCell>

        <TableCell>
          <Box component="span" sx={{ typography: 'body2' }}>
            {row?.abreviation || '-'}
          </Box>
        </TableCell>

        <TableCell align="center">
          {row?.logo ? (
            <Avatar
              src={row.logo}
              alt={row.name || ''}
              variant="rounded"
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1,
                mx: 'auto',
              }}
            />
          ) : (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1,
                border: (theme) => `1px dashed ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'background.neutral',
                mx: 'auto',
              }}
            >
              <Iconify 
                icon="solar:gallery-add-bold" 
                width={20}
                sx={{ color: 'text.disabled' }}
              />
            </Box>
          )}
        </TableCell>

      </TableRow>

      {renderMenuActions()}
      {renderConfirmDialog()}
    </>
  );
}