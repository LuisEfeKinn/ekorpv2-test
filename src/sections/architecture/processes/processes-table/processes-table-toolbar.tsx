import type { Dayjs } from 'dayjs';

import React, { useMemo, useState, useCallback } from 'react';

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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import FormControlLabel from '@mui/material/FormControlLabel';
import Select, { type SelectChangeEvent } from '@mui/material/Select';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { ALL_COLUMNS } from './processes-table-config';

// ----------------------------------------------------------------------

export type ProcessTypeOption = { value: number; label: string };

export type TimeUnitOption = { value: number; label: string };

export type ProcessFlowFilters = {
  type: number | null;
  requiresOLA: boolean | null;
  status: number | null;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  timeUnitId: number | null;
};

type Props = {
  name: string;
  onNameChange: (value: string) => void;
  flowFilters: ProcessFlowFilters;
  onFlowFilters: (next: Partial<ProcessFlowFilters>) => void;
  processTypeOptions: ProcessTypeOption[];
  timeUnitOptions: TimeUnitOption[];
  visibleColumns: string[];
  onChangeColumns: (columnId: string) => void;
};

export function ProcessTableToolbar({
  name,
  onNameChange,
  flowFilters,
  onFlowFilters,
  processTypeOptions,
  timeUnitOptions,
  visibleColumns,
  onChangeColumns,
}: Props) {
  const { t } = useTranslate('architecture');
  const { t: tCommon } = useTranslate('common');
  const popover = usePopover();
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  const handleFilterName = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onNameChange(event.target.value);
    },
    [onNameChange]
  );

  const hasAnyFlowFilter = useMemo(
    () =>
      flowFilters.type !== null ||
      flowFilters.requiresOLA !== null ||
      flowFilters.status !== null ||
      flowFilters.timeUnitId !== null ||
      !!flowFilters.startDate ||
      !!flowFilters.endDate,
    [
      flowFilters.endDate,
      flowFilters.requiresOLA,
      flowFilters.startDate,
      flowFilters.status,
      flowFilters.timeUnitId,
      flowFilters.type,
    ]
  );

  const handleToggleFilters = useCallback(() => {
    setFiltersOpen((prev) => !prev);
  }, []);

  const handleClearFilters = useCallback(() => {
    onFlowFilters({
      type: null,
      requiresOLA: null,
      status: null,
      startDate: null,
      endDate: null,
      timeUnitId: null,
    });
  }, [onFlowFilters]);

  const parseNullableNumber = (raw: string): number | null => {
    if (raw === 'all') return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  };

  const handleTypeChange = useCallback(
    (event: SelectChangeEvent) => {
      onFlowFilters({ type: parseNullableNumber(event.target.value) });
    },
    [onFlowFilters]
  );

  const handleStatusChange = useCallback(
    (event: SelectChangeEvent) => {
      const raw = event.target.value;
      if (raw === 'all') {
        onFlowFilters({ status: null });
        return;
      }
      const parsed = Number(raw);
      onFlowFilters({ status: Number.isFinite(parsed) ? parsed : null });
    },
    [onFlowFilters]
  );

  const handleTimeUnitChange = useCallback(
    (event: SelectChangeEvent) => {
      onFlowFilters({ timeUnitId: parseNullableNumber(event.target.value) });
    },
    [onFlowFilters]
  );

  const handleRequiresOlaChange = useCallback(
    (event: SelectChangeEvent) => {
      const raw = event.target.value;
      if (raw === 'all') onFlowFilters({ requiresOLA: null });
      else if (raw === 'true') onFlowFilters({ requiresOLA: true });
      else if (raw === 'false') onFlowFilters({ requiresOLA: false });
    },
    [onFlowFilters]
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
          <TextField
            fullWidth
            value={name}
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
                <InputLabel id="process-flow-type-filter-label">{tCommon('filters.type')}</InputLabel>
                <Select
                  labelId="process-flow-type-filter-label"
                  value={flowFilters.type !== null ? String(flowFilters.type) : 'all'}
                  label={tCommon('filters.type')}
                  onChange={handleTypeChange}
                >
                  <MenuItem value="all">{tCommon('filters.all')}</MenuItem>
                  {processTypeOptions.map((opt) => (
                    <MenuItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel id="process-flow-requires-ola-filter-label">
                  {tCommon('filters.requiresOLA')}
                </InputLabel>
                <Select
                  labelId="process-flow-requires-ola-filter-label"
                  value={
                    flowFilters.requiresOLA === null
                      ? 'all'
                      : flowFilters.requiresOLA
                        ? 'true'
                        : 'false'
                  }
                  label={tCommon('filters.requiresOLA')}
                  onChange={handleRequiresOlaChange}
                >
                  <MenuItem value="all">{tCommon('filters.all')}</MenuItem>
                  <MenuItem value="true">{t('process.table.form.options.yes')}</MenuItem>
                  <MenuItem value="false">{t('process.table.form.options.no')}</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel id="process-flow-status-filter-label">{tCommon('filters.status')}</InputLabel>
                <Select
                  labelId="process-flow-status-filter-label"
                  value={flowFilters.status !== null ? String(flowFilters.status) : 'all'}
                  label={tCommon('filters.status')}
                  onChange={handleStatusChange}
                >
                  <MenuItem value="all">{tCommon('filters.all')}</MenuItem>
                  <MenuItem value="1">{t('process.table.status.active')}</MenuItem>
                  <MenuItem value="0">{t('process.table.status.inactive')}</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel id="process-flow-time-unit-filter-label">{tCommon('filters.timeUnit')}</InputLabel>
                <Select
                  labelId="process-flow-time-unit-filter-label"
                  value={flowFilters.timeUnitId !== null ? String(flowFilters.timeUnitId) : 'all'}
                  label={tCommon('filters.timeUnit')}
                  onChange={handleTimeUnitChange}
                >
                  <MenuItem value="all">{tCommon('filters.all')}</MenuItem>
                  {timeUnitOptions.map((opt) => (
                    <MenuItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <DatePicker
                label={tCommon('filters.startDate')}
                value={flowFilters.startDate}
                onChange={(newValue) => onFlowFilters({ startDate: newValue ?? null })}
                slotProps={{ textField: { fullWidth: true } }}
              />

              <DatePicker
                label={tCommon('filters.endDate')}
                value={flowFilters.endDate}
                onChange={(newValue) => onFlowFilters({ endDate: newValue ?? null })}
                slotProps={{ textField: { fullWidth: true } }}
              />
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
