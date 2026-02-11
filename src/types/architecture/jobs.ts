export type IJob = {
  id: number;
  name: string;
  code?: string;
  jobType?: {
    id?: number;
    name?: string;
  };
  objectives: string;
  expectedResults: string;
  requirements: string;
  otherFunctions: string;
  minimumAcademicLevel?: string;
  desiredAcademicLevel?: string;
  minimumExperience?: string;
  desiredExperience?: string;
  supervises?: string;
  regionalLocation?: string;
  headquarters?: string;
  version?: string;
  createdAt: string;
  superiorJob?: {
    id: number;
    name: string;
  };
  numberOfPositions?: number;
  numberOfHoursPerPosition?: number;
  academicProfile?: string;
  psychologicalProfile?: string;
  internalRelationship?: string;
  externalRelationship?: string;
  competencies?: string;
  actorStatus?: number;
};

export type IJobFilters = {
  name: string;
};
