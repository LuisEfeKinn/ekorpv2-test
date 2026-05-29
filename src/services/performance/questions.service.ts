// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetQuestionsPaginationService = async (competenceId: any, campaignId: any, params: any) => {
  const response = await axios.get<any>(`${endpoints.performance.questions.all}/${competenceId}/campaign/${campaignId}`, { params });
  return response;
};

export const SaveOrUpdateQuestionsService = async (dataSend: any, id?: any, competenceId?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.performance.questions.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    const saveEndpoint = `${endpoints.performance.questions.save}/${competenceId}`;
    response = await axios.post(saveEndpoint, dataSend);
  }
  return response;
};

export const GetQuestionsByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.performance.questions.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeleteQuestionsService = async (id: any) => {
  const deleteEndpoint = `${endpoints.performance.questions.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};