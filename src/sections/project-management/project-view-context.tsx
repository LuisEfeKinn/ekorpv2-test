import { useContext, createContext } from 'react';

import { GetActivitiesKanbanService } from 'src/services/project-management/activity.service';

// ----------------------------------------------------------------------

type ProjectViewContextValue = {
  canManageTeam: boolean;
  canViewFinancials: boolean;
  canManageTasks: boolean;
  fetchKanban: (projectId: string) => Promise<any>;
};

const defaultValue: ProjectViewContextValue = {
  canManageTeam: true,
  canViewFinancials: true,
  canManageTasks: true,
  fetchKanban: GetActivitiesKanbanService,
};

export const ProjectViewContext = createContext<ProjectViewContextValue>(defaultValue);

export const useProjectView = () => useContext(ProjectViewContext);
