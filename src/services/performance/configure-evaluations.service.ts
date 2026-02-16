// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetConfigureEvaluationsPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.performance.configureEvaluations.all}`, { params });
  return response;
};

export const SaveOrUpdateConfigureEvaluationService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.performance.configureEvaluations.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.performance.configureEvaluations.save, dataSend);
  }
  return response;
};

export const GetConfigureEvaluationByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.performance.configureEvaluations.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeleteConfigureEvaluationService = async (id: any) => {
  const deleteEndpoint = `${endpoints.performance.configureEvaluations.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};

// -------------------------------- PARTICIPANTS --------------------------------------

export const GetParticipantsByEvaluationCampaingsIdService = async (id: any, params: any) => {
  const participantsEndpoint = `${endpoints.performance.configureEvaluations.participants.all}/${id}/participants`;
  const response = await axios.get(participantsEndpoint, { params });
  return response;
};

export const SyncParticipantsByEvaluationCampaingsIdService = async (id: any) => {
  const syncEndpoint = `${endpoints.performance.configureEvaluations.participants.sync}/${id}/assign-participants`;
  const response = await axios.post(syncEndpoint);
  return response;
};

export const AssignEvaluatorsSmartByEvaluationCampaingsIdService = async (id: any) => {
  const assignEvaluatorsEndpoint = `${endpoints.performance.configureEvaluations.participants.assingEvaluators}/${id}/smart-assign-evaluators`;
  const response = await axios.post(assignEvaluatorsEndpoint);
  return response;
};

export const ListEvaluatorsByParticipantService = async (campaignId: any, participantId: any) => {
  const listEvaluatorsEndpoint = `${endpoints.performance.configureEvaluations.participants.listEvaluatorsByParticipant}/${campaignId}/participants/${participantId}/evaluators`;
  const response = await axios.get(listEvaluatorsEndpoint);
  return response;
};

export const UpdateEvaluatorAssignmentService = async (campaignId: any, assignmentId: any, dataSend: any) => {
  const updateEvaluatorAssignmentEndpoint = `${endpoints.performance.configureEvaluations.participants.updateEvaluatorsAssignment}/${campaignId}/evaluators/${assignmentId}`;
  const response = await axios.patch(updateEvaluatorAssignmentEndpoint, dataSend);
  return response;
};

export const DeleteEvaluatorAssignmentService = async (campaignId: any, assignmentId: any) => {
  const deleteEvaluatorAssignmentEndpoint = `${endpoints.performance.configureEvaluations.participants.deleteEvaluatorsAssignment}/${campaignId}/evaluators/${assignmentId}`;
  const response = await axios.delete(deleteEvaluatorAssignmentEndpoint);
  return response;
};

export const ListParticipantsWithEvaluatorsService = async (campaignId: any, params: any) => {
  const listParticipantsWithEvaluatorsEndpoint = `${endpoints.performance.configureEvaluations.participants.listParticipantsWithEvaluators}/${campaignId}/participants-with-evaluators`;
  const response = await axios.get(listParticipantsWithEvaluatorsEndpoint, { params });
  return response;
};

// -------------------------------- NINE-BOX --------------------------------------

export const GetNineBoxLiveByCampaingIdService = async (id: any) => {
  const nineBoxLiveEndpoint = `${endpoints.performance.nineBox.nineBoxLive}/${id}/nine-box`;
  const response = await axios.get(nineBoxLiveEndpoint);
  return response;
};

export const CloseCampaingEvaluationService = async (id: any) => {
  const closeCampaingEndpoint = `${endpoints.performance.nineBox.closeEvaluationCampaign}/${id}/close`;
  const response = await axios.post(closeCampaingEndpoint);
  return response;
};

export const GetNineBoxHistoryByCampaingIdService = async (id: any) => {
  const nineBoxHistoryEndpoint = `${endpoints.performance.nineBox.nineBoxHistory}/${id}/history`;
  const response = await axios.get(nineBoxHistoryEndpoint);
  return response;
};