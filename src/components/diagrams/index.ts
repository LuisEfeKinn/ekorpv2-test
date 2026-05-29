// Componentes principales
export { DiagramBase } from './DiagramBase';

// Nodos  
export { EmployeeNode } from './nodes/EmployeeNode';

export { OrganizationChart } from './OrganizationChart';

// Hooks
export { useDiagramData } from './hooks/useDiagramData';

// Layouts
export { createTreeLayout, createOrganizationalLayout } from './layouts/treeLayout';

// Utilidades
export {
  findRootNode,
  findNodeDescendants,
  updateNodesVisibility,
  transformTreeToReactFlow,
} from './utils/dataTransforms';

// Tipos
export type { DiagramBaseProps } from './DiagramBase';
export type { EmployeeNodeData } from './nodes/EmployeeNode';
export type { OrganizationChartProps } from './OrganizationChart';