export type IClient = {
  id: string;
  nit: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type IClientTableFilters = {
  search: string;
  isActive: string;
};

export type IClientResponse = {
  data: IClient[];
  meta: IProjectManagementMeta;
};

export type IProject = {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  importanceLevelId: string;
  importanceLevelName: string;
  sizeId: string;
  sizeName: string;
  complexityId: string;
  complexityName: string;
  generatesIncome: boolean;
  reintegroLevelId: string;
  reintegroLevelName: string;
  statusId: string;
  statusName: string;
  startDate: string;
  endDate: string;
  observations: string | null;
  createdAt: string;
};

export type IProjectTableFilters = {
  search: string;
  statusId: string;
  clientId: string;
  importanceLevelId: string;
};

export type IProjectCreateUpdatePayload = {
  name: string;
  clientId: number;
  importanceLevelId: number;
  sizeId: number;
  complexityId: number;
  generatesIncome: boolean;
  reintegroLevelId: number;
  statusId: number;
  startDate: string;
  endDate: string;
  observations?: string | null;
};

export type IWorker = {
  id: string;
  fullName: string;
  email: string;
  positionId: string | null;
  positionName: string | null;
  experienceLevelId: string | null;
  experienceLevelName: string | null;
  experienceSummary: string;
  experienceYears: number | null;
  experienceYearsInCompany: number | null;
  observations: string | null;
  technologies: string | null;
  workerStatusId: string | null;
  workerStatusName: string | null;
  employmentTypeId: string | null;
  employmentTypeName: string | null;
};

export type IWorkerTableFilters = {
  search: string;
  workerStatusId: string;
  experienceLevelId: string;
  employmentTypeId: string;
};

export type IWorkerUpdatePayload = {
  experienceLevelId?: number | null;
  employmentTypeId?: number | null;
  workerStatusId?: number | null;
  technologies?: string | null;
  observations?: string | null;
  yearsInCompany?: number | null;
  yearsOfExperience?: number | null;
};

// Catalog option — shared shape for most catalogs
export type ICatalogOption = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

// Activity status has an extra `key` field used for Kanban column mapping
export type IActivityStatusOption = ICatalogOption & {
  key: 'TODO' | 'IN_PROGRESS' | 'IN_TESTING' | 'DONE';
};

export type IProjectManagementMeta = {
  page: number;
  perPage: number;
  itemCount: number;
  pageCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type IProjectStats = {
  activityCount: number;
  progress: number;
  workersAssignedCount: number;
  activitiesByStatus: { id: string; name: string; key: string; count: number }[];
};

export type IActivityListItem = {
  id: number;
  name: string;
  code: string | null;
  statusId: number;
  statusName: string;
  statusKey: string;
  assignee: { id: number; fullName: string } | null;
  createdAt: string;
};

// Project detail (GET /project-management/projects/:id)
export type IProjectDetail = {
  id: string;
  name: string;
  clientId: string;
  importanceLevelId: string;
  sizeId: string;
  complexityId: string;
  generatesIncome: boolean;
  reintegroLevelId: string;
  statusId: string;
  startDate: string;
  endDate: string;
  observations: string | null;
  createdAt: string;
  updatedAt: string;
  stats?: IProjectStats;
  client: {
    id: string;
    nit: string;
    name: string;
    email: string;
    isActive: boolean;
    createdAt: string;
  };
  importanceLevel: ICatalogOption;
  size: ICatalogOption;
  complexity: ICatalogOption;
  reintegroLevel: ICatalogOption;
  status: ICatalogOption;
};

// Assignment (from GET /project-management/assignments list)
export type IAssignment = {
  id: string;
  projectId: string;
  projectName: string;
  employeeId: string;
  employeeFullName: string;
  priorityId: string;
  priorityName: string;
  statusId: string;
  statusName: string;
  dedicacion: number;
  startDate: string;
  endDate: string;
  observations: string | null;
  roles: ICatalogOption[];
  createdAt: string;
};

export type IAssignmentFilters = {
  search: string;
  statusId: string;
  employeeId: string;
};

export type IAssignmentCreatePayload = {
  projectId: number;
  employeeId: number;
  jobPositionIds: number[];
  priorityId: number;
  statusId: number;
  dedicacion: number;
  startDate: string;
  endDate: string;
  observations?: string | null;
};

export type IAssignmentUpdatePayload = Partial<IAssignmentCreatePayload>;

// Dashboard types
export type IDashboardDistributionItem = {
  id: number;
  name: string;
  count: number;
};

export type IDashboardDedicationItem = {
  id: number;
  fullName: string;
  totalDedicacion: number;
};

export type IDashboardData = {
  kpis: {
    workers: { total: number; totalAssignments: number };
    projects: { total: number; highReintegroCount: number };
    activeAssignments: { active: number; total: number };
    overuse: { count: number };
    orgChart: { total: number; active: number };
  };
  orgChartSummary: {
    root: { id: number; fullName: string; directReportsCount: number };
    nodesWithTeam: number;
    capacityAlerts: number;
  };
  experienceLevelDistribution: IDashboardDistributionItem[];
  roleDistribution: IDashboardDistributionItem[];
  projectsByImportance: IDashboardDistributionItem[];
  projectsByIncomeLevel: IDashboardDistributionItem[];
  dedicationCapacity: IDashboardDedicationItem[];
  overuseWorkers: IDashboardDedicationItem[];
  availableWorkers: { workers: IDashboardDedicationItem[]; message: string };
};

// Job position from /api/jobs-km
export type IJobPosition = {
  id: number;
  name: string;
  code: string;
};

// Activities (Kanban)
export type IActivityKanbanActivity = {
  id: number;
  name: string;
  priority: string | null;
  order: number;
  assignee: { id: number; fullName: string } | null;
  startDate: string | null;
  endDate: string | null;
  subtaskCount: { total: number; done: number };
  parentId: number | null;
  createdAt: string;
};

export type IActivityKanbanColumn = {
  statusId: number;
  statusKey: 'TODO' | 'IN_PROGRESS' | 'IN_TESTING' | 'DONE';
  statusName: string;
  activities: IActivityKanbanActivity[];
};

export type IActivityCreatePayload = {
  projectId: number;
  name: string;
  statusId: number;
  assigneeId?: number;
  supervisorIds?: number[];
  parentId?: number;
  startDate?: string;
  endDate?: string;
};

export type IActivityMovePayload = {
  statusId?: number;
  order?: number;
};

export type IMyProject = {
  id: number;
  name: string;
  code: string;
  statusName: string;
  importanceLevelName: string;
  dedicacion: number;
  assignmentStatusName: string;
  roles: string[];
  activityCount: number;
  startDate: string;
  endDate: string;
};

export type IMyProjectResponse = {
  data: IMyProject[];
  meta: IProjectManagementMeta;
};
