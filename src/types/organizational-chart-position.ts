export interface OrganizationPosition {
  id: string;
  positionId: string;
  name: string;
  positionCode?: string;
  positionImage?: string | null;
  organizationId: string;
  organizationName: string;
  organizationColor: string;
  functionalArea?: string;
  location: string;
  hierarchicalLevel: string;
  requiredEmployees: number;
  vacancies: number;
  
  // ✅ Reemplazar level por parentPositionId
  parentPositionId?: string | null; // ✅ ID del cargo padre
  parentPositionName?: string | null; // ✅ Nombre del cargo padre (para mostrar)
  
  description?: string;
  skills?: string[];
  isManagerial: boolean;
  
  // ✅ Empleados asignados a este cargo
  assignedEmployees: {
    id: string;
    firstName: string;
    firstLastName: string;
    email: string;
    avatarUrl?: string | null;
    isActive: boolean;
  }[];
  
  // ✅ Jerarquía
  children: OrganizationPosition[] | undefined;
}

export interface OrganizationalChartData {
  root: OrganizationPosition;
  totalPositions: number;
  totalEmployees: number;
  totalVacancies: number;
  maxDepth: number; // ✅ Profundidad máxima del árbol (reemplaza totalLevels)
  organizations: {
    id: string;
    name: string;
    color: string;
  }[];
  functionalAreas: string[];
}

// ✅ Tipos para el servicio de cargos (Jobs)
export interface JobOrganigramEmployee {
  id: string;
  fullName: string;
}

export interface JobOrganigramOrganizationalUnit {
  id: string;
  name: string;
  color: string;
}

export interface JobOrganigramPosition {
  id: number;
  name: string;
  numberOfPositions: number;
  competencies: string | null;
  organizationalUnit: JobOrganigramOrganizationalUnit | null;
  employees: JobOrganigramEmployee[];
  children: JobOrganigramPosition[];
}

// ✅ Tipos para el servicio de organizaciones
export interface OrganizationalUnitNode {
  id: string;
  name: string;
  code: string;
  description: string | null;
  color: string | null;
  children: OrganizationalUnitNode[];
}