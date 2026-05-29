import type { ActionMeasureApiItem } from 'src/types/architecture/action-measures';

import axios, { endpoints } from 'src/utils/axios';

export const GetActionMeasuresService = async () => {
  const response = await axios.get<ActionMeasureApiItem[]>(endpoints.architecture.actionMeasures);
  return response;
};

export const CreateActionMeasureService = async (data: unknown) => {
  const response = await axios.post('/api/action-measures', data);
  return response;
};

export const UpdateActionMeasureService = async (id: string, data: unknown) => {
  const response = await axios.patch(`/api/action-measures/${id}`, data);
  return response;
};

export const DeleteActionMeasureService = async (id: string) => {
  const response = await axios.delete(`/api/action-measures/${id}`);
  return response;
};

export const GetActionMeasureByIdService = async (id: string) => {
  const response = await axios.get(`/api/action-measures/${id}`);
  return response;
};
