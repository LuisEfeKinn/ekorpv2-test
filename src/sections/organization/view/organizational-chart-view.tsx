'use client';

import type {
  OrganizationPosition,
  JobOrganigramPosition,
  OrganizationalUnitNode,
  OrganizationalChartData,
} from 'src/types/organizational-chart-position';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetOrganizationalOrganigramService } from 'src/services/organization/organigram.service';
import {
  DeleteJobKmService,
  GetJobsKmTreeService,
} from 'src/services/organization/job-km.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { OrganizationChart } from 'src/components/diagrams';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { PositionCreateDrawer } from '../organization-position-create-drawer';

// ----------------------------------------------------------------------

const DEFAULT_COLOR = '#0288d1';

const transformJobsToOrganizationPosition = (
  job: JobOrganigramPosition,
  parentId?: string
): OrganizationPosition => {
  const vacancies = Math.max(0, job.numberOfPositions - job.employees.length);

  return {
    id: `job-${job.id}`,
    positionId: job.id.toString(),
    name: job.name,
    positionCode: job.code || `JOB-${job.id}`,
    positionImage: null,
    organizationId: job.organizationalUnit?.id || 'default',
    organizationName: job.organizationalUnit?.name || 'Sin organización',
    organizationColor: job.organizationalUnit?.color || DEFAULT_COLOR,
    location: 'N/A',
    hierarchicalLevel: 'N/A',
    requiredEmployees: job.numberOfPositions,
    vacancies,
    parentPositionId: parentId || null,
    parentPositionName: null,
    description: undefined,
    skills: job.competencies?.map((c) => c.name) || [],
    isManagerial: (job.children?.length || 0) > 0,
    assignedEmployees: job.employees.map((emp) => ({
      id: emp.id,
      firstName: emp.fullName.split(' ')[0] || '',
      firstLastName: emp.fullName.split(' ').slice(1).join(' ') || '',
      email: `${emp.id}@example.com`,
      avatarUrl: null,
      isActive: true,
    })),
    children: job.children?.map((child) =>
      transformJobsToOrganizationPosition(child, job.id.toString())
    ),
  };
};

const transformOrgUnitToOrganizationPosition = (
  unit: OrganizationalUnitNode,
  parentId?: string
): OrganizationPosition => ({
  id: `org-${unit.id}`,
  positionId: unit.id,
  name: unit.name,
  positionCode: unit.code,
  positionImage: null,
  organizationId: unit.id,
  organizationName: unit.name,
  organizationColor: unit.color || DEFAULT_COLOR,
  location: 'N/A',
  hierarchicalLevel: 'N/A',
  requiredEmployees: 0,
  vacancies: 0,
  parentPositionId: parentId || null,
  parentPositionName: null,
  description: unit.description || undefined,
  skills: [],
  isManagerial: (unit.children?.length || 0) > 0,
  assignedEmployees: [],
  children: unit.children?.map((child) =>
    transformOrgUnitToOrganizationPosition(child, unit.id)
  ),
});

const calculateTreeMetrics = (
  node: OrganizationPosition,
  depth: number = 0
): { totalPositions: number; totalEmployees: number; totalVacancies: number; maxDepth: number } => {
  let totalPositions = 1;
  let totalEmployees = node.assignedEmployees.length;
  let totalVacancies = node.vacancies;
  let maxDepth = depth;

  if (node.children) {
    node.children.forEach((child) => {
      const metrics = calculateTreeMetrics(child, depth + 1);
      totalPositions += metrics.totalPositions;
      totalEmployees += metrics.totalEmployees;
      totalVacancies += metrics.totalVacancies;
      maxDepth = Math.max(maxDepth, metrics.maxDepth);
    });
  }

  return { totalPositions, totalEmployees, totalVacancies, maxDepth };
};

const extractOrganizations = (
  node: OrganizationPosition
): Array<{ id: string; name: string; color: string }> => {
  const orgs = new Map<string, { id: string; name: string; color: string }>();

  const traverse = (n: OrganizationPosition) => {
    if (n.organizationId && !orgs.has(n.organizationId)) {
      orgs.set(n.organizationId, {
        id: n.organizationId,
        name: n.organizationName,
        color: n.organizationColor,
      });
    }
    if (n.children) n.children.forEach(traverse);
  };

  traverse(node);
  return Array.from(orgs.values());
};

