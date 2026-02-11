import axios, { endpoints } from 'src/utils/axios';

export const SaveToolFeedbackService = async (toolId: string, data: any) => {
  const response = await axios.post(`${endpoints.architecture.tools.table.feedbacks}/${toolId}`, data);
  return response;
};
