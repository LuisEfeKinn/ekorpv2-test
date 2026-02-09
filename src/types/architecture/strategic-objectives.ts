export type IStrategicObjective = {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  measurementForm: string;
  consequencesOfNotAchieving: string;
  objectiveLevel: number | null;
  code: string;
  participantId: string | null;
  superiorObjective: any;
  objectiveType: any;
  createdBy: any;
  createdDate: string;
  lastModifiedBy: any;
  lastModifiedDate: string;
};

export type IStrategicObjectiveFilters = {
  name: string;
};
