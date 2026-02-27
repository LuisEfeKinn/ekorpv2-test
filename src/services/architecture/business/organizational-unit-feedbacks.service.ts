import axios, { endpoints } from 'src/utils/axios';

export const GetOrganizationalUnitFeedbacksService = async (orgUnitId: string, params?: any) => {
  const response = await axios.get(`${endpoints.organization.organizationalUnits.feedbacks}/${orgUnitId}`, { params });
  return response;
};

export const SaveOrganizationalUnitFeedbackService = async (orgUnitId: string, data: any) => {
  const response = await axios.post(`${endpoints.organization.organizationalUnits.feedbacks}/${orgUnitId}`, data);
  return response;
};

export const DeleteOrganizationalUnitFeedbackService = async (feedbackId: string) => {
  const response = await axios.delete(`${endpoints.architecture.process.feedbacks.delete}/${feedbackId}`);
  return response;
};
