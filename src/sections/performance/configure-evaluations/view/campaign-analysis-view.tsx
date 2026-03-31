'use client';

import type {
  IRadarCompetency,
  IRelationshipItem,
  ICampaignAnalysisEmployee,
} from 'src/types/performance';

import { useState, useEffect, useCallback } from 'react';
import { usePopover, useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import Autocomplete from '@mui/material/Autocomplete';
import { alpha, useTheme } from '@mui/material/styles';
import LinearProgress from '@mui/material/LinearProgress';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  GetOrganizationalUnitPaginationService,
  normalizeOrganizationalUnitListResponse,
} from 'src/services/organization/organizationalUnit.service';
import {
  ExportCampaignAnalyticsService,
  GetEvaluationListPaginationService,
  GetCampaignAnalyticsCompetencyService,
  GetCampaignRelationshipDistributionService,
} from 'src/services/performance/evaluations-list.service';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { TablePaginationCustom } from 'src/components/table';
import { CustomPopover } from 'src/components/custom-popover';
import { Chart, useChart, ChartLegends } from 'src/components/chart';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

type FilterOption = { id: string; name: string };

type TableFilters = {
  name: string;
  organizationalUnitIds: string[];
  orderDirection: 'ASC' | 'DESC' | '';
};

// ----------------------------------------------------------------------

// ── Participation bar chart ───────────────────────────────────────────────────

function ParticipationBarChart({ data }: { data: IRelationshipItem[] }) {
  const theme = useTheme();
  const { t } = useTranslate('performance');

  const getRelationshipLabel = (rel: string) =>
    t(`campaign-analysis.relationships.${rel}`, { defaultValue: rel });

  const labels = data.map((d) => getRelationshipLabel(d.relationship));

  const chartOptions = useChart({
    colors: [theme.palette.primary.main, theme.palette.warning.main],
    stroke: { width: 2, colors: ['transparent'] },
    xaxis: { categories: labels },
    yaxis: { title: { text: t('campaign-analysis.charts.people') } },
    tooltip: {
      shared: true,
      intersect: false,
      y: { formatter: (v: number) => String(v) },
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '52%',
        dataLabels: { position: 'top' },
      },
    },
    dataLabels: {
      enabled: true,
      offsetY: -18,
      style: { fontSize: '10px', colors: [theme.palette.text.primary] },
    },
    legend: { show: true, position: 'top' as const },
  });

  if (data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
        <Typography variant="body2">{t('campaign-analysis.noData')}</Typography>
      </Box>
    );
  }

  return (
    <Chart
      type="bar"
      series={[
        { name: t('campaign-analysis.charts.assigned'), data: data.map((d) => d.totalAssigned) },
        { name: t('campaign-analysis.charts.responded'), data: data.map((d) => d.totalResponded) },
      ]}
      options={chartOptions}
      sx={{ pl: 1, py: 2.5, pr: 2.5, height: 320 }}
    />
  );
}

// ── Relationship pie chart ────────────────────────────────────────────────────

function RelationshipPieChart({ data }: { data: IRelationshipItem[] }) {
  const theme = useTheme();
  const { t } = useTranslate('performance');

  const getRelationshipLabel = (rel: string) =>
    t(`campaign-analysis.relationships.${rel}`, { defaultValue: rel });

  const labels = data.map((d) => getRelationshipLabel(d.relationship));
  const series = data.map((d) => d.percentage);
  const colors = [
    theme.palette.primary.main,
    theme.palette.info.main,
    theme.palette.warning.main,
    theme.palette.success.main,
    theme.palette.error.main,
    theme.palette.secondary.main,
  ].slice(0, data.length);

  const chartOptions = useChart({
    colors,
    labels,
    stroke: { width: 0 },
    legend: { show: false },
    tooltip: {
      y: { formatter: (v: number) => `${v}%` },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            total: {
              showAlways: true,
              label: t('campaign-analysis.charts.responses'),
              formatter: () => String(data.reduce((acc, d) => acc + d.totalResponses, 0)),
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
  });

  if (data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
        <Typography variant="body2">{t('campaign-analysis.noData')}</Typography>
      </Box>
    );
  }

  return (
    <>
      <Chart
        type="donut"
        series={series}
        options={chartOptions}
        sx={{ mx: 'auto', my: 2, width: { xs: 200, sm: 220 }, height: { xs: 200, sm: 220 } }}
      />
      <Divider sx={{ borderStyle: 'dashed' }} />
      <ChartLegends
        labels={labels}
        colors={colors}
        values={series.map((v) => `${v}%`)}
        sx={{ p: 2.5, justifyContent: 'center', flexWrap: 'wrap' }}
      />
    </>
  );
}

// ── ─────────────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, 'success' | 'warning' | 'info' | 'error' | 'default'> = {
  ACTIVE: 'info',
  DRAFT: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'error',
};

