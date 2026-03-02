import axios, { endpoints } from 'src/utils/axios';

export const SaveRiskActionMeasureRelationService = async (payload: any) => {
  const response = await axios.post<any>(endpoints.architecture.risk.riskActionMeasures, payload);
  return response;
};

export const GetMandatoryRecommendedEnumService = async () => {
  const response = await axios.get<any>(endpoints.architecture.relatedData.mandatoryRecommended);
  return response;
};

export const GetControlLevelEnumService = async () => {
  const response = await axios.get<any>(endpoints.architecture.relatedData.controlLevel);
  return response;
};

export const GetRiskActionMeasuresService = async () => {
  const response = await axios.get<any>(endpoints.architecture.risk.riskActionMeasures);
  return response;
};

export const GetActionMeasuresListService = async (params?: { lesson?: boolean; proposal?: boolean }) => {
  const response = await axios.get<any>(endpoints.architecture.actionMeasures, { params });
  return response;
};
