'use client';

import type { IconifyName } from 'src/components/iconify/register-icons';
import type { IConfigureEvaluation, IConfigureEvaluationTableFilters } from 'src/types/performance';

import { useState, useEffect, useCallback } from 'react';
import { useBoolean, useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  LaunchEvaluationCampaignService,
  CancelEvaluationCampaignService,
  DeleteConfigureEvaluationService,
  GetConfigureEvaluationsPaginationService,
} from 'src/services/performance/configure-evaluations.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { TablePaginationCustom } from 'src/components/table';
import { Chart, useChart, ChartLegends } from 'src/components/chart';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { EvaluationDrawer } from '../drawer/evaluation-drawer';
import { ConfigureEvaluationsCard } from '../configure-evaluations-card';
import { ConfigureEvaluationsTableToolbar } from '../configure-evaluations-table-toolbar';
import { ConfigureEvaluationsTableFiltersResult } from '../configure-evaluations-table-filters-result';

// ----------------------------------------------------------------------

type TypeColor = 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';

// ── Stat widget ──────────────────────────────────────────────────────────────

type StatWidgetProps = {
  title: string;
  value: number | string;
  icon: IconifyName;
  color: TypeColor;
  subtitle?: string;
};

function EvalStatWidget({ title, value, icon, color }: StatWidgetProps) {
  const theme = useTheme();

  return (
    <Card
      sx={{
        p: 2,
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'none',
        border: `1px solid ${alpha(theme.palette[color].main, 0.12)}`,
      }}
    >
      {/* Decorative rotated gradient — patrón Minimal Kit */}
      <Box
        sx={{
          top: -44,
          width: 160,
          zIndex: 0,
          height: 160,
          right: -104,
          opacity: 0.12,
          borderRadius: 3,
          position: 'absolute',
          transform: 'rotate(40deg)',
          background: `linear-gradient(to right, ${theme.palette[color].main}, transparent)`,
        }}
      />

      <Avatar
        sx={{
          flexShrink: 0,
          width: 48,
          height: 48,
          position: 'relative',
          zIndex: 1,
          bgcolor: alpha(theme.palette[color].main, 0.16),
          color: `${color}.main`,
        }}
      >
        <Iconify icon={icon} width={24} />
      </Avatar>

      <Stack spacing={0.5} sx={{ position: 'relative', zIndex: 1, minWidth: 0 }}>
        <Typography variant="h4" sx={{ lineHeight: 1.2 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {title}
        </Typography>
      </Stack>
    </Card>
  );
}

// ── Status donut chart ───────────────────────────────────────────────────────

type StatusChartProps = {
  completed: number;
  pending: number;
  total: number;
};

function EvalStatusChart({ completed, pending, total }: StatusChartProps) {
  const { t } = useTranslate('performance');
  const theme = useTheme();

  const series = [completed, pending];
  const labels = [
    t('configure-evaluations.charts.completed'),
    t('configure-evaluations.charts.pending'),
  ];
  const colors = [theme.palette.success.main, theme.palette.warning.main];

  const chartOptions = useChart({
    colors,
    labels,
    stroke: { width: 0 },
    legend: { show: false },
    tooltip: {
      y: { formatter: (v: number) => `${v}`, title: { formatter: (s: string) => `${s}: ` } },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '78%',
          labels: {
            show: true,
            total: {
              showAlways: true,
              label: t('configure-evaluations.charts.totalLabel'),
              formatter: (_w: unknown) => String(total),
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
  });

  return (
    <>
      <Chart
        type="donut"
        series={series}
        options={chartOptions}
        sx={{ my: 1.5, mx: 'auto', width: { xs: 140, sm: 160 }, height: { xs: 140, sm: 160 } }}
      />
      <Divider sx={{ borderStyle: 'dashed' }} />
      <ChartLegends
        labels={labels}
        colors={colors}
        values={series.map(String)}
        sx={{ p: 2, justifyContent: 'center' }}
      />
    </>
  );
}

// ── Main view ────────────────────────────────────────────────────────────────


export function ConfigureEvaluationsView() {
  const { t } = useTranslate('performance');

  const drawerOpen = useBoolean();
  const [editingEvaluation, setEditingEvaluation] = useState<IConfigureEvaluation | undefined>(
    undefined
  );

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [tableData, setTableData] = useState<IConfigureEvaluation[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    totalActive: 0,
    totalCompleted: 0,
    totalDraft: 0,
    totalEvaluations: 0,
    totalEvaluationsCompleted: 0,
    totalEvaluationsPending: 0,
  });

  const filters = useSetState<IConfigureEvaluationTableFilters>({
    name: '',
    type: '',
    status: '',
    departmentIds: '',
    positionIds: '',
    employeeIds: '',
  });

  const canReset =
    !!filters.state.name ||
    !!filters.state.type ||
    !!filters.state.status ||
    filters.state.departmentIds.length > 0 ||
    filters.state.positionIds.length > 0 ||
    filters.state.employeeIds.length > 0;

  // ── Data fetching ────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const params: Record<string, unknown> = {
        page: page + 1,
        perPage: rowsPerPage,
      };

      if (filters.state.name) params.search = filters.state.name;
      if (filters.state.type) params.type = filters.state.type;
      if (filters.state.status) params.status = filters.state.status;
      if (filters.state.departmentIds) params.departmentIds = filters.state.departmentIds;
      if (filters.state.positionIds) params.positionIds = filters.state.positionIds;
      if (filters.state.employeeIds) params.employeeIds = filters.state.employeeIds;

      const response = await GetConfigureEvaluationsPaginationService(params);
      const raw = response.data;

      if (raw?.data && Array.isArray(raw.data)) {
        setTableData(raw.data);
        setTotalCount(raw.meta?.itemCount ?? raw.data.length);
        if (raw.summary) setSummary(raw.summary);
      } else if (Array.isArray(raw)) {
        setTableData(raw);
        setTotalCount(raw.length);
      }
    } catch (error) {
      console.error('Error loading evaluations:', error);
      toast.error(t('configure-evaluations.messages.error.loading'));
    }
  }, [page, rowsPerPage, filters.state, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleEditRow = useCallback(
    (id: string) => {
      const evaluation = tableData.find((e) => e.id === id);
      setEditingEvaluation(evaluation);
      drawerOpen.onTrue();
    },
    [tableData, drawerOpen]
  );

  const handleLaunchRow = useCallback(
    async (id: string) => {
      try {
        const response = await LaunchEvaluationCampaignService(id);
        toast.success(
          response?.data?.message || t('configure-evaluations.messages.success.launched')
        );
        fetchData();
      } catch (error: unknown) {
        const err = error as { message?: string };
        toast.error(err?.message || t('configure-evaluations.messages.error.launching'));
      }
    },
    [fetchData, t]
  );

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        const response = await DeleteConfigureEvaluationService(id);
        if (response.data.statusCode === 200) {
          toast.success(t('configure-evaluations.messages.success.deleted'));
          fetchData();
        }
      } catch (error: unknown) {
        const err = error as { message?: string };
        toast.error(t(err?.message || 'configure-evaluations.messages.error.deleting'));
      }
    },
    [fetchData, t]
  );

  const handleCancelRow = useCallback(
    async (id: string) => {
      try {
        const response = await CancelEvaluationCampaignService(id);
        toast.success(
          response?.data?.message || t('configure-evaluations.messages.success.cancelled')
        );
        fetchData();
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(
          err?.response?.data?.message || t('configure-evaluations.messages.error.cancelling')
        );
      }
    },
    [fetchData, t]
  );

  const handleResetPage = useCallback(() => setPage(0), []);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('configure-evaluations.title')}
        links={[
          {
            name: t('configure-evaluations.breadcrumbs.dashboard'),
            href: paths.dashboard.root,
          },
          {
            name: t('configure-evaluations.breadcrumbs.configureEvaluations'),
            href: paths.dashboard.performance.configureEvaluations,
          },
        ]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => {
              setEditingEvaluation(undefined);
              drawerOpen.onTrue();
            }}
          >
            {t('configure-evaluations.actions.create')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* ── Stats 2×2 + donut chart ─────────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Left: 4 stat cards in 2×2 grid */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={2} sx={{ height: '100%' }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <EvalStatWidget
                title={t('configure-evaluations.stats.total')}
                value={summary.total}
                icon="solar:bill-list-bold"
                color="primary"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <EvalStatWidget
                title={t('configure-evaluations.stats.active')}
                value={summary.totalActive}
                icon="solar:play-circle-bold"
                color="success"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <EvalStatWidget
                title={t('configure-evaluations.stats.completed')}
                value={summary.totalCompleted}
                icon="solar:check-circle-bold"
                color="info"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <EvalStatWidget
                title={t('configure-evaluations.stats.draft')}
                value={summary.totalDraft}
                icon="solar:file-text-bold"
                color="warning"
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Right: donut chart with total */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={t('configure-evaluations.charts.byStatus')}
              subheader={t('configure-evaluations.charts.byStatusSubtitle')}
              sx={{ pb: 0 }}
            />
            <EvalStatusChart
              completed={summary.totalEvaluationsCompleted}
              pending={summary.totalEvaluationsPending}
              total={summary.totalEvaluations}
            />
          </Card>
        </Grid>
      </Grid>

      {/* ── Toolbar & filters ───────────────────────────────────────── */}
      <Card sx={{ mb: 3 }}>
        <ConfigureEvaluationsTableToolbar filters={filters} onResetPage={handleResetPage} />

        {canReset && (
          <ConfigureEvaluationsTableFiltersResult
            filters={filters}
            totalResults={totalCount}
            onResetPage={handleResetPage}
            sx={{ p: 2.5, pt: 0 }}
          />
        )}
      </Card>

      {/* ── Cards grid ──────────────────────────────────────────────── */}
      {tableData.length === 0 ? (
        <Card>
          <EmptyContent
            filled
            title={t('configure-evaluations.table.empty.title')}
            description={t('configure-evaluations.table.empty.description')}
            sx={{ py: 10 }}
          />
        </Card>
      ) : (
        <Grid container spacing={3}>
          {tableData.map((row) => (
            <Grid key={row.id} size={{ xs: 12, sm: 6 }}>
              <ConfigureEvaluationsCard
                row={row}
                onEditRow={() => handleEditRow(row.id)}
                onLaunchRow={() => handleLaunchRow(row.id)}
                onDeleteRow={() => handleDeleteRow(row.id)}
                onCancelRow={() => handleCancelRow(row.id)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── Pagination ──────────────────────────────────────────────── */}
      <TablePaginationCustom
        page={page}
        count={totalCount}
        rowsPerPage={rowsPerPage}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />
    </DashboardContent>

    <EvaluationDrawer
      open={drawerOpen.value}
      onClose={drawerOpen.onFalse}
      currentEvaluation={editingEvaluation}
      onSuccess={fetchData}
    />
    </>
  );
}