// ----------------------------------------------------------------------

function LoadingBox() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
      <CircularProgress size={32} />
    </Box>
  );
}

// ── Radar chart ───────────────────────────────────────────────────────────────

function RadarChart({ data }: { data: IRadarCompetency[] }) {
  const theme = useTheme();
  const { t } = useTranslate('performance');

  const categories = data.map((d) => d.competenceName);
  const scores = data.map((d) => Math.min(Math.round(d.compliancePercentage), 100));

  const chartOptions = useChart({
    chart: { toolbar: { show: false } },
    stroke: { width: 2 },
    fill: { opacity: 0.48 },
    colors: [theme.palette.primary.main],
    markers: { size: 4 },
    plotOptions: {
      radar: {
        size: 150,
        polygons: {
          strokeColors: alpha(theme.palette.grey[500], 0.32),
          connectorColors: alpha(theme.palette.grey[500], 0.32),
          fill: {
            colors: [alpha(theme.palette.grey[500], 0.08), 'transparent'],
          },
        },
      },
    },
    xaxis: {
      categories,
      labels: {
        style: { fontSize: '11px', colors: theme.palette.text.secondary },
      },
    },
    yaxis: { show: false, min: 0, max: 100, tickAmount: 5 },
    tooltip: {
      y: { formatter: (v: number) => `${v}%` },
    },
  });

  if (data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
        <Typography variant="body2">{t('campaign-analysis.noData')}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 1, pb: 1 }}>
      <Chart
        type="radar"
        series={[{ name: t('campaign-analysis.charts.compliance'), data: scores }]}
        options={chartOptions}
        sx={{ height: 420 }}
      />
    </Box>
  );
}

// ── Competency compliance list ────────────────────────────────────────────────

function CompetencyList({ data }: { data: IRadarCompetency[] }) {
  const theme = useTheme();
  const { t } = useTranslate('performance');

  if (data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
        <Typography variant="body2">{t('campaign-analysis.noData')}</Typography>
      </Box>
    );
  }

  return (
    <Stack divider={<Divider sx={{ borderStyle: 'dashed' }} />} sx={{ px: 2, pb: 2 }}>
      {data.map((item) => {
        const pct = Math.min(Math.round(item.compliancePercentage), 100);
        return (
          <Box key={item.competenceId} sx={{ py: 1.5 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 0.75 }}
            >
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  maxWidth: '70%',
                }}
              >
                {item.competenceName}
              </Typography>
              <Label
                variant="soft"
                color={pct >= 80 ? 'success' : pct >= 60 ? 'warning' : 'error'}
                sx={{ minWidth: 44, justifyContent: 'center', fontSize: '0.68rem' }}
              >
                {pct}%
              </Label>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={pct}
              color={pct >= 80 ? 'success' : pct >= 60 ? 'warning' : 'error'}
              sx={{
                height: 5,
                borderRadius: 1,
                bgcolor: alpha(theme.palette.grey[500], 0.12),
              }}
            />
          </Box>
        );
      })}
    </Stack>
  );
}

// ── Table toolbar ─────────────────────────────────────────────────────────────

