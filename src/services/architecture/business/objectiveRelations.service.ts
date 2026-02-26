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

export const SaveObjectiveProcessRelationService = async (data: SaveObjectiveProcessRelationPayload) => {
  const response = await axios.post(endpoints.architecture.business.objectiveRelations.objectiveProcesses, data);
  return response;
};

export const SaveJobObjectiveRelationService = async (data: SaveJobObjectiveRelationPayload) => {
  const response = await axios.post(endpoints.architecture.business.objectiveRelations.jobObjectives, data);
  return response;
};

export const SaveDocumentObjectiveRelationService = async (data: SaveDocumentObjectiveRelationPayload) => {
  const response = await axios.post(endpoints.architecture.business.objectiveRelations.documentObjectives, data);
  return response;
};

export const SaveObjectiveIndicatorRelationService = async (data: SaveObjectiveIndicatorRelationPayload) => {
  const response = await axios.post(endpoints.architecture.business.objectiveRelations.objectiveIndicators, data);
  return response;
};

