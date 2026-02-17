// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetEmployeesEnrollmentPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.employees.enrollments.all}`, { params });
  return response;
};

export const GetLearningPathEmployeesPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.learning.courses.learningPathByEmployee}`, { params });
  return response;
};