function TableToolbar({
  filters,
  onResetPage,
}: {
  filters: { state: TableFilters; setState: (u: Partial<TableFilters>) => void };
  onResetPage: () => void;
}) {
  const { t } = useTranslate('performance');

  const [orgUnitOptions, setOrgUnitOptions] = useState<FilterOption[]>([]);
  const [orgUnitLoading, setOrgUnitLoading] = useState(false);

  const loadOrgUnits = useCallback(async (search: string) => {
    setOrgUnitLoading(true);
    try {
      const res = await GetOrganizationalUnitPaginationService({ page: 1, perPage: 20, search: search || undefined });
      const normalized = normalizeOrganizationalUnitListResponse(res.data);
      setOrgUnitOptions(
        (normalized ?? []).map((u: any) => ({ id: String(u.id), name: u.name }))
      );
    } catch {
      setOrgUnitOptions([]);
    } finally {
      setOrgUnitLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrgUnits('');
  }, [loadOrgUnits]);

  const multiSx = {
    '& .MuiInputBase-root': { flexWrap: 'nowrap', height: 56, overflow: 'hidden' },
    '& .MuiAutocomplete-input': { minWidth: '0 !important' },
  };

  const renderCountTag = (tagValue: FilterOption[]) => (
    <Tooltip
      title={tagValue.map((v) => v.name).join(', ')}
      placement="top"
      arrow
    >
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 24,
          height: 22,
          px: 0.75,
          borderRadius: 3,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          fontSize: '0.68rem',
          fontWeight: 700,
          flexShrink: 0,
          ml: 0.5,
          cursor: 'default',
        }}
      >
        +{tagValue.length}
      </Box>
    </Tooltip>
  );

  return (
    <Stack
      spacing={2}
      direction={{ xs: 'column', md: 'row' }}
      alignItems={{ md: 'center' }}
      sx={{ p: 2.5 }}
    >
      <TextField
        fullWidth
        value={filters.state.name}
        onChange={(e) => {
          filters.setState({ name: e.target.value });
          onResetPage();
        }}
        placeholder={t('evaluations-list.table.toolbar.search')}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          ),
        }}
        sx={{ flexGrow: 1 }}
      />

      <Stack direction="row" spacing={2} sx={{ flexShrink: 0, width: { xs: '100%', md: 'auto' } }}>
        {/* Unidad organizacional */}
        <Autocomplete
          multiple
          options={orgUnitOptions}
          loading={orgUnitLoading}
          getOptionLabel={(opt) => opt.name}
          isOptionEqualToValue={(opt, val) => String(opt.id) === String(val.id)}
          value={orgUnitOptions.filter((o) => filters.state.organizationalUnitIds.includes(o.id))}
          onChange={(_, val) => {
            filters.setState({ organizationalUnitIds: val.map((v) => v.id) });
            onResetPage();
          }}
          onInputChange={(_, val) => loadOrgUnits(val)}
          renderTags={renderCountTag}
          renderOption={(props, option) => (
            <Box component="li" {...props} key={option.id}>
              {option.name}
            </Box>
          )}
          sx={{ ...multiSx, width: { xs: '100%', md: 300 } }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('evaluations-list.table.toolbar.filterByOrganizationalUnit')}
              placeholder={t('evaluations-list.table.filters.organizationalUnit')}
            />
          )}
        />

        {/* Orden */}
        <FormControl sx={{ width: { xs: '100%', md: 160 } }}>
          <Select
            value={filters.state.orderDirection}
            onChange={(e) => {
              filters.setState({ orderDirection: e.target.value as 'ASC' | 'DESC' | '' });
              onResetPage();
            }}
            displayEmpty
            renderValue={(selected) => {
              if (!selected) return t('evaluations-list.table.toolbar.orderDirection');
              return selected === 'ASC'
                ? t('evaluations-list.table.filters.orderAsc')
                : t('evaluations-list.table.filters.orderDesc');
            }}
          >
            <MenuItem value="">
              <em>{t('evaluations-list.table.toolbar.orderDirection')}</em>
            </MenuItem>
            <MenuItem value="ASC">{t('evaluations-list.table.filters.orderAsc')}</MenuItem>
            <MenuItem value="DESC">{t('evaluations-list.table.filters.orderDesc')}</MenuItem>
          </Select>
        </FormControl>
      </Stack>
    </Stack>
  );
}

// ── Employee table ────────────────────────────────────────────────────────────

