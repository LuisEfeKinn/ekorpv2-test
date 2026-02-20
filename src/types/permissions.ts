// ----------------------------------------------------------------------

export type ModuleOption = {
  id: string;
  name: string;
  icon?: string;
};

export type PermissionItem = {
  itemId: string;
  itemName: string;
  permissions: Array<{
    permissionId: string;
    permissionName: string;
  }>;
};

export type ModuleData = {
  moduleId: string;
  moduleName: string;
  items: PermissionItem[];
};

export type AvailablePermission = {
  id: string;
  name: string;
  icon?: string;
  color?: string;
};

export type PermissionsTableProps = {
  roleId: string;
  roleName?: string;
};

export type PermissionsRoleViewProps = {
  roleId: string;
};

// Tipos para las respuestas de la API
export type GetPermissionsRelatedDataResponse = {
  modules: Array<{
    id: string;
    name: string;
    icon?: string;
  }>;
  permissions: Array<{
    id: string;
    name: string;
  }>;
};

export type GetRolePermissionsResponse = ModuleData;

export type UpdateRolePermissionRequest = {
  roleId: number;
  itemId: number;
  permissionId: number;
};