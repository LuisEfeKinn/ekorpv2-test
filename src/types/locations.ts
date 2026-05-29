// ----------------------------------------------------------------------
// INTERFACES FOR LOCATIONS
// ----------------------------------------------------------------------

export interface ICountry {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
}

export interface IRegion {
  id: string;
  name: string;
  code: string;
  countryId: string;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
  country?: ICountry;
}

export interface IMunicipality {
  id: string;
  name: string;
  regionId?: string;
  regionName?: string;
  countryId?: string;
  countryName?: string;
  createdAt?: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
}

// ----------------------------------------------------------------------
// API RESPONSE INTERFACES
// ----------------------------------------------------------------------

export interface ICountriesResponse {
  statusCode: number;
  data: ICountry[];
  message: string;
}

export interface IRegionResponse {
  statusCode: number;
  data: IRegion;
  message: string;
}

export interface IRegionsResponse {
  statusCode: number;
  data: IRegion[];
  message: string;
}

export interface IMunicipalitiesResponse {
  statusCode: number;
  data: IMunicipality[];
  message: string;
}

// ----------------------------------------------------------------------
// SEARCH OPTION INTERFACES FOR AUTOCOMPLETES
// ----------------------------------------------------------------------

export interface ILocationOption {
  id: string;
  name: string;
  code?: string;
}

export interface ICountryOption extends ILocationOption {
  code: string;
}

export interface IRegionOption extends ILocationOption {
  countryId: string;
}

export interface IMunicipalityOption extends ILocationOption {
  regionId?: string;
  regionName?: string;
  countryId?: string;
  countryName?: string;
}