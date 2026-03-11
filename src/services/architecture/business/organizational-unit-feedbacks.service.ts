import axios, { endpoints } from 'src/utils/axios';

export const SaveOrganizationalUnitFeedbackService = async (orgUnitId: string, data: any) => {
  const response = await axios.post(`${endpoints.organization.organizationalUnits.feedbacks}/${orgUnitId}`, data);
  return response;
};

export const UpdateOrganizationalUnitFeedbackService = async (feedbackId: string, data: any) => {
  const response = await axios.patch(`/api/feedbacks/${feedbackId}`, data);
  return response;
};
