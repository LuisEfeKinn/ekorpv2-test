'use client';

import type { IAssignment, IWorkerDetail } from 'src/types/project-management';

import { useSetState } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetWorkerByIdService } from 'src/services/project-management/worker.service';
import { GetActivitiesListService } from 'src/services/project-management/activity.service';
import { GetAssignmentsPaginationService } from 'src/services/project-management/assignment.service';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { TablePaginationCustom } from 'src/components/table';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

type ActivityItem = {
  id: number;
  name: string;
  code: string | null;
  statusId: number;
  statusName: string;
  statusKey: string;
  assignee: { id: number; fullName: string } | null;
  startDate: string | null;
  endDate: string | null;
};

type Props = {
  id: string;
};

const PRIORITY_COLOR: Record<string, 'default' | 'info' | 'warning' | 'error'> = {
  '1': 'default',
  '2': 'info',
  '3': 'warning',
  '4': 'error',
};

const PRIORITY_BORDER: Record<string, string> = {
  '1': '#919EAB',
  '2': '#1890FF',
  '3': '#FF9800',
  '4': '#FF4842',
};

const STATUS_COLOR: Record<string, 'success' | 'default' | 'warning'> = {
  '1': 'success',
  '2': 'default',
};

const ACTIVITY_STATUS_COLOR: Record<string, 'default' | 'info' | 'warning' | 'success'> = {
  TODO: 'default',
  IN_PROGRESS: 'info',
  IN_TESTING: 'warning',
  DONE: 'success',
};

