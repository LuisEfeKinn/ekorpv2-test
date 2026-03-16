import axios, { endpoints } from 'src/utils/axios';

export const SaveProcessToolService = async (data: any) => {
  const response = await axios.post(endpoints.architecture.process.tools, data);
  return response;
};

export const UpdateProcessToolService = async (id: number | string, data: any) => {
  const response = await axios.patch(`${endpoints.architecture.process.tools}/${id}`, data);
  return response;
};

export const DeleteProcessToolService = async (id: number | string) => {
  const response = await axios.delete(`${endpoints.architecture.process.tools}/${id}`);
  return response;
};

export const SaveProcessDocumentService = async (data: any) => {
  const response = await axios.post(endpoints.architecture.process.documents, data);
  return response;
};

export const UpdateProcessDocumentService = async (id: number | string, data: any) => {
  const response = await axios.patch(`${endpoints.architecture.process.documents}/${id}`, data);
  return response;
};

export const DeleteProcessDocumentService = async (id: number | string) => {
  const response = await axios.delete(`${endpoints.architecture.process.documents}/${id}`);
  return response;
};

export const GetDocumentsListService = async (params?: any) => {
  const response = await axios.get(endpoints.architecture.documents.table.all, { params });
  return response;
};

export const SaveSystemProcessService = async (data: any) => {
  const response = await axios.post(endpoints.architecture.process.systems, data);
  return response;
};

export const UpdateSystemProcessService = async (id: number | string, data: any) => {
  const response = await axios.patch(`${endpoints.architecture.process.systems}/${id}`, data);
  return response;
};

export const DeleteSystemProcessService = async (id: number | string) => {
  const response = await axios.delete(`${endpoints.architecture.process.systems}/${id}`);
  return response;
};

export const SaveProcessCompetencyService = async (data: any) => {
  const response = await axios.post(endpoints.architecture.process.competencies, data);
  return response;
};

export const UpdateProcessCompetencyService = async (id: number | string, data: any) => {
  const response = await axios.patch(`${endpoints.architecture.process.competencies}/${id}`, data);
  return response;
};

export const DeleteProcessCompetencyService = async (id: number | string) => {
  const response = await axios.delete(`${endpoints.architecture.process.competencies}/${id}`);
  return response;
};

export const SaveProcessRiskService = async (data: any) => {
  const response = await axios.post(endpoints.architecture.process.risks, data);
  return response;
};

export const UpdateProcessRiskService = async (id: number | string, data: any) => {
  const response = await axios.patch(`${endpoints.architecture.process.risks}/${id}`, data);
  return response;
};

export const DeleteProcessRiskService = async (id: number | string) => {
  const response = await axios.delete(`${endpoints.architecture.process.risks}/${id}`);
  return response;
};

export const SaveObjectiveProcessService = async (data: any) => {
  const response = await axios.post(endpoints.architecture.process.objectives, data);
  return response;
};

export const UpdateObjectiveProcessService = async (id: number | string, data: any) => {
  const response = await axios.patch(`${endpoints.architecture.process.objectives}/${id}`, data);
  return response;
};

export const DeleteObjectiveProcessService = async (id: number | string) => {
  const response = await axios.delete(`${endpoints.architecture.process.objectives}/${id}`);
  return response;
};

export const SaveProcessIndicatorService = async (data: any) => {
  const response = await axios.post(endpoints.architecture.process.indicators, data);
  return response;
};

export const UpdateProcessIndicatorService = async (id: number | string, data: any) => {
  const response = await axios.patch(`${endpoints.architecture.process.indicators}/${id}`, data);
  return response;
};

export const DeleteProcessIndicatorService = async (id: number | string) => {
  const response = await axios.delete(`${endpoints.architecture.process.indicators}/${id}`);
  return response;
};

export const GetIndicatorsListService = async (params?: any) => {
  const response = await axios.get(endpoints.architecture.indicators.table.all, { params });
  return response;
};
