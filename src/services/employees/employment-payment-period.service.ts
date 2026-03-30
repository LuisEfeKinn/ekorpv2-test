// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetEmployeesPaymentPeriods = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.employees.paymentPeriods.all}`, { params });
  return response;
};
