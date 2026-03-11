import type { Dayjs } from 'dayjs';
import type { IStrategicObjectiveFilters } from 'src/types/architecture/strategic-objectives';

import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import MenuItem from '@mui/material/MenuItem';
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

import { ALL_COLUMNS } from './strategic-objectives-table-config';

// ----------------------------------------------------------------------

export type ObjectiveTypeOption = { value: number; label: string };

export type ObjectiveFlowFilters = {
  type: number | null;
  objectiveLevel: number | null;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
};

type Props = {
  filters: IStrategicObjectiveFilters;
  onFilters: (name: string, value: string) => void;
  visibleColumns: string[];
  onChangeColumns: (columnId: string) => void;
  objectiveTypeOptions: ObjectiveTypeOption[];
  flowFilters: ObjectiveFlowFilters;
  onFlowFilters: (next: Partial<ObjectiveFlowFilters>) => void;
};

export function StrategicObjectivesTableToolbar({
  filters,
  onFilters,
  visibleColumns,
  onChangeColumns,
  objectiveTypeOptions,
  flowFilters,
  onFlowFilters,
}: Props) {
  const { t } = useTranslate('common');
  const popover = usePopover();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const handleFilterName = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilters('name', event.target.value);
    },
    [onFilters]
  );

  const hasAnyFlowFilter = useMemo(() => !!flowFilters.type || !!flowFilters.objectiveLevel || !!flowFilters.startDate || !!flowFilters.endDate, [flowFilters.endDate, flowFilters.objectiveLevel, flowFilters.startDate, flowFilters.type]);

  const handleToggleFilters = useCallback(() => {
    setFiltersOpen((prev) => !prev);
  }, []);

  const handleClearFlowFilters = useCallback(() => {
    onFlowFilters({
      type: null,
      objectiveLevel: null,
      startDate: null,
      endDate: null,
    });
  }, [onFlowFilters]);

  const handleTypeChange = useCallback(
    (event: SelectChangeEvent) => {
      const value = Number(event.target.value);
      onFlowFilters({ type: Number.isFinite(value) && value > 0 ? value : null });
    },
    [onFlowFilters]
  );

  const handleObjectiveLevelChange = useCallback(
    (event: SelectChangeEvent) => {
      const value = Number(event.target.value);
      onFlowFilters({ objectiveLevel: Number.isFinite(value) && value > 0 ? value : null });
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
            value={filters.name}
            onChange={handleFilterName}
            placeholder={t('filters.search')}
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
            {t('filters.button', { defaultValue: 'Filtros' })}
          </Button>

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
                <InputLabel id="objective-type-filter-label">{t('filters.type')}</InputLabel>
                <Select
                  labelId="objective-type-filter-label"
                  value={flowFilters.type ? String(flowFilters.type) : '0'}
                  label={t('filters.type')}
                  onChange={handleTypeChange}
                >
                  <MenuItem value="0">{t('filters.all', { defaultValue: 'Todos' })}</MenuItem>
                  {objectiveTypeOptions.map((opt) => (
                    <MenuItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel id="objective-level-filter-label">{t('filters.level')}</InputLabel>
                <Select
                  labelId="objective-level-filter-label"
                  value={flowFilters.objectiveLevel ? String(flowFilters.objectiveLevel) : '0'}
                  label={t('filters.level')}
                  onChange={handleObjectiveLevelChange}
                >
                  <MenuItem value="0">{t('filters.all', { defaultValue: 'Todos' })}</MenuItem>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <MenuItem key={level} value={String(level)}>
                      {level}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <DatePicker
                label={t('filters.startDate')}
                value={flowFilters.startDate}
                onChange={(newValue) => onFlowFilters({ startDate: newValue ?? null })}
                slotProps={{ textField: { fullWidth: true } }}
              />

              <DatePicker
                label={t('filters.endDate')}
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
                onClick={handleClearFlowFilters}
                disabled={!hasAnyFlowFilter}
                sx={{ textTransform: 'capitalize' }}
              >
                {t('filters.clear')}
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
