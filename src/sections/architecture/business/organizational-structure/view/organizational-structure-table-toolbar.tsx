import type { ChangeEvent } from 'react';

import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';
import Select, { type SelectChangeEvent } from '@mui/material/Select';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { ALL_COLUMNS } from './organizational-structure-table-config';

// ----------------------------------------------------------------------

type Props = {
  filters: {
    name: string;
    status: string;
  };
  onFilters: (name: 'name', value: string) => void;
  canReset: boolean;
  onResetFilters: () => void;
  visibleColumns: string[];
  onChangeColumns: (columnId: string) => void;
  flowFilters: OrganizationalStructureFlowFilters;
  onFlowFilters: (next: Partial<OrganizationalStructureFlowFilters>) => void;
  orgUnitTypeOptions: OrgUnitTypeOption[];
};

export type OrganizationalStructureFlowFilters = {
  type: number | null;
};

export type OrgUnitTypeOption = {
  value: number;
  label: string;
};

export function OrganizationalStructureTableToolbar({
  filters,
  onFilters,
  canReset,
  onResetFilters,
  visibleColumns,
  onChangeColumns,
  flowFilters,
  onFlowFilters,
  orgUnitTypeOptions,
}: Props) {
  const { t } = useTranslate('organization');
  const { t: tCommon } = useTranslate('common');
  const popover = usePopover();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const handleFilterName = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onFilters('name', event.target.value);
    },
    [onFilters]
  );

  const hasAnyFlowFilter = useMemo(
    () => !!flowFilters.type,
    [flowFilters.type]
  );

  const handleToggleFilters = useCallback(() => {
    setFiltersOpen((prev) => !prev);
  }, []);

  const handleClearFlowFilters = useCallback(() => {
    onFlowFilters({
      type: null,
    });
  }, [onFlowFilters]);

  const handleTypeChange = useCallback(
    (event: SelectChangeEvent) => {
      const value = Number(event.target.value);
      onFlowFilters({ type: Number.isFinite(value) && value > 0 ? value : null });
    },
    [onFlowFilters]
  );

  return (
    <>
      <Stack spacing={2} direction={{ xs: 'column', md: 'row' }} sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={2} flexGrow={1} sx={{ width: 1 }}>
          <TextField
            fullWidth
            value={filters.name}
            onChange={handleFilterName}
            placeholder={tCommon('filters.search')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" />
                </InputAdornment>
              ),
              endAdornment: canReset ? (
                <InputAdornment position="end">
                  <IconButton onClick={onResetFilters}>
                    <Iconify icon="solar:close-circle-bold" />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
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
            {t('organization.table.toolbar.columns')}
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
                gridTemplateColumns: { xs: '1fr', md: '1fr' },
              }}
            >
              <FormControl fullWidth>
                <InputLabel id="organizational-structure-type-filter-label">{tCommon('filters.type')}</InputLabel>
                <Select
                  labelId="organizational-structure-type-filter-label"
                  value={flowFilters.type ? String(flowFilters.type) : '0'}
                  label={tCommon('filters.type')}
                  onChange={handleTypeChange}
                >
                  <MenuItem value="0">{tCommon('filters.all')}</MenuItem>
                  {orgUnitTypeOptions.map((opt) => (
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
                onClick={handleClearFlowFilters}
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
                label={t(column.label)}
              />
            ))}
          </Stack>
        </Box>
      </CustomPopover>
    </>
  );
}
