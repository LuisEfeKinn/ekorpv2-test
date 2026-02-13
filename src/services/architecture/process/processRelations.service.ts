import axios, { endpoints } from 'src/utils/axios';

// Tools
export const SaveProcessToolService = async (data: any) => {
  const response = await axios.post(endpoints.architecture.process.tools, data);
  return response;
};

// Documents
export const SaveProcessDocumentService = async (data: any) => {
  const response = await axios.post(endpoints.architecture.process.documents, data);
  return response;
};
export const GetDocumentsListService = async (params?: any) => {
  const response = await axios.get(endpoints.architecture.documents.table.all, { params });
  return response;
};

// Systems
export const SaveSystemProcessService = async (data: any) => {
  const response = await axios.post(endpoints.architecture.process.systems, data);
  return response;
};

// Competencies
export const SaveProcessCompetencyService = async (data: any) => {
  const response = await axios.post(endpoints.architecture.process.competencies, data);
  return response;
};

// Risks
export const SaveProcessRiskService = async (data: any) => {
  const response = await axios.post(endpoints.architecture.process.risks, data);
  return response;
};

// Objectives
export const SaveObjectiveProcessService = async (data: any) => {
  const response = await axios.post(endpoints.architecture.process.objectives, data);
  return response;
};

// Indicators
export const SaveProcessIndicatorService = async (data: any) => {
  const response = await axios.post(endpoints.architecture.process.indicators, data);
  return response;
};
export const GetIndicatorsListService = async (params?: any) => {
  const response = await axios.get(endpoints.architecture.indicators.table.all, { params });
  return response;
};