export function WorkerDetailView({ id }: Props) {
  const { t } = useTranslate('project-management');
  const router = useRouter();
  const searchParams = useSearchParams();

  const backHref = (() => {
    const projectId = searchParams.get('projectId');
    if (projectId) return `${paths.dashboard.projectManagement.projectDetail(projectId)}?tab=summary`;
    return paths.dashboard.projectManagement.workers;
  })();

  const ASSIGNMENTS_PER_PAGE = 15;

  const [worker, setWorker] = useState<IWorkerDetail | null>(null);
  const [assignments, setAssignments] = useState<IAssignment[]>([]);
  const [totalAssignments, setTotalAssignments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activities, setActivities] = useState<Record<string, ActivityItem[]>>({});
  const [loadingActivities, setLoadingActivities] = useState<Record<string, boolean>>({});

  const pagination = useSetState({ page: 0, rowsPerPage: ASSIGNMENTS_PER_PAGE });

  const fetchWorker = useCallback(async () => {
    try {
      const response = await GetWorkerByIdService(id);
      setWorker(response.data);
    } catch { /* handled by loading state */ }
  }, [id]);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await GetAssignmentsPaginationService({
        employeeId: Number(id),
        page: pagination.state.page + 1,
        perPage: pagination.state.rowsPerPage,
      });
      setAssignments(response.data?.data ?? []);
      setTotalAssignments(response.data?.meta?.itemCount ?? 0);
    } finally {
      setLoading(false);
    }
  }, [id, pagination.state.page, pagination.state.rowsPerPage]);

  useEffect(() => {
    fetchWorker();
  }, [fetchWorker]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleToggle = useCallback(
    async (assignmentId: string, projectId: string) => {
      if (expandedId === assignmentId) {
        setExpandedId(null);
        return;
      }

      setExpandedId(assignmentId);

      if (!activities[assignmentId]) {
        setLoadingActivities((prev) => ({ ...prev, [assignmentId]: true }));
        try {
          const response = await GetActivitiesListService({
            projectId: Number(projectId),
            employerId: Number(id),
            onlyRoot: true,
            page: 1,
            perPage: 50,
          });
          setActivities((prev) => ({ ...prev, [assignmentId]: response.data?.data ?? [] }));
        } finally {
          setLoadingActivities((prev) => ({ ...prev, [assignmentId]: false }));
        }
      }
    },
    [expandedId, activities, id]
  );

  if (loading) {
    return (
      <DashboardContent>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={worker?.fullName || t('workerDetail.title')}
        links={[
          { name: t('workers.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('workers.breadcrumbs.projectManagement') },
          { name: t('workers.breadcrumbs.workers'), href: paths.dashboard.projectManagement.workers },
          { name: worker?.fullName || t('workerDetail.title') },
        ]}
        action={
          <Button
            variant="outlined"
            startIcon={<Iconify icon="carbon:chevron-left" width={18} />}
            onClick={() => router.push(backHref)}
          >
            {t('actions.back')}
          </Button>
        }
        sx={{ mb: 3 }}
      />

      {/* ---- Summary header card ---- */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ md: 'center' }}
          justifyContent="space-between"
          spacing={3}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: 'primary.lighter',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Iconify icon="solar:user-bold" width={28} sx={{ color: 'primary.main' }} />
            </Box>
            <Box>
              <Typography variant="h5">{worker?.fullName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {worker?.positionName ?? t('workerDetail.title')}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={3} divider={<Divider orientation="vertical" flexItem />}>
            <Stack alignItems="center" sx={{ minWidth: 80 }}>
              <Typography variant="h4">{worker?.projectCount ?? 0}</Typography>
              <Typography variant="caption" color="text.secondary">
                {t('workerDetail.summary.projects')}
              </Typography>
            </Stack>

            <Stack alignItems="center" sx={{ minWidth: 80 }}>
              <Typography variant="h4">{worker?.activeProjectCount ?? 0}</Typography>
              <Typography variant="caption" color="text.secondary">
                {t('workerDetail.summary.active')}
              </Typography>
            </Stack>

            <Stack alignItems="center" sx={{ minWidth: 80 }}>
              <Typography
                variant="h4"
                color={(worker?.totalDedicacion ?? 0) > 100 ? 'error.main' : 'text.primary'}
              >
                {worker?.totalDedicacion ?? 0}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('workerDetail.summary.dedication')}
              </Typography>
            </Stack>

            <Stack alignItems="center" sx={{ minWidth: 80 }}>
              <Typography variant="h4">{worker?.pendingActivitiesCount ?? 0}</Typography>
              <Typography variant="caption" color="text.secondary">
                {t('workerDetail.summary.pendingActivities')}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Card>

      {/* ---- Assignment cards ---- */}
      {assignments.length === 0 ? (
        <EmptyContent
          filled
          title={t('workerDetail.empty')}
          sx={{ py: 10 }}
        />
      ) : (
        <Stack spacing={2}>
          {assignments.map((assignment) => {
            const isExpanded = expandedId === assignment.id;
            const assignmentActivities = activities[assignment.id] ?? [];
            const isLoadingActivities = loadingActivities[assignment.id] ?? false;

            return (
              <Card
                key={assignment.id}
                sx={{
                  borderLeft: 4,
                  borderColor: PRIORITY_BORDER[assignment.priorityId] ?? '#919EAB',
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: (theme) => theme.customShadows.z8 },
                }}
              >
                {/* Card header - clickable */}
                <Box
                  sx={{ px: 3, py: 2.5, cursor: 'pointer' }}
                  onClick={() => handleToggle(assignment.id, assignment.projectId)}
                >
                  {/* Row 1: Project name + badges + pending count + chevron */}
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1, flexWrap: 'wrap', gap: 1 }}>
                      <Typography variant="subtitle1" fontWeight="fontWeightBold">
                        {assignment.projectName}
                      </Typography>
                      <Chip
                        label={assignment.priorityName}
                        size="small"
                        variant="soft"
                        color={PRIORITY_COLOR[assignment.priorityId] ?? 'default'}
                      />
                      <Chip
                        label={assignment.statusName}
                        size="small"
                        variant="soft"
                        color={STATUS_COLOR[assignment.statusId] ?? 'default'}
                      />
                      {assignment.pendingActivitiesCount > 0 && (
                        <Chip
                          label={`${assignment.pendingActivitiesCount} ${t('workerDetail.pending')}`}
                          size="small"
                          variant="soft"
                          color="warning"
                        />
                      )}
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
                      <Tooltip title={t('actions.viewProject')}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`${paths.dashboard.projectManagement.projectDetail(assignment.projectId)}?tab=summary&workerId=${id}`);
                          }}
                        >
                          <Iconify icon="solar:forward-bold" width={18} />
                        </IconButton>
                      </Tooltip>
                      <IconButton size="small">
                        <Iconify
                          icon={isExpanded ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'}
                          width={20}
                        />
                      </IconButton>
                    </Stack>
                  </Stack>

                  {/* Row 2: Roles · Dedication · Date */}
                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    alignItems={{ md: 'flex-start' }}
                    sx={{ mt: 1.5 }}
                    spacing={{ xs: 1.5, md: 3 }}
                  >
                    {assignment.roles?.length > 0 && (
                      <Typography variant="body2" color="text.secondary" sx={{ flex: { md: 1 }, minWidth: 0 }}>
                        {assignment.roles.map((r) => r.name).join(', ')}
                      </Typography>
                    )}

                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      alignItems={{ sm: 'center' }}
                      spacing={{ xs: 1, sm: 2.5 }}
                      sx={{ flexShrink: 0 }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ width: { xs: '100%', sm: 150 } }}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(assignment.dedicacion, 100)}
                          color={assignment.dedicacion > 100 ? 'error' : 'primary'}
                          sx={{ flex: 1, height: 6, borderRadius: 1 }}
                        />
                        <Typography variant="body2" fontWeight="fontWeightBold" sx={{ flexShrink: 0 }}>
                          {assignment.dedicacion}%
                        </Typography>
                      </Stack>

                      {(assignment.startDate || assignment.endDate) && (
                        <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
                          {fDate(assignment.startDate)} → {fDate(assignment.endDate)}
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                </Box>

                {/* Expandable activities */}
                <Collapse in={isExpanded}>
                  <Divider />
                  <Box sx={{ px: 3, py: 2 }}>
                    {isLoadingActivities ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : assignmentActivities.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                        {t('workerDetail.noActivities')}
                      </Typography>
                    ) : (
                      <Stack spacing={1}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {t('workerDetail.activities')} ({assignmentActivities.length})
                        </Typography>
                        {assignmentActivities.map((activity) => (
                          <Stack
                            key={activity.id}
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{
                              py: 1.5,
                              px: 2,
                              borderRadius: 1,
                              bgcolor: 'background.neutral',
                            }}
                          >
                            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
                              {activity.code && (
                                <Typography
                                  variant="caption"
                                  color="text.disabled"
                                  fontWeight="fontWeightBold"
                                  sx={{ flexShrink: 0 }}
                                >
                                  {activity.code}
                                </Typography>
                              )}
                              <Typography variant="body2" noWrap>
                                {activity.name}
                              </Typography>
                            </Stack>

                            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexShrink: 0, ml: 2 }}>
                              {activity.endDate && (
                                <Typography variant="caption" color="text.secondary">
                                  {fDate(activity.endDate)}
                                </Typography>
                              )}
                              <Chip
                                label={activity.statusName}
                                size="small"
                                variant="soft"
                                color={ACTIVITY_STATUS_COLOR[activity.statusKey] ?? 'default'}
                              />
                            </Stack>
                          </Stack>
                        ))}
                      </Stack>
                    )}
                  </Box>
                </Collapse>
              </Card>
            );
          })}

          <TablePaginationCustom
            page={pagination.state.page}
            count={totalAssignments}
            rowsPerPage={pagination.state.rowsPerPage}
            onPageChange={(_, newPage) => {
              setExpandedId(null);
              pagination.setState({ page: newPage });
            }}
            onRowsPerPageChange={(e) => {
              setExpandedId(null);
              pagination.setState({ page: 0, rowsPerPage: parseInt(e.target.value, 10) });
            }}
            rowsPerPageOptions={[10, 15, 25]}
          />
        </Stack>
      )}
    </DashboardContent>
  );
}
