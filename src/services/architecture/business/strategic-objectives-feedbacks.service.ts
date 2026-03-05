import axios, { endpoints } from 'src/utils/axios';

export const SaveStrategicObjectiveFeedbackService = async (objectiveId: string, data: any) => {
  const response = await axios.post(`${endpoints.architecture.business.objectives.feedbacks}/${objectiveId}`, data);
  return response;
};

export const UpdateStrategicObjectiveFeedbackService = async (id: string, data: any) => {
  const response = await axios.patch(`/api/feedbacks/${id}`, data);
  return response;
};

export const DeleteStrategicObjectiveFeedbackService = async (id: string) => {
  const response = await axios.delete(`/api/feedbacks/${id}`);
  return response;
};
