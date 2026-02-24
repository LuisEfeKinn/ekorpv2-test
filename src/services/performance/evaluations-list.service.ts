// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetEvaluationListPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.performance.evaluationsList.all}`, { params });
  return response;
};

export const GetEvaluationListByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.performance.evaluationsList.byId}/${id}/competency-gap`;
  const response = await axios.get(editEndpoint);
  return response;
};