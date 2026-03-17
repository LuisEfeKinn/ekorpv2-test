'use client';

import type { Dayjs } from 'dayjs';
import type { Theme, SxProps } from '@mui/material/styles';

import dayjs from 'dayjs';
import { useBoolean, useDebounce } from 'minimal-shared/hooks';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Select, { type SelectChangeEvent } from '@mui/material/Select';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { GetTimeUnitsPaginationService } from 'src/services/architecture/catalogs/timeUnits.service';
import { GetProcessTypesPaginationService } from 'src/services/architecture/catalogs/processTypes.service';
import { GetProcessFlowService, type ProcessFlowParams } from 'src/services/architecture/process/processTable.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ProcessesFlow, type ProcessFlowNode } from '../processes-flow';
import { ProcessCreateEditDrawer } from '../process-create-edit-drawer';

// ----------------------------------------------------------------------

type ProcessesFlowViewProps = {
  sx?: SxProps<Theme>;
};

type SelectOption = { value: number; label: string };

type ProcessFlowFilters = {
  name: string;
  type: number | null;
  requiresOLA: boolean | null;
  status: number | null;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  timeUnitId: number | null;
};

// ----------------------------------------------------------------------

export function ProcessesFlowView({ sx }: ProcessesFlowViewProps) {
  const { t } = useTranslate('architecture');
  const { t: tCommon } = useTranslate('common');
  const createEditDrawer = useBoolean();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProcessFlowNode[]>([]);
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [reloadKey, setReloadKey] = useState(0);

  const [history, setHistory] = useState<ProcessFlowNode[]>([]);

  const requestIdRef = useRef(0);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [processTypeOptions, setProcessTypeOptions] = useState<SelectOption[]>([]);
  const [timeUnitOptions, setTimeUnitOptions] = useState<SelectOption[]>([]);

  const [flowFilters, setFlowFilters] = useState<ProcessFlowFilters>({
    name: '',
    type: null,
    requiresOLA: null,
    status: null,
    startDate: null,
    endDate: null,
    timeUnitId: null,
  });

  const debouncedName = useDebounce(flowFilters.name, 300);

  const openCreate = useCallback(() => {
    setEditingId(undefined);
    createEditDrawer.onTrue();
  }, [createEditDrawer]);

  const openEdit = useCallback((id: number) => {
    setEditingId(id);
    createEditDrawer.onTrue();
  }, [createEditDrawer]);

  const handleSaved = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  const extractList = useCallback((raw: unknown): unknown[] => {
    if (Array.isArray(raw)) {
      if (raw.length > 0 && Array.isArray(raw[0])) return raw[0] as unknown[];
      return raw;
    }
    if (raw && typeof raw === 'object') {
      const record = raw as Record<string, unknown>;
      if (Array.isArray(record.data)) return record.data;
    }
    return [];
  }, []);

  const mapOptions = useCallback((items: unknown[]): SelectOption[] => {
    const isRecord = (value: unknown): value is Record<string, unknown> =>
      !!value && typeof value === 'object';

    return items
      .map((item) => {
        if (!isRecord(item)) return null;
        const id = Number(item.id);
        if (!Number.isFinite(id) || id <= 0) return null;

        const labelCandidate = item.name ?? item.typeName ?? item.code ?? item.description;
        const label = String(labelCandidate ?? `#${id}`);
        return { value: id, label };
      })
      .filter((opt): opt is SelectOption => !!opt);
  }, []);

  const loadFilterOptions = useCallback(async () => {
    try {
      const [typesRes, timeUnitsRes] = await Promise.all([
        GetProcessTypesPaginationService({ page: 1, perPage: 200 }),
        GetTimeUnitsPaginationService({ page: 1, perPage: 200 }),
      ]);

      const types = mapOptions(extractList(typesRes?.data));
      const timeUnits = mapOptions(extractList(timeUnitsRes?.data));

      setProcessTypeOptions(types);
      setTimeUnitOptions(timeUnits);
    } catch {
      setProcessTypeOptions([]);
      setTimeUnitOptions([]);
    }
  }, [extractList, mapOptions]);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  const handleFlowFilters = useCallback(
    (next: Partial<ProcessFlowFilters>) => {
      setFlowFilters((prev) => {
        const merged: ProcessFlowFilters = { ...prev, ...next };

        if (merged.startDate && merged.endDate && merged.endDate.isBefore(merged.startDate, 'day')) {
          toast.error(
            tCommon('filters.dateRangeError', {
              defaultValue: 'End date cannot be before start date',
            })
          );
          return { ...merged, endDate: null };
        }

        return merged;
      });
    },
    [tCommon]
  );

  const flowParams = useMemo(() => {
    const params: ProcessFlowParams = {};

    const name = debouncedName.trim();
    if (name) params.name = name;
    if (flowFilters.type !== null) params.type = flowFilters.type;
    if (flowFilters.requiresOLA !== null) params.requiresOLA = flowFilters.requiresOLA;
    if (flowFilters.status !== null) params.status = flowFilters.status;
    if (flowFilters.timeUnitId !== null) params.timeUnitId = flowFilters.timeUnitId;
    if (flowFilters.startDate) params.startDate = dayjs(flowFilters.startDate).format('YYYY-MM-DD');
    if (flowFilters.endDate) params.endDate = dayjs(flowFilters.endDate).format('YYYY-MM-DD');

    return Object.keys(params).length ? params : undefined;
  }, [
    debouncedName,
    flowFilters.endDate,
    flowFilters.requiresOLA,
    flowFilters.startDate,
    flowFilters.status,
    flowFilters.timeUnitId,
    flowFilters.type,
  ]);

  const loadData = useCallback(async () => {
    const requestId = (requestIdRef.current += 1);
    try {
      setLoading(true);
      const response = await GetProcessFlowService(flowParams);
      if (requestId !== requestIdRef.current) return;

      const nextData = Array.isArray(response?.data) ? response.data : [];
      setData(nextData);
    } catch (error) {
      console.error('Error loading process flow:', error);
      if (requestId !== requestIdRef.current) return;
      setData([]);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [flowParams]);

  useEffect(() => {
    loadData();
  }, [loadData, reloadKey]);

  useEffect(() => {
    setHistory([]);
  }, [flowParams]);

  const handleNodeDoubleClick = useCallback((node: ProcessFlowNode) => {
    setHistory((prev) => [...prev, node]);
  }, []);

  const handleGoBack = useCallback(() => {
    setHistory((prev) => prev.slice(0, -1));
  }, []);

  const handleResetView = useCallback(() => {
    setHistory([]);
  }, []);

  const focusedNode = history.length > 0 ? history[history.length - 1] : null;

  const visibleData = useMemo(() => {
    if (focusedNode) {
      // If we are focused on a node, we show its children as roots
      return focusedNode.children || [];
    }
    // Otherwise we show the root data
    return data;
  }, [data, focusedNode]);

  if (loading) {
    return <LoadingScreen />;
  }

  const hasAnyFilter = !!flowFilters.name.trim()
    || flowFilters.type !== null
    || flowFilters.requiresOLA !== null
    || flowFilters.status !== null
    || flowFilters.timeUnitId !== null
    || !!flowFilters.startDate
    || !!flowFilters.endDate;

  const handleToggleFilters = () => setFiltersOpen((prev) => !prev);

  const handleClearFilters = () => {
    setFlowFilters({
      name: '',
      type: null,
      requiresOLA: null,
      status: null,
      startDate: null,
      endDate: null,
      timeUnitId: null,
    });
  };

  const parseNullableNumber = (raw: string): number | null => {
    if (raw === 'all') return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const handleTypeChange = (event: SelectChangeEvent) =>
    handleFlowFilters({ type: parseNullableNumber(event.target.value) });

  const handleStatusChange = (event: SelectChangeEvent) =>
    handleFlowFilters({ status: parseNullableNumber(event.target.value) });

  const handleTimeUnitChange = (event: SelectChangeEvent) =>
    handleFlowFilters({ timeUnitId: parseNullableNumber(event.target.value) });

  const handleRequiresOlaChange = (event: SelectChangeEvent) => {
    const raw = event.target.value;
    if (raw === 'all') {
      handleFlowFilters({ requiresOLA: null });
      return;
    }
    if (raw === 'true') {
      handleFlowFilters({ requiresOLA: true });
      return;
    }
    if (raw === 'false') {
      handleFlowFilters({ requiresOLA: false });
      return;
    }
    handleFlowFilters({ requiresOLA: null });
  };

  return (
    <Container maxWidth="xl">
      <Stack spacing={3}>
        <CustomBreadcrumbs
          heading={t('process.table.title')}
          links={[
            {
              name: t('process.table.breadcrumbs.dashboard'),
              href: paths.dashboard.root,
            },
            {
              name: t('process.table.title'),
              href: paths.dashboard.architecture.processesTable,
            },
            {
              name: t('process.map.title'),
              onClick: history.length > 0 ? handleResetView : undefined,
            },
            ...history.map((node, index) => ({
              name: node.data.name || node.label,
              onClick:
                index < history.length - 1
                  ? () => setHistory((prev) => prev.slice(0, index + 1))
                  : undefined,
            })),
          ]}
          action={
            <Stack direction="row" spacing={1}>
              <Button
                href={paths.dashboard.architecture.processesTable}
                variant="outlined"
                startIcon={<Iconify icon="solar:list-bold" />}
              >
                {t('process.table.title')}
              </Button>
              <Button
                onClick={openCreate}
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
              >
                {t('process.table.actions.add')}
              </Button>
            </Stack>
          }
          sx={{
            mb: { xs: 2, md: 3 },
          }}
        />

        <Card>
          <Stack
            spacing={2}
            alignItems={{ xs: 'flex-end', md: 'center' }}
            direction={{ xs: 'column', md: 'row' }}
            sx={{ p: 2.5 }}
          >
            <Stack direction="row" alignItems="center" spacing={2} sx={{ flexGrow: 1, width: 1 }}>
              <TextField
                fullWidth
                value={flowFilters.name}
                onChange={(event) => handleFlowFilters({ name: event.target.value })}
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
                variant={hasAnyFilter ? 'contained' : 'outlined'}
                startIcon={<Iconify icon="solar:filter-broken" />}
                onClick={handleToggleFilters}
                sx={{ textTransform: 'capitalize' }}
              >
                {tCommon('filters.button')}
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
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
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
                    onChange={(newValue) => handleFlowFilters({ startDate: newValue ?? null })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />

                  <DatePicker
                    label={tCommon('filters.endDate')}
                    value={flowFilters.endDate}
                    onChange={(newValue) => handleFlowFilters({ endDate: newValue ?? null })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Box>

                <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
                  <Button
                    color="inherit"
                    variant="outlined"
                    startIcon={<Iconify icon="solar:restart-bold" />}
                    onClick={handleClearFilters}
                    disabled={!hasAnyFilter}
                    sx={{ textTransform: 'capitalize' }}
                  >
                    {tCommon('filters.clear')}
                  </Button>
                </Stack>
              </Box>
            </Box>
          </Collapse>
        </Card>

        {visibleData.length > 0 ? (
            <ProcessesFlow
                data={visibleData}
                onEditProcess={openEdit}
                onNodeDoubleClick={handleNodeDoubleClick}
                reloadKey={reloadKey}
                sx={sx}
                onBack={history.length > 0 ? handleGoBack : undefined}
                parentLabel={focusedNode ? (focusedNode.data.name || focusedNode.label) : undefined}
            />
        ) : (
             <EmptyContent title={t('process.table.table.emptyState.noData')} />
        )}
      </Stack>

      <ProcessCreateEditDrawer
        open={createEditDrawer.value}
        onClose={createEditDrawer.onFalse}
        processId={editingId}
        onSaved={handleSaved}
      />
    </Container>
  );
}