export type OrganigramViewType = 'jobs' | 'organizational';

export function OrganizationalChartView() {
  const { t } = useTranslate('organization');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<OrganizationalChartData | null>(null);
  const [viewType, setViewType] = useState<OrganigramViewType>('jobs');

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editPositionId, setEditPositionId] = useState<string | null>(null);

  const loadChartData = useCallback(async ({ background = false } = {}) => {
    try {
      if (!background) {
        setLoading(true);
      }
      setError(null);

      if (viewType === 'jobs') {
        const response = await GetJobsKmTreeService();
        const jobsData = response.data as JobOrganigramPosition[];

        if (!jobsData || jobsData.length === 0) {
          setChartData(null);
          return;
        }

        const roots = jobsData.map((job) => transformJobsToOrganizationPosition(job));

        const metrics = roots.reduce(
          (acc, r) => {
            const m = calculateTreeMetrics(r);
            return {
              totalPositions: acc.totalPositions + m.totalPositions,
              totalEmployees: acc.totalEmployees + m.totalEmployees,
              totalVacancies: acc.totalVacancies + m.totalVacancies,
              maxDepth: Math.max(acc.maxDepth, m.maxDepth),
            };
          },
          { totalPositions: 0, totalEmployees: 0, totalVacancies: 0, maxDepth: 0 }
        );

        const organizations = roots.flatMap((r) => extractOrganizations(r));
        const uniqueOrgs = Array.from(
          new Map(organizations.map((o) => [o.id, o])).values()
        );

        setChartData({ root: roots, ...metrics, organizations: uniqueOrgs, functionalAreas: [] });
      } else {
        const response = await GetOrganizationalOrganigramService({});
        const orgData = response.data as OrganizationalUnitNode[];

        if (!orgData || orgData.length === 0) {
          setChartData(null);
          return;
        }

        const roots = orgData.map((unit) => transformOrgUnitToOrganizationPosition(unit));

        const metrics = roots.reduce(
          (acc, r) => {
            const m = calculateTreeMetrics(r);
            return {
              totalPositions: acc.totalPositions + m.totalPositions,
              totalEmployees: acc.totalEmployees + m.totalEmployees,
              totalVacancies: acc.totalVacancies + m.totalVacancies,
              maxDepth: Math.max(acc.maxDepth, m.maxDepth),
            };
          },
          { totalPositions: 0, totalEmployees: 0, totalVacancies: 0, maxDepth: 0 }
        );

        const organizations = roots.flatMap((r) => extractOrganizations(r));
        const uniqueOrgs = Array.from(
          new Map(organizations.map((o) => [o.id, o])).values()
        );

        setChartData({ root: roots, ...metrics, organizations: uniqueOrgs, functionalAreas: [] });
      }
    } catch (err) {
      console.error('Error loading organizational chart:', err);
      setError(t('organigrama.messages.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t, viewType]);

  useEffect(() => {
    loadChartData();
  }, [loadChartData]);

  const handleViewTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setViewType(event.target.checked ? 'organizational' : 'jobs');
  };

  const handleCreatePosition = () => {
    setEditPositionId(null);
    setDrawerOpen(true);
  };

  const handleEditPosition = useCallback((position: OrganizationPosition) => {
    setEditPositionId(position.positionId);
    setDrawerOpen(true);
  }, []);

  const handleDeletePosition = useCallback(
    async (position: OrganizationPosition) => {
      try {
        await DeleteJobKmService(position.positionId);
        toast.success(t('organigrama.messages.deleteSuccess'));
        await loadChartData({ background: true });
      } catch (err: any) {
        console.error('Error deleting position:', err);
        const apiMessage =
          err?.response?.data?.message || err?.message;
        toast.error(apiMessage || t('organigrama.messages.deleteError'));
      }
    },
    [loadChartData, t]
  );

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setEditPositionId(null);
  };

  const handleDrawerSuccess = () => {
    handleDrawerClose();
    loadChartData({ background: true });
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box
          sx={{
            minHeight: 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress />
          <Typography variant="body2" sx={{ ml: 2 }}>
            {t('organigrama.messages.loading')}
          </Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2">{error}</Typography>
          <Button size="small" onClick={() => loadChartData()} sx={{ mt: 1 }}>
            {t('common.tryAgain')}
          </Button>
        </Alert>
      );
    }

    const hasData = chartData?.root &&
      (Array.isArray(chartData.root) ? chartData.root.length > 0 : true);

    if (!hasData) {
      return (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">{t('organigrama.messages.noData')}</Typography>
        </Alert>
      );
    }

    return (
      <Box sx={{ height: 'calc(100vh - 250px)', minHeight: 600 }}>
        <OrganizationChart
          data={chartData.root}
          onPositionEdit={viewType === 'jobs' ? handleEditPosition : undefined}
          onPositionDelete={viewType === 'jobs' ? handleDeletePosition : undefined}
        />
      </Box>
    );
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('organigrama.title')}
        links={[
          { name: t('organization.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('organization.breadcrumbs.organizationUnit') },
        ]}
        action={
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={viewType === 'organizational'}
                  onChange={handleViewTypeChange}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Iconify
                    icon={
                      viewType === 'jobs'
                        ? 'solar:case-minimalistic-bold'
                        : 'solar:buildings-2-bold-duotone'
                    }
                    width={18}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {viewType === 'jobs'
                      ? t('organigrama.viewTypes.jobs')
                      : t('organigrama.viewTypes.organizational')}
                  </Typography>
                </Box>
              }
              sx={{
                m: 0,
                bgcolor: 'background.paper',
                px: 2,
                py: 0.5,
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: 'divider',
              }}
            />

            <Button
              component={RouterLink}
              href={paths.dashboard.organizations.organizations}
              variant="outlined"
              size="medium"
              startIcon={<Iconify icon="solar:buildings-2-line-duotone" width={20} />}
              sx={{
                borderColor: 'divider',
                color: 'text.primary',
                bgcolor: 'background.paper',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'primary.lighter',
                  color: 'primary.main',
                },
                fontWeight: 600,
                px: 2.5,
              }}
            >
              {t('organigrama.actions.manageOrganizations')}
            </Button>

            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={handleCreatePosition}
            >
              {t('organigrama.actions.createPosition')}
            </Button>
          </Box>
        }
        sx={{ mb: { xs: 3, md: 4 } }}
      />

      {chartData && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
            },
            gap: 2,
            mb: 3,
          }}
        >
          <Box
            sx={{
              p: 2.5,
              bgcolor: 'background.paper',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.2s ease',
              '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.08)', transform: 'translateY(-2px)' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: 'info.lighter',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Iconify icon="solar:case-minimalistic-bold" width={24} sx={{ color: 'info.dark' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main', lineHeight: 1.2 }}>
                  {chartData.totalPositions || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  {t('organigrama.metrics.totalPositions')}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              p: 2.5,
              bgcolor: 'background.paper',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.2s ease',
              '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.08)', transform: 'translateY(-2px)' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: 'success.lighter',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Iconify
                  icon="solar:users-group-rounded-bold-duotone"
                  width={24}
                  sx={{ color: 'success.dark' }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: 'success.main', lineHeight: 1.2 }}
                >
                  {chartData.totalEmployees || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  {t('organigrama.metrics.activeEmployees')}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              p: 2.5,
              bgcolor: 'background.paper',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.2s ease',
              '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.08)', transform: 'translateY(-2px)' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: 'primary.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Iconify
                  icon="solar:buildings-2-bold-duotone"
                  width={24}
                  sx={{ color: 'primary.dark' }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: 'primary.main', lineHeight: 1.2 }}
                >
                  {chartData.organizations?.length || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  {t('organigrama.metrics.organizations')}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              p: 2.5,
              bgcolor: 'background.paper',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.2s ease',
              '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.08)', transform: 'translateY(-2px)' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: 'warning.lighter',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Iconify
                  icon="solar:user-plus-bold-duotone"
                  width={24}
                  sx={{ color: 'warning.dark' }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: 'warning.main', lineHeight: 1.2 }}
                >
                  {chartData.totalVacancies || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  {t('organigrama.metrics.openVacancies')}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {renderContent()}

      <PositionCreateDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        editPositionId={editPositionId}
        onSuccess={handleDrawerSuccess}
      />
    </DashboardContent>
  );
}
