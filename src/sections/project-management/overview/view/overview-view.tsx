'use client';

import type { IDashboardData, IDashboardDedicationItem } from 'src/types/project-management';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import { alpha, useTheme } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetDashboardService } from 'src/services/project-management/dashboard.service';

import { Iconify } from 'src/components/iconify';
import { Chart, useChart } from 'src/components/chart';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

const getInitials = (name: string) =>
  name.trim().split(' ').slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase();

// ----------------------------------------------------------------------

export function OverviewView() {
  const { t } = useTranslate('project-management');
  const theme = useTheme();
  const [data, setData] = useState<IDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    GetDashboardService()
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  // ── Chart hooks ──────────────────────────────────────────────────────────

  const totalRoles = (data?.roleDistribution ?? []).reduce((acc, r) => acc + r.count, 0);

  const rolesDonutOptions = useChart({
    labels: (data?.roleDistribution ?? []).map((r) =>
      r.name.length > 20 ? `${r.name.slice(0, 18)}…` : r.name
    ),
    legend: { show: true, position: 'right' as const },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              formatter: () => String(totalRoles),
            },
          },
        },
      },
    },
    tooltip: { y: { formatter: (val: number) => `${val} asignaciones` } },
  });

  const expPolarOptions = useChart({
    labels: (data?.experienceLevelDistribution ?? []).map((i) => i.name),
    legend: { show: true, position: 'bottom' as const },
    stroke: { width: 1 },
    fill: { opacity: 0.88 },
    tooltip: { y: { formatter: (val: number) => `${val} empleados` } },
  });

  const importanceHBarOptions = useChart({
    colors: [theme.palette.warning.main],
    xaxis: { categories: (data?.projectsByImportance ?? []).map((i) => i.name) },
    plotOptions: { bar: { horizontal: true, barHeight: '72%', borderRadius: 4 } },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => String(val),
      style: { fontSize: '12px', fontWeight: 700 },
    },
    tooltip: { y: { formatter: (val: number) => `${val} proyectos` } },
    yaxis: { labels: { maxWidth: 80 } },
    grid: { padding: { right: 16 } },
  });

  const incomeHBarOptions = useChart({
    colors: [theme.palette.info.main],
    xaxis: { categories: (data?.projectsByIncomeLevel ?? []).map((i) => i.name) },
    plotOptions: { bar: { horizontal: true, barHeight: '72%', borderRadius: 4 } },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => String(val),
      style: { fontSize: '12px', fontWeight: 700 },
    },
    tooltip: { y: { formatter: (val: number) => `${val} proyectos` } },
    yaxis: { labels: { maxWidth: 80 } },
    grid: { padding: { right: 16 } },
  });

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading || !data) {
    return (
      <DashboardContent>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  const {
    kpis,
    experienceLevelDistribution,
    projectsByImportance,
    projectsByIncomeLevel,
    dedicationCapacity,
    roleDistribution,
    overuseWorkers,
    availableWorkers,
  } = data;

  // Scale: all dedication bars share the same max so the 100% line is visually aligned
  const maxDedication = Math.max(...dedicationCapacity.map((p) => p.totalDedicacion), 100);
  const hasOverflow = dedicationCapacity.some((p) => p.totalDedicacion > 100);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('overview.title')}
        links={[
          { name: t('overview.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('overview.breadcrumbs.projectManagement') },
          { name: t('overview.breadcrumbs.overview') },
        ]}
        sx={{ mb: 3 }}
      />

      <Grid container spacing={3}>

        {/* ── Row 1: KPIs ─────────────────────────────────────────────── */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title={t('overview.kpis.workers')}
            value={kpis.workers.total}
            subtitle={t('overview.kpis.workersSubtitle', { count: kpis.workers.totalAssignments })}
            icon="solar:users-group-two-rounded-bold-duotone"
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title={t('overview.kpis.projects')}
            value={kpis.projects.total}
            subtitle={t('overview.kpis.projectsSubtitle', { count: kpis.projects.highReintegroCount })}
            icon="solar:folder-with-files-bold-duotone"
            color="info"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title={t('overview.kpis.activeAssignments')}
            value={kpis.activeAssignments.active}
            subtitle={t('overview.kpis.activeAssignmentsSubtitle', { total: kpis.activeAssignments.total })}
            icon="solar:clipboard-check-bold-duotone"
            color="warning"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title={kpis.overuse.count === 0 ? t('overview.kpis.overuse') : t('overview.kpis.overuseAlert', { count: kpis.overuse.count })}
            value={kpis.orgChart.active}
            subtitle={t('overview.kpis.orgChartSubtitle', { count: kpis.orgChart.active })}
            icon={kpis.overuse.count === 0 ? 'solar:shield-check-bold-duotone' : 'solar:danger-bold-duotone'}
            color={kpis.overuse.count === 0 ? 'success' : 'error'}
          />
        </Grid>

        {/* ── Row 2: Dedication + Roles polar ─────────────────────────── */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardHeader title={t('overview.charts.dedicationCapacity')} />
            <CardContent>
              {dedicationCapacity.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', py: 4 }}>
                  {t('overview.charts.noData')}
                </Typography>
              ) : (
                <Stack spacing={2.5}>
                  {dedicationCapacity.map((person) => (
                    <DedicationRow key={person.id} person={person} maxValue={maxDedication} />
                  ))}
                  {hasOverflow && (
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ pt: 0.5 }}>
                      <Box sx={{ width: 12, height: 2, bgcolor: 'error.main', borderRadius: 1 }} />
                      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                        Línea = 100% (límite recomendado)
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardHeader title={t('overview.charts.roleDistribution')} />
            {roleDistribution.length === 0 ? (
              <CardContent>
                <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', py: 4 }}>
                  {t('overview.charts.noData')}
                </Typography>
              </CardContent>
            ) : (
              <Chart
                type="donut"
                series={roleDistribution.map((r) => r.count)}
                options={rolesDonutOptions}
                sx={{ height: 340, pb: 2 }}
              />
            )}
          </Card>
        </Grid>

        {/* ── Row 3: Projects distribution + Experience ───────────────── */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardHeader title={t('overview.charts.projectsDistribution')} />
            <CardContent sx={{ pt: 0 }}>
              <Grid container spacing={1}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Chart
                    type="bar"
                    series={[{ name: t('overview.charts.projectsByImportance'), data: projectsByImportance.map((i) => i.count) }]}
                    options={importanceHBarOptions}
                    sx={{ height: 48 + projectsByImportance.length * 56 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Chart
                    type="bar"
                    series={[{ name: t('overview.charts.projectsByIncome'), data: projectsByIncomeLevel.map((i) => i.count) }]}
                    options={incomeHBarOptions}
                    sx={{ height: 48 + projectsByIncomeLevel.length * 56 }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardHeader title={t('overview.charts.experienceLevel')} />
            {experienceLevelDistribution.length === 0 ? (
              <CardContent>
                <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', py: 4 }}>
                  {t('overview.charts.noData')}
                </Typography>
              </CardContent>
            ) : (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <Chart
                  type="polarArea"
                  series={experienceLevelDistribution.map((i) => i.count)}
                  options={expPolarOptions}
                  sx={{ height: 300, width: '100%' }}
                />
              </Box>
            )}
          </Card>
        </Grid>

        {/* ── Row 4: Overuse + Available ───────────────────────────────── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title={t('overview.team.overuse')} />
            <CardContent>
              {overuseWorkers.length === 0 ? (
                <Stack alignItems="center" spacing={1.5} sx={{ py: 1.5 }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: (th) => alpha(th.palette.success.main, 0.12),
                    }}
                  >
                    <Iconify icon="solar:shield-check-bold-duotone" width={30} sx={{ color: 'success.main' }} />
                  </Box>
                  <Typography variant="subtitle2" sx={{ color: 'success.darker' }}>
                    {t('overview.team.overuseEmpty')}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled', textAlign: 'center' }}>
                    Todos los colaboradores tienen una carga balanceada
                  </Typography>
                </Stack>
              ) : (
                <Stack spacing={1.5}>
                  {overuseWorkers.map((w) => (
                    <Stack key={w.id} direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ width: 34, height: 34, fontSize: 12, bgcolor: (th) => alpha(th.palette.error.main, 0.12), color: 'error.main' }}>
                        {getInitials(w.fullName)}
                      </Avatar>
                      <Typography variant="body2" sx={{ flex: 1 }} noWrap>{w.fullName}</Typography>
                      <Chip label={`${w.totalDedicacion}%`} size="small" variant="soft" color="error" />
                    </Stack>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title={t('overview.team.available')} />
            <CardContent>
              {availableWorkers.workers.length === 0 ? (
                <Box
                  sx={{
                    borderRadius: 2,
                    p: 2,
                    bgcolor: (th) => alpha(th.palette.warning.main, 0.08),
                    border: (th) => `1px dashed ${alpha(th.palette.warning.main, 0.3)}`,
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Iconify icon="solar:info-circle-bold-duotone" width={20} sx={{ color: 'warning.main', flexShrink: 0, mt: 0.25 }} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: 'warning.darker', mb: 0.5 }}>
                        Alta ocupación del equipo
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {availableWorkers.message}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {availableWorkers.workers.map((w) => (
                    <Stack key={w.id} direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ width: 34, height: 34, fontSize: 12, bgcolor: (th) => alpha(th.palette.success.main, 0.12), color: 'success.main' }}>
                        {getInitials(w.fullName)}
                      </Avatar>
                      <Typography variant="body2" sx={{ flex: 1 }} noWrap>{w.fullName}</Typography>
                      <Chip label={`${w.totalDedicacion}%`} size="small" variant="soft" color="success" />
                    </Stack>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

      </Grid>
    </DashboardContent>
  );
}

// ── KpiCard ──────────────────────────────────────────────────────────────

type KpiCardProps = {
  title: string;
  value: number;
  subtitle: string;
  icon: string;
  color: 'primary' | 'info' | 'warning' | 'success' | 'error';
};

function KpiCard({ title, value, subtitle, icon, color }: KpiCardProps) {
  return (
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: 'text.disabled', mb: 0.5 }}>{title}</Typography>
            <Typography variant="h3">{value}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
              {subtitle}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 52,
              height: 52,
              flexShrink: 0,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: (th) => alpha(th.palette[color].main, 0.12),
              color: `${color}.main`,
            }}
          >
            <Iconify icon={icon} width={26} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

// ── DedicationRow ────────────────────────────────────────────────────────

type DedicationRowProps = { person: IDashboardDedicationItem; maxValue: number };

function DedicationRow({ person, maxValue }: DedicationRowProps) {
  const pct = person.totalDedicacion;
  const isOver = pct > 100;
  const color = pct >= 90 ? 'error' : pct >= 60 ? 'warning' : 'success';

  // All bars share the same scale: maxValue. The 100% threshold line sits at the
  // same pixel position across every row — (100 / maxValue) * 100 %.
  const thresholdPct = (100 / maxValue) * 100;
  const normalFill = (Math.min(pct, 100) / maxValue) * 100;
  const overflowFill = isOver ? ((pct - 100) / maxValue) * 100 : 0;

  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Avatar
        sx={{
          width: 36,
          height: 36,
          fontSize: 12,
          flexShrink: 0,
          bgcolor: (th) => alpha(th.palette[color].main, 0.12),
          color: `${color}.main`,
        }}
      >
        {getInitials(person.fullName)}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
          <Typography variant="body2" noWrap sx={{ flex: 1, mr: 1 }}>{person.fullName}</Typography>
          <Chip label={`${pct}%`} size="small" variant="soft" color={color} sx={{ flexShrink: 0 }} />
        </Stack>

        {/* Track */}
        <Box sx={{ position: 'relative', height: 8, borderRadius: 1, bgcolor: (th) => alpha(th.palette.grey[500], 0.16) }}>
          {/* Normal fill */}
          <Box
            sx={{
              position: 'absolute',
              left: 0, top: 0, bottom: 0,
              width: `${normalFill}%`,
              bgcolor: `${color}.main`,
              borderRadius: isOver ? '4px 0 0 4px' : 1,
            }}
          />
          {/* Overflow fill (red zone beyond 100%) */}
          {isOver && (
            <Box
              sx={{
                position: 'absolute',
                left: `${thresholdPct}%`,
                top: 0, bottom: 0,
                width: `${overflowFill}%`,
                bgcolor: 'error.dark',
                borderRadius: '0 4px 4px 0',
              }}
            />
          )}
          {/* 100% threshold line — always visible, same position in every row */}
          <Box
            sx={{
              position: 'absolute',
              left: `${thresholdPct}%`,
              top: -4, bottom: -4,
              width: 2,
              bgcolor: 'error.main',
              borderRadius: 0.5,
              zIndex: 1,
            }}
          />
        </Box>
      </Box>
    </Stack>
  );
}
