'use client';

import type { IBoard, IAssignment, IProjectDetail, IActivityListItem } from 'src/types/project-management';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { fDate, fToNow } from 'src/utils/format-time';
import { stringToAvatarColor } from 'src/utils/avatar-color';

import { useTranslate } from 'src/locales';
import { GetProjectByIdService } from 'src/services/project-management/project.service';
import { GetActivitiesListService } from 'src/services/project-management/activity.service';

import { Iconify } from 'src/components/iconify';
import { Chart, useChart } from 'src/components/chart';

import { useProjectView } from '../project-view-context';

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

const ACTIVITY_STATUS_COLOR: Record<string, ChipColor> = {
  TODO: 'default',
  IN_PROGRESS: 'info',
  IN_TESTING: 'warning',
  DONE: 'success',
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
  boards: IBoard[];
};

export function ProjectSummaryTab({ project, topTeam, boards }: Props) {
  const { t } = useTranslate('project-management');
  const { canViewFinancials } = useProjectView();

  const [recentActivities, setRecentActivities] = useState<IActivityListItem[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>('all');
  const [filteredStats, setFilteredStats] = useState(project.stats);

  useEffect(() => {
    GetActivitiesListService({
      projectId: Number(project.id),
      onlyRoot: true,
      page: 1,
      perPage: 5,
      order: 'activity.updatedAt:desc',
    })
      .then((res) => setRecentActivities(res.data?.data ?? []))
      .catch(() => {});
  }, [project.id]);

  const handleBoardFilter = useCallback(async (boardId: string) => {
    setSelectedBoardId(boardId);
    try {
      const response = await GetProjectByIdService(
        project.id,
        boardId !== 'all' ? Number(boardId) : undefined
      );
      setFilteredStats(response.data?.stats ?? null);
    } catch { /* mantiene stats anteriores */ }
  }, [project.id]);

  const stats = filteredStats;

  const chartLabels = stats?.activitiesByStatus.map((s) => s.name) ?? [];
  const chartSeries = stats?.activitiesByStatus.map((s) => s.count) ?? [];

  const total = stats?.activityCount ?? 1;

  const chartOptions = useChart({
    labels: chartLabels,
    legend: { position: 'right' as const },
    plotOptions: { pie: { donut: { size: '72%' } } },
    tooltip: {
      y: {
        formatter: (val: number) =>
          `${val} actividades (${Math.round((val / total) * 100)}%)`,
      },
    },
  });

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
              {canViewFinancials && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DetailField
                    icon="solar:chart-square-bold-duotone"
                    label={t('detail.summary.fields.reintegroLevel')}
                    value={project.reintegroLevel.name}
                  />
                </Grid>
              )}
              <Grid size={{ xs: 12, sm: 6 }}>
                <DetailField
                  icon="solar:calendar-date-bold"
                  label={t('detail.summary.fields.createdAt')}
                  value={fDate(project.createdAt)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack spacing={0.75}>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>{t('detail.summary.fields.status')}</Typography>
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
              {canViewFinancials && project.generatesIncome && (
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
                    icon="solar:notes-bold-duotone"
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
              label={project.client.isActive ? t('clients.status.active') : t('clients.status.inactive')}
              size="small"
              variant="soft"
              color={project.client.isActive ? 'success' : 'default'}
              sx={{ mt: 0.5 }}
            />
          </Box>
          <Divider />
          <CardContent>
            <Stack spacing={2.5}>
              <DetailField icon="solar:user-id-bold" label={t('detail.summary.fields.nit')} value={project.client.nit} />
              <DetailField icon="solar:letter-bold" label={t('detail.summary.fields.email')} value={project.client.email} />
              <DetailField icon="solar:calendar-date-bold" label={t('detail.summary.fields.createdAt')} value={fDate(project.client.createdAt)} />
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Activity status chart */}
      <Grid size={{ xs: 12, md: 8 }}>
        <Card sx={{ height: '100%' }}>
          <CardHeader
            title={t('detail.summary.taskProgress')}
            subheader={stats ? t('detail.summary.taskProgressSubheader', { progress: stats.progress, count: stats.activityCount }) : undefined}
            action={
              boards.length > 0 && (
                <Select
                  size="small"
                  value={selectedBoardId}
                  onChange={(e) => handleBoardFilter(e.target.value)}
                  sx={{ minWidth: 150 }}
                >
                  <MenuItem value="all">{t('detail.summary.allBoards')}</MenuItem>
                  {boards.map((board) => (
                    <MenuItem key={board.id} value={board.id}>{board.name}</MenuItem>
                  ))}
                </Select>
              )
            }
          />
          {chartSeries.length > 0 ? (
            <Chart
              type="donut"
              series={chartSeries}
              options={chartOptions}
              sx={{ height: 260, py: 2 }}
            />
          ) : (
            <CardContent>
              <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', py: 4 }}>
                Sin datos disponibles
              </Typography>
            </CardContent>
          )}
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
                    <Avatar sx={{ width: 36, height: 36, fontSize: 14, flexShrink: 0, color: '#fff', bgcolor: stringToAvatarColor(String(member.employeeId)) }}>
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

      {/* Recent activity */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader title={t('detail.summary.recentActivity')} />
          <CardContent sx={{ pt: 0 }}>
            {recentActivities.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.disabled', py: 2 }}>
                {t('detail.summary.noActivity')}
              </Typography>
            ) : (
              <Stack divider={<Divider />}>
                {recentActivities.map((activity) => (
                  <Stack
                    key={activity.id}
                    direction="row"
                    alignItems="center"
                    spacing={2}
                    sx={{ py: 1.5 }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" noWrap>
                        {activity.name}
                      </Typography>
                      {activity.code && (
                        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                          {activity.code}
                        </Typography>
                      )}
                    </Box>

                    <Chip
                      label={activity.statusName}
                      size="small"
                      variant="soft"
                      color={ACTIVITY_STATUS_COLOR[activity.statusKey] ?? 'default'}
                      sx={{ flexShrink: 0 }}
                    />

                    {activity.assignee ? (
                      <Tooltip title={activity.assignee.fullName} arrow>
                        <Avatar
                          sx={{
                            width: 28,
                            height: 28,
                            fontSize: 11,
                            flexShrink: 0,
                            color: '#fff',
                            bgcolor: stringToAvatarColor(String(activity.assignee.id)),
                          }}
                        >
                          {getInitials(activity.assignee.fullName)}
                        </Avatar>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Sin asignar" arrow>
                        <Avatar sx={{ width: 28, height: 28, flexShrink: 0 }}>
                          <Iconify icon="solar:user-bold" width={16} />
                        </Avatar>
                      </Tooltip>
                    )}

                    <Typography
                      variant="caption"
                      sx={{ color: 'text.disabled', flexShrink: 0, minWidth: 80, textAlign: 'right' }}
                    >
                      {fToNow(activity.createdAt)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            )}
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
