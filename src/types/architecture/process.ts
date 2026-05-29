// ----------------------------------------------------------------------

export type IProcessTable = {
  id: number;
  nomenclature: string;
  name: string;
  description: string;
  result: string;
  requiresOLA: boolean;
  periodicity: number;
  workload: number;
  cost: number;
  context: string | null;
  status: number | null;
  startDate: string | null;
  endDate: string | null;
  scheduleTask: boolean | null;
  projectStatus: number | null;
  creationDate: string | null;
  modificationDate: string | null;
  taskType: number | null;
  taskDeadline: string | null;
  taskStartDate: string | null;
  taskUpdateDate: string | null;
  fulfillmentAction: string | null;
  reminder: number | null;
  sistemRequirement: string | null;
  createdBy: string | null;
  createdDate: string;
  lastModifiedBy: string | null;
  lastModifiedDate: string;
};

export type IProcessTableFilters = {
  name: string;
  nomenclature: string;
  status: string;
};

export type IProcessTableFilterValue = string | string[];
