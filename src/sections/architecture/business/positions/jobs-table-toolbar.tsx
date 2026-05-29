import type { IJobFilters } from 'src/types/architecture/jobs';

import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';
import Select, { type SelectChangeEvent } from '@mui/material/Select';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { ALL_COLUMNS } from './jobs-table-config';

// ----------------------------------------------------------------------

export type JobTypeOption = { value: number; label: string };

export type JobFlowFilters = {
  headquarters: string;
  jobTypeId: number | null;
  actorStatus: number | null;
  supervises: string;
};

type Props = {
  filters: IJobFilters;
  onFilters: (name: string, value: string) => void;
  visibleColumns: string[];
  onChangeColumns: (columnId: string) => void;
  jobTypeOptions: JobTypeOption[];
  flowFilters: JobFlowFilters;
  onFlowFilters: (next: Partial<JobFlowFilters>) => void;
};

export function JobsTableToolbar({
  filters,
  onFilters,
  visibleColumns,
  onChangeColumns,
  jobTypeOptions,
  flowFilters,
  onFlowFilters,
}: Props) {
  const { t } = useTranslate('business');
  const popover = usePopover();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const handleFilterName = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilters('name', event.target.value);
    },
    [onFilters]
  );

  const hasAnyFlowFilter = useMemo(
    () =>
      !!flowFilters.headquarters ||
      !!flowFilters.supervises ||
      !!flowFilters.jobTypeId ||
      !!flowFilters.actorStatus,
    [flowFilters.actorStatus, flowFilters.headquarters, flowFilters.jobTypeId, flowFilters.supervises]
  );

  const handleToggleFilters = useCallback(() => {
    setFiltersOpen((prev) => !prev);
  }, []);

  const handleClearFlowFilters = useCallback(() => {
    onFlowFilters({
      headquarters: '',
      jobTypeId: null,
      actorStatus: null,
      supervises: '',
    });
  }, [onFlowFilters]);

  const handleJobTypeChange = useCallback(
    (event: SelectChangeEvent) => {
      const value = Number(event.target.value);
      onFlowFilters({ jobTypeId: Number.isFinite(value) && value > 0 ? value : null });
    },
    [onFlowFilters]
  );

  const handleActorStatusChange = useCallback(
    (event: SelectChangeEvent) => {
      const value = Number(event.target.value);
      onFlowFilters({ actorStatus: Number.isFinite(value) && value > 0 ? value : null });
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
            placeholder={t('common:filters.search')}
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
            {t('common:filters.button', { defaultValue: 'Filtros' })}
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
              <TextField
                fullWidth
                label={t('positions.table.filters.headquarters', { defaultValue: 'Sede' })}
                value={flowFilters.headquarters}
                onChange={(e) => onFlowFilters({ headquarters: e.target.value })}
              />

              <FormControl fullWidth sx={{ position: 'relative' }}>
                <InputLabel id="job-type-filter-label">
                  {t('positions.table.filters.jobType', { defaultValue: 'Tipo de cargo' })}
                </InputLabel>
                <Select
                  labelId="job-type-filter-label"
                  value={flowFilters.jobTypeId ? String(flowFilters.jobTypeId) : '0'}
                  label={t('positions.table.filters.jobType', { defaultValue: 'Tipo de cargo' })}
                  onChange={handleJobTypeChange}
                  input={
                    <OutlinedInput
                      label={t('positions.table.filters.jobType', { defaultValue: 'Tipo de cargo' })}
                      endAdornment={
                        flowFilters.jobTypeId ? (
                          <InputAdornment position="end" sx={{ mr: 1 }}>
                            <IconButton
                              size="small"
                              edge="end"
                              aria-label={t('common:filters.clear', { defaultValue: 'Borrar' })}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onFlowFilters({ jobTypeId: null });
                              }}
                            >
                              <Iconify icon="mingcute:close-line" width={16} />
                            </IconButton>
                          </InputAdornment>
                        ) : undefined
                      }
                    />
                  }
                >
                  <MenuItem value="0" disabled>
                    {t('positions.table.filters.jobTypePlaceholder', { defaultValue: 'Seleccione un tipo' })}
                  </MenuItem>
                  {jobTypeOptions.map((opt) => (
                    <MenuItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ position: 'relative' }}>
                <InputLabel id="actor-status-filter-label">
                  {t('positions.table.filters.actorStatus', { defaultValue: 'Estado' })}
                </InputLabel>
                <Select
                  labelId="actor-status-filter-label"
                  value={flowFilters.actorStatus ? String(flowFilters.actorStatus) : '0'}
                  label={t('positions.table.filters.actorStatus', { defaultValue: 'Estado' })}
                  onChange={handleActorStatusChange}
                  input={
                    <OutlinedInput
                      label={t('positions.table.filters.actorStatus', { defaultValue: 'Estado' })}
                      endAdornment={
                        flowFilters.actorStatus ? (
                          <InputAdornment position="end" sx={{ mr: 1 }}>
                            <IconButton
                              size="small"
                              edge="end"
                              aria-label={t('common:filters.clear', { defaultValue: 'Borrar' })}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onFlowFilters({ actorStatus: null });
                              }}
                            >
                              <Iconify icon="mingcute:close-line" width={16} />
                            </IconButton>
                          </InputAdornment>
                        ) : undefined
                      }
                    />
                  }
                >
                  <MenuItem value="0">{t('common:filters.all', { defaultValue: 'Todos' })}</MenuItem>
                  <MenuItem value="1">
                    {t('positions.table.filters.actorStatusActive', { defaultValue: 'Activo' })}
                  </MenuItem>
                  <MenuItem value="2">
                    {t('positions.table.filters.actorStatusInactive', { defaultValue: 'Inactivo' })}
                  </MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label={t('positions.table.filters.supervises', { defaultValue: 'Supervisa' })}
                value={flowFilters.supervises}
                onChange={(e) => onFlowFilters({ supervises: e.target.value })}
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
                {t('common:filters.clear', { defaultValue: 'Borrar' })}
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
        <Box sx={{ p: 2, maxWidth: 280, maxHeight: 400, overflowY: 'auto' }}>
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
