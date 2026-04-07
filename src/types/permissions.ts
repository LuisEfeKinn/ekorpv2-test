// ----------------------------------------------------------------------

export type IRoleCatalogItem = {
  itemId: number;
  itemName: string;
  icon: string;
  route: string;
  order: number;
  itemparentId: number | null;
};

export type IRoleCatalogModule = {
  moduleId: number;
  moduleName: string;
  moduleOrder: number;
  items: IRoleCatalogItem[];
};

export type IRoleAssignedItem = IRoleCatalogItem & { scope: string };

export type IRoleAssignedModule = {
  moduleId: number;
  moduleName: string;
  moduleOrder: number;
  items: IRoleAssignedItem[];
};

export type IRoleCatalogResponse = {
  statusCode: number;
  data: IRoleCatalogModule[];
};

export type IRoleItemsResponse = {
  statusCode: number;
  data: IRoleAssignedModule[];
};

export type PermissionsTableProps = {
  roleId: string;
  roleName?: string;
  isDefault?: number;
};
