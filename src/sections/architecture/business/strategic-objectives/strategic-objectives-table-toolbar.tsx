import type { IStrategicObjectiveFilters } from 'src/types/architecture/strategic-objectives';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';
import Select, { type SelectChangeEvent } from '@mui/material/Select';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { ALL_COLUMNS } from './strategic-objectives-table-config';

// ----------------------------------------------------------------------

type Props = {
  filters: IStrategicObjectiveFilters;
  onFilters: (name: string, value: string) => void;
  visibleColumns: string[];
  onChangeColumns: (columnId: string) => void;
  searchColumn: string;
  onSearchColumnChange: (columnId: string) => void;
};

export function StrategicObjectivesTableToolbar({
  filters,
  onFilters,
  visibleColumns,
  onChangeColumns,
  searchColumn,
  onSearchColumnChange,
}: Props) {
  const { t } = useTranslate('architecture');
  const popover = usePopover();

  const handleFilterName = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilters('name', event.target.value);
    },
    [onFilters]
  );

  const handleChangeSearchColumn = useCallback(
    (event: SelectChangeEvent) => {
      onSearchColumnChange(event.target.value);
    },
    [onSearchColumnChange]
  );

  return (
    <>
      <Stack
        spacing={2}
        alignItems={{ xs: 'flex-end', md: 'center' }}
        direction={{ xs: 'column', md: 'row' }}
        sx={{ p: 2.5 }}
      >
        <Stack direction="row" alignItems="center" spacing={2} sx={{ flexGrow: 1, width: 1 }}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel id="search-column-label">Columna</InputLabel>
            <Select
              labelId="search-column-label"
              value={searchColumn}
              label="Columna"
              onChange={handleChangeSearchColumn}
            >
              {ALL_COLUMNS.map((column) => (
                <MenuItem key={column.id} value={column.id}>
                  {column.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            value={filters.name}
            onChange={handleFilterName}
            placeholder={t('common.search', { defaultValue: `Buscar ${ALL_COLUMNS.find((col) => col.id === searchColumn)?.label || ''}...` })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />

          <Button
            color="inherit"
            variant="outlined"
            startIcon={<Iconify icon="solar:settings-bold" />}
            onClick={popover.onOpen}
            sx={{ textTransform: 'capitalize' }}
          >
            Columnas
          </Button>
        </Stack>
      </Stack>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'top-right' } }}
      >
        <Box sx={{ p: 2, maxWidth: 280 }}>
          <Stack spacing={1}>
            {ALL_COLUMNS.map((column) => (
              <FormControlLabel
                key={column.id}
                control={
                  <Checkbox
                    checked={visibleColumns.includes(column.id)}
                    onChange={() => onChangeColumns(column.id)}
                  />
                }
                label={column.label}
              />
            ))}
          </Stack>
        </Box>
      </CustomPopover>
    </>
  );
}
