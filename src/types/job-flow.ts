
export interface JobFlowData {
  id: number;
  name: string;
  objectives: string;
  expectedResults: string;
  requirements: string;
  otherFunctions: string;
  numberOfPositions: number | null;
  numberOfHoursPerPosition: number | null;
  academicProfile: string | null;
  psychologicalProfile: string | null;
  code: string | null;
  internalRelationship: string | null;
  externalRelationship: string | null;
  economicResponsibility: string | null;
  equipmentResponsibility: string | null;
  informationResponsibility: string | null;
  minimumAcademicLevel: string | null;
  desiredAcademicLevel: string | null;
  minimumExperience: string | null;
  desiredExperience: string | null;
  knowledge: string | null;
  otherRequirements: string | null;
  supervises: string | null;
  regionalLocation: string | null;
  headquarters: string | null;
  competencies: string | null;
  decisions: string | null;
  version: string | null;
  actorStatus: number | null;
  organizationalUnitId: string | null;
  superiorJob: any | null;
  createdBy: string | null;
  createdDate: string;
  lastModifiedBy: string | null;
  lastModifiedDate: string;
}

export interface JobFlowNode {
  id: number;
  label: string;
  name: string; // Added for compatibility with OrganizationalChart
  data: JobFlowData;
  children: JobFlowNode[];
}
