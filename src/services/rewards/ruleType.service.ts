// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetRewardRuleTypePaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.rewards.ruleType.all}`, { params });
  return response;
};

export const SaveOrUpdateRewardRuleTypeService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.rewards.ruleType.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.rewards.ruleType.save, dataSend);
  }
  return response;
};

export const GetRewardRuleTypeByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.rewards.ruleType.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
}

export const DeleteRewardRuleTypeService = async (id: any) => {
  const deleteEndpoint = `${endpoints.rewards.ruleType.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};