function EmployeeTable({
  rows,
  page,
  rowsPerPage,
  totalCount,
  dense,
  onDenseChange,
  onPageChange,
  onRowsPerPageChange,
  onViewParticipant,
}: {
  rows: ICampaignAnalysisEmployee[];
  page: number;
  rowsPerPage: number;
  totalCount: number;
  dense: boolean;
  onDenseChange: (val: boolean) => void;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (perPage: number) => void;
  onViewParticipant: (participantId: number) => void;
}) {
  const { t } = useTranslate('performance');

  const getStatusLabel = (status: string) =>
    t(`campaign-analysis.statuses.${status}`, { defaultValue: status });

  return (
    <>
      <TableContainer>
        <Table size={dense ? 'small' : 'medium'}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 48 }} />
              <TableCell sx={{ minWidth: 200 }}>{t('campaign-analysis.table.columns.employee')}</TableCell>
              <TableCell sx={{ minWidth: 160 }}>{t('campaign-analysis.table.columns.jobPosition')}</TableCell>
              <TableCell sx={{ minWidth: 180 }}>{t('campaign-analysis.table.columns.campaign')}</TableCell>
              <TableCell sx={{ minWidth: 120 }}>{t('campaign-analysis.table.columns.dueDate')}</TableCell>
              <TableCell align="center" sx={{ minWidth: 110 }}>{t('campaign-analysis.table.columns.status')}</TableCell>
              <TableCell align="center" sx={{ width: 80 }}>{t('campaign-analysis.table.columns.score')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  {t('campaign-analysis.table.noParticipants')}
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id} hover>
                {/* Acciones */}
                <TableCell>
                  <Tooltip title={t('campaign-analysis.table.viewParticipant')}>
                    <IconButton
                      size="small"
                      onClick={() => onViewParticipant(row.participantId)}
                    >
                      <Iconify icon="solar:eye-bold" />
                    </IconButton>
                  </Tooltip>
                </TableCell>

                {/* Empleado con avatar */}
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Avatar
                      src={row.photoUrl}
                      alt={row.employeeName}
                      sx={{ width: 40, height: 40, fontSize: '1rem', flexShrink: 0 }}
                    >
                      {row.employeeName?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {row.employeeName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {row.organizationalUnitName}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>

                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {row.jobPosition}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography variant="body2">
                    {row.campaignName}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {fDate(row.dueDate, 'DD MMM YYYY')}
                  </Typography>
                </TableCell>

                <TableCell align="center">
                  <Label
                    variant="soft"
                    color={STATUS_COLOR[row.status] ?? 'default'}
                  >
                    {getStatusLabel(row.status)}
                  </Label>
                </TableCell>

                <TableCell align="center">
                  {row.avgScore !== null && row.avgScore !== undefined ? (
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        mx: 'auto',
                        display: 'flex',
                        borderRadius: '50%',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'success.darker',
                        bgcolor: 'success.lighter',
                        fontWeight: 'fontWeightBold',
                        fontSize: '0.8rem',
                      }}
                    >
                      {Number(row.avgScore).toFixed(1)}
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.disabled">
                      —
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePaginationCustom
        page={page}
        count={totalCount}
        rowsPerPage={rowsPerPage}
        dense={dense}
        onChangeDense={(e) => onDenseChange(e.target.checked)}
        onPageChange={(_, newPage) => onPageChange(newPage)}
        onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
      />
    </>
  );
}

// ── Main view ────────────────────────────────────────────────────────────────

type Props = {
  campaignId: string;
};

