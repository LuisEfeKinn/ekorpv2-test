// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetEvaluationResponsesPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.performance.evaluationResponses.all}`, { params });
  return response;
};

export const SaveEvaluationResponseService = async (dataSend: any) => {
  const updateEndpoint = `${endpoints.performance.evaluationResponses.save}`;
  const response = await axios.post(updateEndpoint, dataSend);
  return response;
};

export const GetEvaluationByEvaluatorService = async (assignmentId: any) => {
  const evaluationEndpoint = `${endpoints.performance.evaluationResponses.evaluationByEvaluator}/${assignmentId}/form`;
  const response = await axios.get(evaluationEndpoint);
  return response;
};

export const GetQuestionsByCompetenceService = async (assignmentId: any, competenceId: any) => {
  const questionsEndpoint = `${endpoints.performance.evaluationResponses.questionsByCompetence}/${assignmentId}/sections/competences/${competenceId}`;
  const response = await axios.get(questionsEndpoint);
  return response;
};

export const GetMyResultsByCampaignService = async (campaingId: any) => {
  const myResultsEndpoint = `${endpoints.performance.evaluationResponses.myMyResults}/${campaingId}`;
  const response = await axios.get(myResultsEndpoint);
  return response;
};