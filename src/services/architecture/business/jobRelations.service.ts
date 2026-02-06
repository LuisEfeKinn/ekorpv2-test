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