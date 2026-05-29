import axios, { endpoints } from 'src/utils/axios';

const { catalogs } = endpoints.projectManagement;

export const GetExperienceLevelsService = async () => {
  const response = await axios.get(catalogs.experienceLevels);
  return response;
};

export const GetWorkerStatusesService = async () => {
  const response = await axios.get(catalogs.workerStatuses);
  return response;
};

export const GetProjectImportanceLevelsService = async () => {
  const response = await axios.get(catalogs.projectImportanceLevels);
  return response;
};

export const GetProjectSizesService = async () => {
  const response = await axios.get(catalogs.projectSizes);
  return response;
};

export const GetProjectComplexitiesService = async () => {
  const response = await axios.get(catalogs.projectComplexities);
  return response;
};

export const GetProjectReintegroLevelsService = async () => {
  const response = await axios.get(catalogs.projectReintegroLevels);
  return response;
};

export const GetProjectStatusesService = async () => {
  const response = await axios.get(catalogs.projectStatuses);
  return response;
};

export const GetAssignmentPrioritiesService = async () => {
  const response = await axios.get(catalogs.assignmentPriorities);
  return response;
};

export const GetAssignmentStatusesService = async () => {
  const response = await axios.get(catalogs.assignmentStatuses);
  return response;
};

export const GetActivityStatusesService = async () => {
  const response = await axios.get(catalogs.activityStatuses);
  return response;
};

export const GetEmploymentTypesForFilterService = async (params?: {
  page?: number;
  perPage?: number;
  search?: string;
}) => {
  const response = await axios.get(endpoints.employees.employeesTypes.all, { params });
  return response;
};
