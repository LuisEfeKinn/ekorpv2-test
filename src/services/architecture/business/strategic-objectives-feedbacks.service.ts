import axios, { endpoints } from 'src/utils/axios';

export const SaveStrategicObjectiveFeedbackService = async (objectiveId: string, data: any) => {
  const response = await axios.post(`${endpoints.architecture.business.objectives.feedbacks}/${objectiveId}`, data);
  return response;
};
