export type IStrategicObjectiveType = {
  createdBy: string | null;
  createdDate: string;
  lastModifiedBy: string | null;
  lastModifiedDate: string;
  id: number;
  typeCode: string;
  typeName: string;
};

export type IStrategicObjectiveBase = {
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
  createdBy: string | null;
  createdDate: string;
  lastModifiedBy: string | null;
  lastModifiedDate: string;
};

export type IStrategicObjective = IStrategicObjectiveBase & {
  superiorObjective: IStrategicObjectiveBase | null;
  objectiveType: IStrategicObjectiveType | null;
};

export type IStrategicObjectiveFlowNode = {
  id: number;
  label: string;
  data: IStrategicObjective;
  children?: IStrategicObjectiveFlowNode[];
};

export type IStrategicObjectiveFilters = {
  name: string;
};
