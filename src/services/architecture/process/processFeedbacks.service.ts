import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const SaveFeedbackService = async (data: any) => {
  const response = await axios.post(endpoints.architecture.process.feedbacks.save, data);
  return response;
};

export const SaveFeedbackObjectRelationService = async (data: any) => {
  const response = await axios.post(endpoints.architecture.process.feedbacks.relationSave, data);
  return response;
};

export const SaveFeedbackToProcessService = async (processId: string | number, data: any) => {
  const url = `${endpoints.architecture.process.feedbacks.save}/${processId}`;
  const response = await axios.post(url, data);
  return response;
};
