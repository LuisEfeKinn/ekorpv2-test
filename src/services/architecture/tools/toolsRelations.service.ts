import axios, { endpoints } from 'src/utils/axios';

export const SaveToolDocumentRelationService = async (data: any) => {
  const response = await axios.post(endpoints.architecture.tools.relations.documents, data);
  return response;
};

export const SaveToolIndicatorRelationService = async (data: any) => {
  const response = await axios.post(endpoints.architecture.tools.relations.indicators, data);
  return response;
};

export const GetDocumentsListService = async (params?: any) => {
  const response = await axios.get(endpoints.architecture.documents.table.all, { params });
  return response;
};

export const GetIndicatorsListService = async (params?: any) => {
  const response = await axios.get(endpoints.architecture.indicators.table.all, { params });
  return response;
};
