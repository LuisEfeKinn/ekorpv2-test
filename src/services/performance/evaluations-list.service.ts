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

export const GetCampaignAnalyticsCompetencyService = async (id: string | number) => {
  const response = await axios.get(
    `${endpoints.performance.evaluationsList.analyticsCompetency}/${id}/analytics-competency`
  );
  return response;
};

export const GetCampaignRelationshipDistributionService = async (id: string | number) => {
  const response = await axios.get(
    `${endpoints.performance.evaluationsList.relationshipDistribution}/${id}/relationship-distribution`
  );
  return response;
};

export const ExportCampaignAnalyticsService = async (
  campaignId: string | number,
  exportFormat: 0 | 1
) => {
  const response = await axios.get(
    `${endpoints.performance.evaluationsList.analyticsCompetency}/${campaignId}/analytics-competency`,
    {
      params: { exportFormat },
      responseType: 'blob',
    }
  );
  return response;
};

export const GetSpiderEvaluatorService = async (participantId: string | number) => {
  const response = await axios.get(
    `${endpoints.performance.evaluationsList.spiderEvaluator}/${participantId}/spider-evaluator`
  );
  return response;
};
