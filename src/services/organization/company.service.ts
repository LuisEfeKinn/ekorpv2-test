// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------


export const GetCompanyService = async (params?: any) => {
  const response = await axios.get<any>(`${endpoints.organization.company.all}`, { params });
  return response;
};

export const SaveOrUpdateCompanyService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.organization.company.update}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.organization.company.save, dataSend);
  }
  return response;
};

export const GetSelectCoinService = async (params?: any) => {
  const editEndpoint = `${endpoints.organization.company.select}`;
  const response = await axios.get(editEndpoint , { params });
  return response;
}