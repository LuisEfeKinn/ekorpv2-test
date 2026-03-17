// types
import type {
  IRegionsResponse,
  ICountriesResponse,
  IMunicipalitiesResponse
} from 'src/types/locations';

// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

// Interface for Countries service parameters
interface GetCountriesParams {
  id?: string | number;
  search?: string;
}

// Interface for Regions service parameters
interface GetRegionsParams {
  search?: string;
  id?: string | number;
  countryId?: string | number;
}

// Interface for Municipalities service parameters
interface GetMunicipalitiesParams {
  search?: string;
  regionId?: string | number;
  municipalityId?: string | number;
}

// ----------------------------------------------------------------------

export const GetCountriesService = async (params?: GetCountriesParams) => {
  // Filter out undefined values to avoid sending empty parameters
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
  ) : undefined;

  const response = await axios.get<ICountriesResponse>(`${endpoints.settings.locations.countries}`, {
    params: filteredParams
  });
  return response;
};

export const GetRegionsService = async (params?: GetRegionsParams) => {
  // Filter out undefined values to avoid sending empty parameters
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
  ) : undefined;

  const response = await axios.get<IRegionsResponse>(`${endpoints.settings.locations.regions}`, {
    params: filteredParams
  });
  return response;
};

export const GetMunicipalitiesService = async (params?: GetMunicipalitiesParams) => {
  // Filter out undefined values to avoid sending empty parameters
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
  ) : undefined;

  const response = await axios.get<IMunicipalitiesResponse>(`${endpoints.settings.locations.municipalities}`, {
    params: filteredParams
  });
  return response;
};