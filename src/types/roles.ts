export interface IRole {
  id: string;
  name: string;
  description: string;
  slug: string | null;
  isDefault: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface IRoleTableFilters {
  name: string;
}

export interface IRolePayload {
  name: string;
  description: string;
}

export interface IRoleOption {
  id: string;
  name: string;
}

export interface GetRolesParams {
  page?: number;
  perPage?: number;
  take?: number;
  search?: string;
}

export interface IRoleListResponse {
  statusCode: number;
  data: IRole[];
  message: string;
}

export interface IRoleByIdResponse {
  statusCode: number;
  data: IRole;
}
