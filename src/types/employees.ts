// ----------------------------------------------------------------------

export type IEmploymentType = {
  id: string;
  name: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
};

export type IEmploymentTypeTableFilters = {
  name: string;
  status: string;
};

export type IEmploymentTypeTableFilterValue = string | string[];

// ----------------------------------------------------------------------
// API RESPONSE INTERFACES FOR EMPLOYMENT TYPES
// ----------------------------------------------------------------------

export interface IEmploymentTypesResponse {
  statusCode: number;
  data: IEmploymentType[];
  message: string;
}

// ----------------------------------------------------------------------
// SEARCH OPTION INTERFACES FOR AUTOCOMPLETES
// ----------------------------------------------------------------------

export interface IEmploymentTypeOption {
  id: string;
  name: string;
}

// ----------------------------------------------------------------------

export type IUserManagement = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  address: string;
  location?: {
    municipality: {
      id: string;
      name: string;
    };
    region: {
      id: string;
      name: string;
    };
    country: {
      id: string;
      name: string;
    };
  };
  coin: {
    id: string;
    name: string;
  };
  paymentPeriod: {
    id: string;
    name: string;
  };
  minimumBillingRatePerHour: string;
  recurringWeeklyLimitHours: string;
  position: {
    id: string;
    name: string;
  };
  skills: Array<{
    id: string;
    name: string;
  }>;
  employmentType: {
    id: string;
    name: string;
  };
  startedWorkOn: Date | string;
  createdAt: Date | string;
  deletedAt: Date | string | null;
  
  // Campos opcionales que pueden no venir en la respuesta actual
  firstName?: string;
  secondName?: string;
  firstLastName?: string;
  secondLastName?: string;
  postalCode?: string;
  billingRatePerHour?: string;
  municipalityId?: string;
  paymentPeriodId?: string;
  coindId?: string;
  organizationalUnitId?: string;
  employmentTypeId?: string;
  skillId?: string;
  positionId?: string;
  updatedAt?: Date | string;
};

// Interface para el payload de envío al servidor
export type IUserManagementFormData = {
  firstName: string;
  secondName: string;
  firstLastName: string;
  secondLastName: string;
  address: string;
  municipalityId: number;
  postalCode: string;
  startedWorkOn: string;
  paymentPeriodId: number;
  coindId: number; // Note: typo in API - coindId instead of coinId
  billingRatePerHour: string;
  minimunBllingRatePerHour: string; // Note: typo in API - minimun and Blling
  recurringWeeklyLimitHours: string;
  organizationalUnitId: number;
  employmentTypeId: number;
  skillIds: number[];
  positionId: number;
  userId: number;
};

// Interface para el formulario que incluye los autocompletes
export type IUserManagementFormSchema = {
  firstName: string;
  secondName: string;
  firstLastName: string;
  secondLastName: string;
  address: string;
  countrySelect?: { id: string; name: string; } | null;
  regionSelect?: { id: string; name: string; } | null;
  municipalityId: { id: string; name: string; } | null;
  postalCode: string;
  startedWorkOn: string;
  paymentPeriodId: number;
  coindId: number;
  billingRatePerHour: string;
  minimunBllingRatePerHour: string;
  recurringWeeklyLimitHours: string;
  organizationalUnitId: { id: string; name: string; } | null;
  employmentTypeId: { id: string; name: string; } | null;
  skillId: { id: string; name: string; }[];
  positionId: { id: string; name: string; } | null;
  userId: { id: string; names: string; } | null;
};

export type IUserManagementTableFilters = {
  name: string;
  status: string;
  positionId: string;
  skillId: string;
  organizationalUnitId: string;
  countryId: string;
  regionId: string;
};

export type IUserManagementTableFilterValue = string | string[];

export type IPaginationMeta = {
  page: number;
  take: number;
  itemCount: number;
  pageCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type IUserManagementResponse = {
  data: IUserManagement[];
  meta: IPaginationMeta;
};

// ----------------------------------------------------------------------

export type ISkills = {
  id: string;
  name: string;
  color: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
};

export type ISkillsTableFilters = {
  name: string;
  status: string;
  color: string;
};

export type ISkillsTableFilterValue = string | string[];

// Interfaces para el servicio de Skills
export interface ISkill {
  id: string;
  name: string;
  color: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
}

export interface ISkillsResponse {
  statusCode: number;
  data: ISkill[];
  message: string;
}

export interface ISkillOption {
  id: string;
  name: string;
  color?: string;
}

// ----------------------------------------------------------------------
// LEARNING PATHS INTERFACES
// ----------------------------------------------------------------------

export interface ILearningPathModule {
  id: string;
  skillName: string;
  skillLevelName: string;
  order: number;
  learningObjects: ILearningObject[];
}

export interface ILearningObject {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  order: number;
  products: any[];
}

export interface ILearningPath {
  id: string;
  name: string;
  description: string;
  videoUrl: string | null;
  bannerUrl: string | null;
  isActive: boolean;
  position?: {
    id: string;
    name: string;
  };
  modules: ILearningPathModule[];
}

export interface ILearningPathAssignment {
  id: string;
  name: string;
}

export interface ILearningPathAssignmentsResponse {
  data: ILearningPathAssignment[];
  meta: {
    page: number;
    perPage: number;
    itemCount: number;
    pageCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

export interface ILearningPathOption {
  id: string;
  name: string;
  description?: string;
  positionName?: string;
  isActive?: boolean;
}

export interface ILearningPathsListResponse {
  data: ILearningPathOption[];
  meta: {
    page: number;
    perPage: number;
    itemCount: number;
    pageCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

export interface IAssignLearningPathPayload {
  learningPathId: number;
}