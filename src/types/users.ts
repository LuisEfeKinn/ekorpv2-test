export interface IUser {
  id: string;
  email: string;
  names: string;
  lastnames: string;
  isActive: boolean;
  roles: Array<{
    id: string;
    name: string;
  }>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface IUserTableFilters {
  name: string;
  status: string;
  role: string[];
}

export interface IUserCreateInput {
  id?: string;
  email: string;
  names: string;
  lastnames: string;
  password: string;
  roleIds: string[];
  isActive?: boolean;
}

export interface IUserUpdateInput extends Partial<IUserCreateInput> {
  id: string;
}

export interface IUserOption {
  id: string;
  names: string;
  lastnames?: string;
  email: string;
  isActive: boolean;
}