export interface IRole {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}

export interface IRoleTableFilters {
  name: string;
}
