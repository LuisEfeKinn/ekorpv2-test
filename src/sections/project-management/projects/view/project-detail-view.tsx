'use client';

import type { IAssignment, IProjectDetail } from 'src/types/project-management';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetProjectByIdService } from 'src/services/project-management/project.service';
import { GetAssignmentsPaginationService } from 'src/services/project-management/assignment.service';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ProjectTeamTab } from '../project-team-tab';
import { ProjectTasksTab } from '../project-tasks-tab';
import { ProjectSummaryTab } from '../project-summary-tab';

// ----------------------------------------------------------------------

type TabValue = 'summary' | 'team' | 'tasks';

type Props = {
  id: string;
};

export function ProjectDetailView({ id }: Props) {
  const { t } = useTranslate('project-management');
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentTab = (searchParams.get('tab') as TabValue) ?? 'summary';

  const [project, setProject] = useState<IProjectDetail | null>(null);
  const [topTeam, setTopTeam] = useState<IAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProject = useCallback(async () => {
    setLoading(true);
    try {
      const response = await GetProjectByIdService(id);
      setProject(response.data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchTopTeam = useCallback(async () => {
    const response = await GetAssignmentsPaginationService({ projectId: Number(id), page: 1, perPage: 5 });
    setTopTeam(response.data?.data ?? []);
  }, [id]);

  useEffect(() => {
    fetchProject();
    fetchTopTeam();
  }, [fetchProject, fetchTopTeam]);

  const handleTabChange = (_: React.SyntheticEvent, value: TabValue) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.replace(`${paths.dashboard.projectManagement.projectDetail(id)}?${params.toString()}`);
  };

  if (loading || !project) {
    return (
      <DashboardContent>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  const isTasksTab = currentTab === 'tasks';

  return (
    <DashboardContent disablePadding={isTasksTab} sx={isTasksTab ? { pt: 'var(--layout-dashboard-content-pt)' } : {}}>
      <Box sx={isTasksTab ? { px: 'var(--layout-dashboard-content-px)' } : {}}>
        <CustomBreadcrumbs
          heading={project.name}
          links={[
            { name: t('projects.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('projects.breadcrumbs.projectManagement') },
            { name: t('projects.breadcrumbs.projects'), href: paths.dashboard.projectManagement.projects },
            { name: project.name },
          ]}
          sx={{ mb: 3 }}
        />

        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          sx={{ mb: 3, borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}` }}
        >
          <Tab value="summary" label={t('detail.tabs.summary')} />
          <Tab value="team" label={t('detail.tabs.team')} />
          <Tab value="tasks" label={t('detail.tabs.tasks')} />
        </Tabs>
      </Box>

      {currentTab === 'summary' && <ProjectSummaryTab project={project} topTeam={topTeam} />}
      {currentTab === 'team' && <ProjectTeamTab projectId={id} />}
      {currentTab === 'tasks' && <ProjectTasksTab projectId={id} />}
    </DashboardContent>
  );
}
