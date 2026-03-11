
// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetTimeUnitsPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.catalogs.timeUnits.all}`, { params });
  return response;
};

export const SaveOrUpdateTimeUnitService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.architecture.catalogs.timeUnits.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.architecture.catalogs.timeUnits.save, dataSend);
  }
  return response;
};

export const GetTimeUnitByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.architecture.catalogs.timeUnits.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeleteTimeUnitService = async (id: any) => {
  const deleteEndpoint = `${endpoints.architecture.catalogs.timeUnits.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};
