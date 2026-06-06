'use client';

import type { IAssignment, IProjectDetail } from 'src/types/project-management';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

type ChipColor = 'default' | 'info' | 'warning' | 'success' | 'error';

const IMPORTANCE_COLOR: Record<string, ChipColor> = {
  '1': 'default',
  '2': 'info',
  '3': 'warning',
  '4': 'error',
};

const STATUS_COLOR: Record<string, ChipColor> = {
  '1': 'info',
  '2': 'warning',
  '3': 'success',
  '4': 'default',
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();

// ----------------------------------------------------------------------

type Props = {
  project: IProjectDetail;
  topTeam: IAssignment[];
};

export function ProjectSummaryTab({ project, topTeam }: Props) {
  const { t } = useTranslate('project-management');

  // Mock task progress — replace when backend provides taskCount per status
  const chartOptions = useChart({
    labels: ['Por hacer', 'En progreso', 'En pruebas', 'Completado'],
    legend: { position: 'right' as const },
    plotOptions: { pie: { donut: { size: '72%' } } },
    tooltip: { y: { formatter: (val: number) => `${val}%` } },
  });

  const mockChartSeries = [30, 25, 15, 30];

  return (
    <Grid container spacing={3}>
      {/* Project details */}
      <Grid size={{ xs: 12, md: 8 }}>
        <Card sx={{ height: '100%' }}>
          <CardHeader title={t('detail.summary.projectDetails')} />
          <CardContent>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailField
                  icon="solar:calendar-date-bold"
                  label={t('detail.summary.fields.dates')}
                  value={`${fDate(project.startDate)} — ${fDate(project.endDate)}`}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailField
                  icon="solar:tag-horizontal-bold-duotone"
                  label={t('detail.summary.fields.size')}
                  value={`${project.size.name} · ${project.complexity.name}`}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailField
                  icon="solar:layers-bold"
                  label={t('detail.summary.fields.reintegroLevel')}
                  value={project.reintegroLevel.name}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailField
                  icon="solar:calendar-add-bold"
                  label={t('detail.summary.fields.createdAt')}
                  value={fDate(project.createdAt)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack spacing={0.75}>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>Estado</Typography>
                  <Chip
                    label={project.status.name}
                    size="small"
                    variant="soft"
                    color={STATUS_COLOR[project.statusId] ?? 'default'}
                    sx={{ width: 'fit-content' }}
                  />
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack spacing={0.75}>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {t('projects.drawer.fields.importanceLevel')}
                  </Typography>
                  <Chip
                    label={project.importanceLevel.name}
                    size="small"
                    variant="soft"
                    color={IMPORTANCE_COLOR[project.importanceLevelId] ?? 'default'}
                    sx={{ width: 'fit-content' }}
                  />
                </Stack>
              </Grid>
              {project.generatesIncome && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack spacing={0.75}>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      {t('detail.summary.fields.profitability')}
                    </Typography>
                    <Chip
                      icon={<Iconify icon="solar:wad-of-money-bold" width={13} />}
                      label={t('projects.card.generatesIncome')}
                      size="small"
                      variant="soft"
                      color="success"
                      sx={{ width: 'fit-content' }}
                    />
                  </Stack>
                </Grid>
              )}
              {project.observations && (
                <Grid size={{ xs: 12 }}>
                  <DetailField
                    icon="solar:notes-bold"
                    label={t('projects.drawer.fields.observations')}
                    value={project.observations}
                  />
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Client info */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card sx={{ height: '100%' }}>
          {/* Cover band — avatar + identity live here; real image fills this area later */}
          <Box
            sx={{
              background: (theme) =>
                `linear-gradient(to bottom, ${alpha(theme.palette.primary.main, 0.15)}, transparent)`,
              px: 2.5,
              pt: 2.5,
              pb: 2,
            }}
          >
            <Avatar sx={{ width: 80, height: 80, fontSize: 28, mt: 2, mb: 1.5 }}>
              {getInitials(project.client.name)}
            </Avatar>
            <Typography variant="subtitle1" fontWeight={600}>{project.client.name}</Typography>
            <Chip
              label={project.client.isActive ? 'Activo' : 'Inactivo'}
              size="small"
              variant="soft"
              color={project.client.isActive ? 'success' : 'default'}
              sx={{ mt: 0.5 }}
            />
          </Box>
          <Divider />
          <CardContent>
            <Stack spacing={2.5}>
              <DetailField icon="solar:card-bold" label={t('detail.summary.fields.nit')} value={project.client.nit} />
              <DetailField icon="solar:letter-bold" label={t('detail.summary.fields.email')} value={project.client.email} />
              <DetailField icon="solar:calendar-add-bold" label={t('detail.summary.fields.createdAt')} value={fDate(project.client.createdAt)} />
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Task progress chart — mock data until backend provides task counts */}
      <Grid size={{ xs: 12, md: 8 }}>
        <Card sx={{ height: '100%' }}>
          <CardHeader
            title={t('detail.summary.taskProgress')}
            subheader={t('detail.summary.noTaskData')}
          />
          <Chart
            type="donut"
            series={mockChartSeries}
            options={chartOptions}
            sx={{ height: 260, py: 2 }}
          />
        </Card>
      </Grid>

      {/* Top team */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card sx={{ height: '100%' }}>
          <CardHeader title={t('detail.summary.topTeam')} />
          <CardContent>
            {topTeam.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', py: 2 }}>
                Sin miembros asignados
              </Typography>
            ) : (
              <Stack spacing={2}>
                {topTeam.slice(0, 5).map((member) => (
                  <Stack key={member.id} direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ width: 36, height: 36, flexShrink: 0 }}>
                      {getInitials(member.employeeFullName)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" noWrap>{member.employeeFullName}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                        {member.roles[0]?.name ?? '—'}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0, fontWeight: 600 }}>
                      {member.dedicacion}%
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Recent activity placeholder */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader title={t('detail.summary.recentActivity')} />
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 1, color: 'text.disabled' }}>
              <Iconify icon="solar:history-bold" width={20} />
              <Typography variant="body2">{t('detail.summary.noActivity')}</Typography>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

// ----------------------------------------------------------------------

type DetailFieldProps = {
  icon: string;
  label: string;
  value: string;
};

function DetailField({ icon, label, value }: DetailFieldProps) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>{label}</Typography>
      <Stack direction="row" spacing={0.75} alignItems="center">
        <Iconify icon={icon} width={14} sx={{ color: 'text.disabled', flexShrink: 0 }} />
        <Typography variant="body2">{value}</Typography>
      </Stack>
    </Stack>
  );
}
