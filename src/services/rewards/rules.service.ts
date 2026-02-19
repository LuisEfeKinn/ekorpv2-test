// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetRewardRulePaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.rewards.rule.all}`, { params });
  return response;
};

export const SaveOrUpdateRewardRuleService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.rewards.rule.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.rewards.rule.save, dataSend);
  }
  return response;
};

export const GetRewardRuleByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.rewards.rule.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
}

export const DeleteRewardRuleService = async (id: any) => {
  const deleteEndpoint = `${endpoints.rewards.rule.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};
