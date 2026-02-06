export type IOrganization = {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
};

export type IOrganizationTableFilters = {
  name: string;
  code?: string;
  description?: string;
  color?: string;
  status?: string;
};

export type IOrganizationTableFilterValue = string | string[];

// ------------------------------------------------------

export type IPosition = {
  id: string;
  name: string;
  code?: string;
  objectives?: string;
  expectedResults?: string;
  requirements?: string;
  otherFunctions?: string;
  minimumAcademicLevel?: string;
  desiredAcademicLevel?: string;
  minimumExperience?: string;
  desiredExperience?: string;
  supervises?: string;
  regionalLocation?: string;
  headquarters?: string;
  version?: string;
  organizationalUnit?: any;
  superiorJob?: {
    id: number;
    name: string;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
};

export type IPositionTableFilters = {
  name: string;
  status?: string;
};

export type IPositionTableFilterValue = string | string[];

// ----------------------------------------------------------------------
// API RESPONSE INTERFACES FOR POSITIONS
// ----------------------------------------------------------------------

export interface IPositionsResponse {
  statusCode: number;
  data: IPosition[];
  meta?: any;
  message: string;
}

// ----------------------------------------------------------------------
// SEARCH OPTION INTERFACES FOR AUTOCOMPLETES
// ----------------------------------------------------------------------

export interface IPositionOption {
  id: string;
  name: string;
  objectives?: string;
  expectedResults?: string;
  requirements?: string;
  otherFunctions?: string;
}

// ------------------------------------------------------
// Company types

export type ICoin = {
  id: string;
  name: string;
  code: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
};

export type ICompany = {
  id: string;
  name: string;
  coinId: string;
  oficialName: string;
  taxId: string;
  webSite: string;
  registerDate: Date | string;
  primaryAddress: string;
  secondaryAddress: string;
  latitude: string;
  longitude: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
  coin: ICoin;
};

export type ICompanyResponse = {
  statusCode: number;
  data: ICompany;
  message: string;
};

export type ICompanyFormData = {
  name: string;
  coinId: number;
  oficialName: string;
  taxId: string;
  webSite: string;
  registerDate: Date | string;
  primaryAddress: string;
  secondaryAddress?: string;
  latitude: string;
  longitude: string;
};

export type ICoinSelectResponse = {
  statusCode: number;
  data: ICoin[];
  message: string;
};

// ----------------------------------------------------------------------
// ORGANIZATIONAL UNIT INTERFACES
// ----------------------------------------------------------------------

export interface IOrganizationalUnit {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  parent?: IOrganizationalUnitOption | null;
  children?: IOrganizationalUnit[];
}

export interface IOrganizationalUnitOption {
  id: string;
  name: string;
  code?: string;
  description?: string;
  color?: string;
}

// ----------------------------------------------------------------------
// VIGENCIES INTERFACES
// ----------------------------------------------------------------------

export interface IPeriod {
  id: string;
  vigencyId?: string;
  name: string;
  abbreviation: string;
  startDate: Date | string;
  endDate: Date | string;
  percentage: number;
  isActive?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  deletedAt?: Date | string | null;
}

export interface IVigency {
  id: string;
  name: string;
  startDate: Date | string;
  endDate: Date | string;
  isActive: boolean;
  periods?: IPeriod[];
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
}

export interface IVigencyTableFilters {
  name: string;
  isActive?: string;
}

export type IVigencyTableFilterValue = string | string[];

export interface IVigenciesResponse {
  statusCode: number;
  data: {
    data: IVigency[];
    meta: {
      page: number;
      perPage: number;
      itemCount: number;
      pageCount: number;
      hasPreviousPage: boolean;
      hasNextPage: boolean;
    };
  };
  message: string;
}

export interface IVigencyResponse {
  statusCode: number;
  data: IVigency;
  message: string;
}

// ----------------------------------------------------------------------
// PERIODS INTERFACES
// ----------------------------------------------------------------------

export interface IPeriodTableFilters {
  name: string;
}

export type IPeriodTableFilterValue = string | string[];

export interface IPeriodsResponse {
  statusCode: number;
  data: {
    data: IPeriod[];
    meta: {
      page: number;
      perPage: number;
      itemCount: number;
      pageCount: number;
      hasPreviousPage: boolean;
      hasNextPage: boolean;
    };
  };
  message: string;
}

export interface IPeriodResponse {
  statusCode: number;
  data: IPeriod & {
    vigency?: IVigency;
  };
  message: string;
}