export function CampaignAnalysisView({ campaignId }: Props) {
  const router = useRouter();
  const { t } = useTranslate('performance');
  const [radarData, setRadarData] = useState<IRadarCompetency[]>([]);
  const [relationshipData, setRelationshipData] = useState<IRelationshipItem[]>([]);
  const [employees, setEmployees] = useState<ICampaignAnalysisEmployee[]>([]);
  const [employeeMeta, setEmployeeMeta] = useState({ itemCount: 0 });
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);
  const [empPage, setEmpPage] = useState(0);
  const [empRowsPerPage, setEmpRowsPerPage] = useState(10);
  const [dense, setDense] = useState(false);
  const [exporting, setExporting] = useState(false);

  const exportPopover = usePopover();

  const filters = useSetState<TableFilters>({
    name: '',
    organizationalUnitIds: [],
    orderDirection: '',
  });

  const handleExport = useCallback(
    async (format: 0 | 1) => {
      setExporting(true);
      exportPopover.onClose();
      try {
        const response = await ExportCampaignAnalyticsService(campaignId, format);
        
        const blob = new Blob([response.data], {
          type: format === 0 
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'application/pdf',
        });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `analisis_campana_${campaignId}_${new Date().getTime()}.${format === 0 ? 'xlsx' : 'pdf'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success(t('campaign-analysis.messages.success.exported'));
      } catch (err) {
        console.error('Error exporting campaign analysis:', err);
        toast.error(t('campaign-analysis.messages.error.exporting'));
      } finally {
        setExporting(false);
      }
    },
    [campaignId, exportPopover, t]
  );

  // ── Fetch charts ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchCharts = async () => {
      setLoadingCharts(true);
      try {
        const [analyticsRes, distributionRes] = await Promise.allSettled([
          GetCampaignAnalyticsCompetencyService(campaignId),
          GetCampaignRelationshipDistributionService(campaignId),
        ]);

        if (analyticsRes.status === 'fulfilled') {
          const raw = analyticsRes.value.data;
          const competencies = raw?.data?.competencies ?? raw?.competencies ?? [];
          setRadarData(Array.isArray(competencies) ? competencies : []);
        }

        if (distributionRes.status === 'fulfilled') {
          const raw = distributionRes.value.data;
          const list = raw?.data ?? raw ?? [];
          setRelationshipData(Array.isArray(list) ? list : []);
        }
      } catch {
        // errores individuales manejados por allSettled
      } finally {
        setLoadingCharts(false);
      }
    };
    fetchCharts();
  }, [campaignId]);

  // ── Fetch employees ─────────────────────────────────────────────────────
  const fetchEmployees = useCallback(async () => {
    setLoadingTable(true);
    try {
      const params: Record<string, any> = {
        page: empPage + 1,
        perPage: empRowsPerPage,
        campaignId,
      };
      if (filters.state.name) params.search = filters.state.name;
      if (filters.state.organizationalUnitIds.length) {
        params.organizationalUnitIds = filters.state.organizationalUnitIds.join(',');
      }
      if (filters.state.orderDirection) params.orderDirection = filters.state.orderDirection;

      const response = await GetEvaluationListPaginationService(params);
      const raw = response.data;
      setEmployees(Array.isArray(raw?.data) ? raw.data : []);
      setEmployeeMeta({ itemCount: raw?.meta?.itemCount ?? 0 });
    } catch {
      setEmployees([]);
    } finally {
      setLoadingTable(false);
    }
  }, [campaignId, empPage, empRowsPerPage, filters.state]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('campaign-analysis.title')}
        links={[
          { name: t('campaign-analysis.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('campaign-analysis.breadcrumbs.campaigns'), href: paths.dashboard.performance.configureEvaluations },
          { name: t('campaign-analysis.breadcrumbs.analysis') },
        ]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:download-bold" />}
            onClick={exportPopover.onOpen}
            disabled={exporting}
          >
            {exporting ? t('campaign-analysis.actions.exporting') : t('campaign-analysis.actions.export')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* ── Fila 1: Radar + Competency list ────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={t('campaign-analysis.charts.radarTitle')}
              subheader={t('campaign-analysis.charts.radarSubheader')}
            />
            {loadingCharts ? <LoadingBox /> : <RadarChart data={radarData} />}
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title={t('campaign-analysis.charts.competenciesTitle')} subheader={t('campaign-analysis.charts.competenciesSubheader')} />
            {loadingCharts ? (
              <LoadingBox />
            ) : (
              <Box sx={{ maxHeight: 460, overflowY: 'auto' }}>
                <CompetencyList data={radarData} />
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* ── Fila 2: Pie distribución + Participación por evaluador ─────── */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={t('campaign-analysis.charts.pieTitle')}
              subheader={t('campaign-analysis.charts.pieSubheader')}
            />
            {loadingCharts ? <LoadingBox /> : <RelationshipPieChart data={relationshipData} />}
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={t('campaign-analysis.charts.barTitle')}
              subheader={t('campaign-analysis.charts.barSubheader')}
            />
            {loadingCharts ? <LoadingBox /> : <ParticipationBarChart data={relationshipData} />}
          </Card>
        </Grid>
      </Grid>

      {/* ── Participants table ──────────────────────────────────────────── */}
      <Card>
        <CardHeader
          title={t('campaign-analysis.table.title')}
          subheader={t('campaign-analysis.table.subheader')}
          sx={{ pb: 1 }}
        />
        <Divider />

        <TableToolbar
          filters={filters}
          onResetPage={() => setEmpPage(0)}
        />

        <Divider sx={{ borderStyle: 'dashed' }} />

        {loadingTable ? (
          <LoadingBox />
        ) : (
          <EmployeeTable
            rows={employees}
            page={empPage}
            rowsPerPage={empRowsPerPage}
            totalCount={employeeMeta.itemCount}
            dense={dense}
            onDenseChange={(val) => setDense(val)}
            onPageChange={(p) => setEmpPage(p)}
            onRowsPerPageChange={(rpp) => {
              setEmpRowsPerPage(rpp);
              setEmpPage(0);
            }}
            onViewParticipant={(participantId) =>
              router.push(paths.dashboard.performance.evaluationByParticipant(String(participantId)))
            }
          />
        )}
      </Card>

      <CustomPopover
        open={exportPopover.open}
        anchorEl={exportPopover.anchorEl}
        onClose={exportPopover.onClose}
        slotProps={{ arrow: { placement: 'top-right' } }}
      >
        <MenuList>
          <MenuItem
            onClick={() => handleExport(0)}
            disabled={exporting}
          >
            <Iconify icon="solar:file-text-bold" />
            {t('campaign-analysis.actions.exportExcel')}
          </MenuItem>

          <MenuItem
            onClick={() => handleExport(1)}
            disabled={exporting}
          >
            <Iconify icon="solar:file-text-bold" />
            {t('campaign-analysis.actions.exportPdf')}
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </DashboardContent>
  );
}
