
export const ALL_COLUMNS = [
  { id: 'code', label: 'strategicObjectives.table.columns.code' },
  { id: 'name', label: 'strategicObjectives.table.columns.name' },
  { id: 'description', label: 'strategicObjectives.table.columns.description' },
  { id: 'startDate', label: 'strategicObjectives.table.columns.startDate' },
  { id: 'endDate', label: 'strategicObjectives.table.columns.endDate' },
  { id: 'measurementForm', label: 'strategicObjectives.table.columns.measurementForm' },
  { id: 'consequencesOfNotAchieving', label: 'strategicObjectives.table.columns.consequencesOfNotAchieving' },
  { id: 'objectiveLevel', label: 'strategicObjectives.table.columns.objectiveLevel' },
  { id: 'typeName', label: 'strategicObjectives.table.columns.typeName' },
  { id: 'superiorObjectiveName', label: 'strategicObjectives.table.columns.superiorObjectiveName' },
  { id: 'createdBy', label: 'strategicObjectives.table.columns.createdBy' },
  { id: 'createdDate', label: 'strategicObjectives.table.columns.createdDate' },
  { id: 'lastModifiedBy', label: 'strategicObjectives.table.columns.lastModifiedBy' },
  { id: 'lastModifiedDate', label: 'strategicObjectives.table.columns.lastModifiedDate' },
];

export const FIXED_COLUMNS = ['code', 'name'] as const;

export const DEFAULT_COLUMNS = ['code', 'name', 'description', 'startDate', 'endDate'];
