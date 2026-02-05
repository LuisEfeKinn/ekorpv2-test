// ----------------------------------------------------------------------

export type IIntegrationType = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type IIntegration = {
  id: string;
  key: string;
  name: string;
  description?: string;
  integrationTypeId: string;
  isActive: boolean;
  image: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  integrationType: IIntegrationType;
};

export type IIntegrationInstance = {
  id: string;
  instanceName: string;
  isActive: boolean;
  createdAt: string;
  integration: {
    id: string;
    name: string;
    image: string;
    description: string;
    integrationTypeName: string;
    createdAt: string;
  };
};

export type IIntegrationTableFilters = {
  search: string;
  status: string;
};

export type IIntegrationPaginationParams = {
  page: number;
  perPage: number;
  search?: string;
};

export type IIntegrationMeta = {
  page: number;
  perPage: number;
  itemCount: number;
  pageCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type IIntegrationPaginationResponse = {
  data: IIntegrationInstance[];
  meta: IIntegrationMeta;
};

// Types for integration editing
export type IIntegrationParameter = {
  id: string;
  name: string;
  code: string;
  value: string | null;
};

// New types for the refactored integration system
export type IIntegrationParameterDefinition = {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type IIntegrationDefaultValue = {
  id: string;
  applicationIntegrationParameterId: string;
  applicationIntegrationId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  integrationsParameters: IIntegrationParameterDefinition;
};

export type IIntegrationTemplate = {
  id: string;
  key: string;
  name: string;
  description: string;
  integrationTypeId: string;
  image: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  defaultValues: IIntegrationDefaultValue[];
  integrationType: {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  };
};

export type IIntegrationInstanceParameter = {
  parameterId: string;
  parameterName: string;
  parametercode: string;
  value: string | null;
  valueId: string | null;
};

export type IIntegrationInstanceDetail = {
  id: string;
  name: string;
  isActive: boolean;
  integrationId: string;
};

export type IIntegrationInstanceResponse = {
  instance: IIntegrationInstanceDetail;
  parameters: IIntegrationInstanceParameter[];
};

export type IIntegrationFormData = {
  integrationId: string;
  name: string;
  isActive: boolean;
  parameters: {
    parameterId: number;
    value: string;
  }[];
};

// ----------------------------------------------------------------------
// Platform Types

export type ICourseListing = {
  id: string;
  lmsCourseId: string;
  fullName: string;
  displayName: string;
  codeCourse: string;
  categorylmsName: string | null;
  integrationName: string;
  description: string | null;
  codeLanguague: string | null;
  categorylmsId: string;
};

export type ICourseListingTableFilters = {
  search: string;
  status: string;
};

export type ICourseListingPaginationParams = {
  page: number;
  take?: number;
  search?: string;
};

export type ICourseListingMeta = {
  page: number;
  perPage: number;
  itemCount: number;
  pageCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type ICourseListingPaginationResponse = {
  data: ICourseListing[];
  meta: ICourseListingMeta;
};

// ----------------------------------------------------------------------
// Categories Types

export type ICategory = {
  id: string;
  name: string;
  description: string;
  courseCount: number;
  isActive: boolean;
  createdAt: string;
};

export type ICategoryTableFilters = {
  search: string;
  includeInactive: boolean;
};

export type ICategoryPaginationParams = {
  page: number;
  perPage: number;
  search?: string;
  includeInactive?: boolean;
};

export type ICategoryMeta = {
  page: number;
  perPage: number;
  itemCount: number;
  pageCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type ICategoryPaginationResponse = {
  data: ICategory[];
  meta: ICategoryMeta;
};

// ----------------------------------------------------------------------
// Courses Types

export type ICourse = {
  id: string;
  lmsCourseId: string;
  fullName: string;
  displayName: string;
  codeCourse: string;
  categorylmsName: string | null;
  description: string;
  codeLanguague: string;
  categorylmsId: string;
  isActive: boolean;
};

export type ICourseTableFilters = {
  search: string;
  includeInactive: boolean;
  integrationId: string;
};

export type ICoursePaginationParams = {
  page: number;
  perPage: number;
  search?: string;
  includeInactive?: boolean;
  integrationId?: string;
};

export type ICourseMeta = {
  page: number;
  perPage: number;
  itemCount: number;
  pageCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type ICoursePaginationResponse = {
  data: ICourse[];
  meta: ICourseMeta;
};