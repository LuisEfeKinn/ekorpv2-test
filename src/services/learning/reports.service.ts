// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export type ReportFormat = 'json' | 'excel' | 'pdf' | 'csv' | '';

export type OrderOption =
  | 'learningPath.name:asc'
  | 'learningPath.name:desc'
  | 'employee.firstName:asc'
  | 'employee.firstName:desc'
  | 'employee.lastName:asc'
  | 'employee.lastName:desc'
  | 'job.name:asc'
  | 'job.name:desc'
  | 'organizationalUnit.name:asc'
  | 'organizationalUnit.name:desc'
  | 'elp.status:asc'
  | 'elp.status:desc'
  | 'elp.completionPercentage:asc'
  | 'elp.completionPercentage:desc'
  | 'elp.createdAt:asc'
  | 'elp.createdAt:desc';

export interface IReportParams {
  order?: OrderOption | string;
  page?: number;
  perPage?: number;
  search?: string;
  includeInactive?: boolean;
  employeeId?: number | string;
  routeId?: number | string;
  format?: ReportFormat;
}

// Builds clean params object (excludes undefined, null and empty strings)
const buildCleanParams = (params: IReportParams): Record<string, any> => {
  const clean: Record<string, any> = {};
  (Object.entries(params) as [string, any][]).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    clean[key] = value;
  });
  return clean;
};

export const GetLearningPathsReportService = async (params: IReportParams = {}) => {
  const cleanParams = buildCleanParams(params);
  const isBlob = cleanParams.format && cleanParams.format !== 'json';
  return axios.get(endpoints.learning.reports.learningPaths, {
    params: cleanParams,
    ...(isBlob ? { responseType: 'blob' } : {}),
  });
};

export const GetProgramsReportService = async (params: IReportParams = {}) => {
  const cleanParams = buildCleanParams(params);
  const isBlob = cleanParams.format && cleanParams.format !== 'json';
  return axios.get(endpoints.learning.reports.programs, {
    params: cleanParams,
    ...(isBlob ? { responseType: 'blob' } : {}),
  });
};

export const GetCoursesReportService = async (params: IReportParams = {}) => {
  const cleanParams = buildCleanParams(params);
  const isBlob = cleanParams.format && cleanParams.format !== 'json';
  return axios.get(endpoints.learning.reports.courses, {
    params: cleanParams,
    ...(isBlob ? { responseType: 'blob' } : {}),
  });
};