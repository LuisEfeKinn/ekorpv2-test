'use client';

import type { IBoard, IAssignment, IProjectDetail } from 'src/types/project-management';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetProjectByIdService } from 'src/services/project-management/project.service';
import { GetAssignmentsPaginationService } from 'src/services/project-management/assignment.service';
import { GetMyBoardsService, GetMyActivitiesKanbanService } from 'src/services/project-management/my-projects.service';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ProjectViewContext } from '../../project-view-context';
import { ProjectTeamTab } from '../../projects/project-team-tab';
import { ProjectTasksTab } from '../../projects/project-tasks-tab';
import { ProjectSummaryTab } from '../../projects/project-summary-tab';

// ----------------------------------------------------------------------

type TabValue = 'summary' | 'team' | 'tasks';

type Props = {
  id: string;
};

export function MyProjectDetailView({ id }: Props) {
  const { t } = useTranslate('project-management');
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentTab = (searchParams.get('tab') as TabValue) ?? 'summary';

  const [project, setProject] = useState<IProjectDetail | null>(null);
  const [topTeam, setTopTeam] = useState<IAssignment[]>([]);
  const [allowedBoards, setAllowedBoards] = useState<IBoard[] | null>(null);
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
    const response = await GetAssignmentsPaginationService({
      projectId: Number(id),
      page: 1,
      perPage: 5,
    });
    setTopTeam(response.data?.data ?? []);
  }, [id]);

  const fetchMyBoards = useCallback(async () => {
    try {
      const res = await GetMyBoardsService(Number(id));
      const boards: IBoard[] = (Array.isArray(res.data) ? res.data : []).map((b: any) => ({
        id: String(b.id),
        projectId: String(b.projectId),
        name: b.name,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      }));
      setAllowedBoards(boards);
    } catch {
      setAllowedBoards([]);
    }
  }, [id]);

  useEffect(() => {
    fetchProject();
    fetchTopTeam();
    fetchMyBoards();
  }, [fetchProject, fetchTopTeam, fetchMyBoards]);

  const handleTabChange = (_: React.SyntheticEvent, value: TabValue) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.replace(
      `${paths.dashboard.projectManagement.myProjectDetail(id)}?${params.toString()}`
    );
  };

  const workerPermissions = useMemo(
    () => ({
      canManageTeam: false,
      canViewFinancials: false,
      canManageTasks: project?.isEditable ?? false,
      canManageColumns: false,
      allowedBoards,
      fetchKanban: GetMyActivitiesKanbanService,
    }),
    [project?.isEditable, allowedBoards]
  );

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
    <ProjectViewContext.Provider value={workerPermissions}>
      <DashboardContent
        disablePadding={isTasksTab}
        sx={isTasksTab ? { pt: 'var(--layout-dashboard-content-pt)' } : {}}
      >
        <Box sx={isTasksTab ? { px: 'var(--layout-dashboard-content-px)' } : {}}>
          <CustomBreadcrumbs
            heading={project.name}
            links={[
              { name: t('myProjects.breadcrumbs.dashboard'), href: paths.dashboard.root },
              { name: t('myProjects.breadcrumbs.projectManagement') },
              {
                name: t('myProjects.breadcrumbs.myProjects'),
                href: paths.dashboard.projectManagement.myProjects,
              },
              { name: project.name },
            ]}
            action={
              <Button
                variant="outlined"
                startIcon={<Iconify icon="carbon:chevron-left" width={18} />}
                onClick={() => router.push(paths.dashboard.projectManagement.myProjects)}
              >
                {t('actions.back')}
              </Button>
            }
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
    </ProjectViewContext.Provider>
  );
}
