import axios, { endpoints } from 'src/utils/axios';

export type SaveJobProcessRelationPayload = {
  isMain: boolean;
  description?: string;
  job: { id: number };
  process: { id: number };
  actionType?: { id: number };
};

export type SaveJobDocumentRelationPayload = {
  observations?: string;
  job: { id: number };
  document: { id: number };
};

export type SaveJobSystemRelationPayload = {
  observations?: string;
  job: { id: number };
  system: { id: number };
};

export type SaveJobIndicatorRelationPayload = {
  observations?: string;
  creationDate: string;
  job: { id: number };
  indicator: { id: number };
};

export type SaveJobLessonsLearnedAndProposalsForImprovementPayload = {
  lessonsLearned: string;
  proposalsForImprovement: string;
};

export type SaveJobDataPayload = {
  observations?: string;
  job: { id: number };
  data: { id: number };
};

export type SaveJobTechnologiesPayload = {
  observations?: string;
  job: { id: number };
  technology: { id: number };
};

export const SaveJobProcessRelationService = async (data: SaveJobProcessRelationPayload) => {
  const response = await axios.post(endpoints.architecture.business.jobRelations.jobProcesses, data);
  return response;
};

export const SaveJobDocumentRelationService = async (data: SaveJobDocumentRelationPayload) => {
  const response = await axios.post(endpoints.architecture.business.jobRelations.jobDocuments, data);
  return response;
};

export const SaveJobSystemRelationService = async (data: SaveJobSystemRelationPayload) => {
  const response = await axios.post(endpoints.architecture.business.jobRelations.jobSystems, data);
  return response;
};

export const SaveJobIndicatorRelationService = async (data: SaveJobIndicatorRelationPayload) => {
  const response = await axios.post(endpoints.architecture.business.jobRelations.jobIndicators, data);
  return response;
};

export const SaveJobLessonsLearnedAndProposalsForImprovementRelationService = async (
  jobId: string | number,
  data: any
) => {
  const response = await axios.post(`${endpoints.architecture.business.jobRelations.jobLessonsLearnedAndProposalsForImprovement}/${jobId}`, data);
  return response;
};

export const SaveJobDataRelationService = async (data: SaveJobDataPayload) => {
  const response = await axios.post(endpoints.architecture.business.jobRelations.jobData, data);
  return response;
};

export const SaveJobTechnologiesRelationService = async (data: SaveJobTechnologiesPayload) => {
  const response = await axios.post(endpoints.architecture.business.jobRelations.jobTechnologies, data);
  return response;
};

// =============================================================================
// RELACIONES (Job Relation Types)
// =============================================================================

export type SaveJobRelationTypePayload = {
  id?: number;
  name: string;
  reverseName: string;
  job1Id: number;
  job2Id: number;
};

export const SaveJobRelationTypeService = async (data: SaveJobRelationTypePayload) => {
  const response = await axios.post('/api/job-relation-types', data);
  return response;
};

export const UpdateJobRelationTypeService = async (data: SaveJobRelationTypePayload) => {
  // Assuming PATCH /api/job-relation-types uses ID in body or is the route. 
  // If the backend follows REST strictly, it might be /api/job-relation-types/:id
  // But based on user instruction "ruta post yb patch es /api/job-relation-types", 
  // I will try to use the base URL. If an ID is needed in the URL, I'll check if `data.id` is present.
  // Ideally, for edit, we might need to append ID. 
  // Let's assume standard behavior unless specified otherwise, but user said the route IS that.
  // I'll append ID if it exists and it's not in the base route instructions, 
  // but to be safe and strictly follow "ruta ... es ...", I'll use the base route with data.
  // However, usually PATCH needs to know WHICH resource.
  // I'll use the ID in the URL if provided in data.
  // const url = data.id ? `/api/job-relation-types/${data.id}` : '/api/job-relation-types';
  // Re-reading: "para relaciones la ruta post yb patch es /api/job-relation-types"
  // This phrasing suggests the URL is exactly that. Maybe it accepts ID in body.
  // But typically PATCH /collection is not standard for updating a single item unless bulk.
  // I will assume ID is in URL for safety or use the exact route if I want to follow literally.
  // Let's follow standard convention if possible, but the user gave specific route.
  // I will try to use the route provided. If it fails, I can adjust.
  // But wait, "job-relation-types" sounds like a catalog. 
  // The example payload is: { "name": "relacion", "reverseName": "relacion Inverso", "job1Id": 22, "job2Id": 20 }
  // This looks like creating a "Type" of relation between two jobs? Or a relation instance?
  // "job1Id" and "job2Id" suggests it's the relation instance.
  // Okay.
  const response = await axios.patch('/api/job-relation-types', data); 
  return response;
};

// =============================================================================
// SIGUIENTES CARGOS (Next Jobs)
// =============================================================================

export type SaveNextJobPayload = {
  id?: number;
  jobId: number;
  nextJobId: number;
};

export const SaveNextJobService = async (data: SaveNextJobPayload) => {
  const response = await axios.post('/api/next-jobs', data);
  return response;
};

export const UpdateNextJobService = async (data: SaveNextJobPayload) => {
  // Same logic as above
  const response = await axios.patch('/api/next-jobs', data);
  return response;
};