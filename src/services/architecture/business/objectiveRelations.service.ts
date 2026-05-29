import axios, { endpoints } from 'src/utils/axios';

export type SaveObjectiveProcessRelationPayload = {
  impact: string;
  process: { id: number };
  objective: { id: number };
};

export type SaveJobObjectiveRelationPayload = {
  role: string;
  job: { id: number };
  objective: { id: number };
};

export type SaveDocumentObjectiveRelationPayload = {
  observations?: string;
  document: { id: number };
  objective: { id: number };
};

export type SaveObjectiveIndicatorRelationPayload = {
  observations?: string;
  creationDate: string;
  indicator: { id: number };
  objective: { id: number };
};

// Process Relations
export const SaveObjectiveProcessRelationService = async (data: SaveObjectiveProcessRelationPayload) => {
  const response = await axios.post(endpoints.architecture.business.objectiveRelations.objectiveProcesses, data);
  return response;
};

export const GetObjectiveProcessRelationByIdService = async (id: number) => {
  const response = await axios.get(`${endpoints.architecture.business.objectiveRelations.objectiveProcesses}/${id}`);
  return response;
};

export const UpdateObjectiveProcessRelationService = async (id: number, data: SaveObjectiveProcessRelationPayload) => {
  const response = await axios.patch(`${endpoints.architecture.business.objectiveRelations.objectiveProcesses}/${id}`, data);
  return response;
};

export const DeleteObjectiveProcessRelationService = async (id: number) => {
  const response = await axios.delete(`${endpoints.architecture.business.objectiveRelations.objectiveProcesses}/${id}`);
  return response;
};

// Job Relations
export const SaveJobObjectiveRelationService = async (data: SaveJobObjectiveRelationPayload) => {
  const response = await axios.post(endpoints.architecture.business.objectiveRelations.jobObjectives, data);
  return response;
};

export const GetJobObjectiveRelationByIdService = async (id: number) => {
  const response = await axios.get(`${endpoints.architecture.business.objectiveRelations.jobObjectives}/${id}`);
  return response;
};

export const UpdateJobObjectiveRelationService = async (id: number, data: SaveJobObjectiveRelationPayload) => {
  const response = await axios.patch(`${endpoints.architecture.business.objectiveRelations.jobObjectives}/${id}`, data);
  return response;
};

export const DeleteJobObjectiveRelationService = async (id: number) => {
  const response = await axios.delete(`${endpoints.architecture.business.objectiveRelations.jobObjectives}/${id}`);
  return response;
};

// Document Relations
export const SaveDocumentObjectiveRelationService = async (data: SaveDocumentObjectiveRelationPayload) => {
  const response = await axios.post(endpoints.architecture.business.objectiveRelations.documentObjectives, data);
  return response;
};

export const GetDocumentObjectiveRelationByIdService = async (id: number) => {
  const response = await axios.get(`${endpoints.architecture.business.objectiveRelations.documentObjectives}/${id}`);
  return response;
};

export const UpdateDocumentObjectiveRelationService = async (id: number, data: SaveDocumentObjectiveRelationPayload) => {
  const response = await axios.patch(`${endpoints.architecture.business.objectiveRelations.documentObjectives}/${id}`, data);
  return response;
};

export const DeleteDocumentObjectiveRelationService = async (id: number) => {
  const response = await axios.delete(`${endpoints.architecture.business.objectiveRelations.documentObjectives}/${id}`);
  return response;
};

// Indicator Relations
export const SaveObjectiveIndicatorRelationService = async (data: SaveObjectiveIndicatorRelationPayload) => {
  const response = await axios.post(endpoints.architecture.business.objectiveRelations.objectiveIndicators, data);
  return response;
};

export const GetObjectiveIndicatorRelationByIdService = async (id: number) => {
  const response = await axios.get(`${endpoints.architecture.business.objectiveRelations.objectiveIndicators}/${id}`);
  return response;
};

export const UpdateObjectiveIndicatorRelationService = async (id: number, data: SaveObjectiveIndicatorRelationPayload) => {
  const response = await axios.patch(`${endpoints.architecture.business.objectiveRelations.objectiveIndicators}/${id}`, data);
  return response;
};

export const DeleteObjectiveIndicatorRelationService = async (id: number) => {
  const response = await axios.delete(`${endpoints.architecture.business.objectiveRelations.objectiveIndicators}/${id}`);
  return response;
};
