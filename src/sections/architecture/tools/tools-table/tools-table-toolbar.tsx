import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';
import Select, { type SelectChangeEvent } from '@mui/material/Select';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { ALL_COLUMNS } from './tools-table-config';

// ----------------------------------------------------------------------

export type ToolTypeOption = { value: number; label: string };

type Props = {
  filters: { name: string };
  onFilters: (name: string, value: string) => void;
  visibleColumns: string[];
  onChangeColumns: (columnId: string) => void;
  type: number | null;
  onTypeChange: (nextType: number | null) => void;
  toolTypeOptions: ToolTypeOption[];
};

export function ToolsTableToolbar({
  filters,
  onFilters,
  visibleColumns,
  onChangeColumns,
  type,
  onTypeChange,
  toolTypeOptions,
}: Props) {
  const { t: tCommon } = useTranslate('common');
  const popover = usePopover();
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  const handleFilterName = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilters('name', event.target.value);
    },
    [onFilters]
  );

  const hasAnyFlowFilter = useMemo(() => type !== null, [type]);

  const handleToggleFilters = useCallback(() => {
    setFiltersOpen((prev) => !prev);
  }, []);

  const handleClearFilters = useCallback(() => {
    onTypeChange(null);
  }, [onTypeChange]);

  const handleTypeChange = useCallback(
    (event: SelectChangeEvent) => {
      const raw = event.target.value;
      if (raw === 'all') {
        onTypeChange(null);
        return;
      }

      const value = Number(raw);
      onTypeChange(Number.isFinite(value) && value > 0 ? value : null);
    },
    [onTypeChange]
  );

  return (
    <>
      <Stack
        spacing={2}
        alignItems={{ xs: 'flex-end', md: 'center' }}
        direction={{ xs: 'column', md: 'row' }}
        sx={{ p: 2.5 }}
      >
        <Stack direction="row" alignItems="center" spacing={2} flexGrow={1} sx={{ width: 1 }}>
          <TextField
            fullWidth
            value={filters.name}
            onChange={handleFilterName}
            placeholder={tCommon('filters.search')}
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
            variant={hasAnyFlowFilter ? 'contained' : 'outlined'}
            startIcon={<Iconify icon="solar:filter-broken" />}
            onClick={handleToggleFilters}
            sx={{ textTransform: 'capitalize' }}
          >
            {tCommon('filters.button')}
          </Button>

          <Button
            color="inherit"
            variant="outlined"
            startIcon={<Iconify icon="solar:settings-bold" />}
            onClick={popover.onOpen}
            sx={{ textTransform: 'capitalize' }}
          >
            {tCommon('table.columns', { defaultValue: 'Columnas' })}
          </Button>
        </Stack>
      </Stack>

      <Collapse in={filtersOpen} timeout="auto" unmountOnExit>
        <Box sx={{ px: 2.5, pb: 2.5 }}>
          <Box
            sx={[
              (theme) => ({
                p: 2,
                borderRadius: 1.5,
                border: `dashed 1px ${theme.vars.palette.divider}`,
                backgroundColor: theme.vars.palette.background.neutral,
              }),
            ]}
          >
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' },
              }}
            >
              <FormControl fullWidth>
                <InputLabel id="tool-flow-type-filter-label">{tCommon('filters.type')}</InputLabel>
                <Select
                  labelId="tool-flow-type-filter-label"
                  value={type !== null ? String(type) : 'all'}
                  label={tCommon('filters.type')}
                  onChange={handleTypeChange}
                >
                  <MenuItem value="all">{tCommon('filters.all')}</MenuItem>
                  {toolTypeOptions.map((opt) => (
                    <MenuItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
              <Button
                color="inherit"
                variant="outlined"
                startIcon={<Iconify icon="solar:restart-bold" />}
                onClick={handleClearFilters}
                disabled={!hasAnyFlowFilter}
                sx={{ textTransform: 'capitalize' }}
              >
                {tCommon('filters.clear')}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Collapse>

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
