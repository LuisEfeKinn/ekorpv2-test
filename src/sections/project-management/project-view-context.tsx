import type { IBoard } from 'src/types/project-management';

import { useContext, createContext } from 'react';

import { GetActivitiesKanbanService } from 'src/services/project-management/activity.service';

// ----------------------------------------------------------------------

type ProjectViewContextValue = {
  canManageTeam: boolean;
  canViewFinancials: boolean;
  canManageTasks: boolean;
  canManageColumns: boolean;
  allowedBoards: IBoard[] | null;
  fetchKanban: (boardId: string) => Promise<any>;
};

const defaultValue: ProjectViewContextValue = {
  canManageTeam: true,
  canViewFinancials: true,
  canManageTasks: true,
  canManageColumns: true,
  allowedBoards: null,
  fetchKanban: GetActivitiesKanbanService,
};

export const ProjectViewContext = createContext<ProjectViewContextValue>(defaultValue);

export const useProjectView = () => useContext(ProjectViewContext);
