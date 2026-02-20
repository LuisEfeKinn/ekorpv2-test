import type { Node, Edge } from '@xyflow/react';
import type { OrganizationPosition } from 'src/types/organizational-chart-position';

// ----------------------------------------------------------------------

/**
 * Convierte la estructura de árbol del organigrama actual a formato React Flow
 */
export function transformTreeToReactFlow(
  rootData: OrganizationPosition,
  collapsedNodes?: Set<string>
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  function processNode(
    nodeData: OrganizationPosition,
    parentId?: string,
    level: number = 0
  ) {
    if (!nodeData.positionId) return;

    // Crear el nodo
    const node: Node = {
      id: nodeData.positionId,
      type: 'employee', // Tipo de nodo personalizado
      position: { x: 0, y: 0 }, // Se calculará con el layout
      data: {
        ...nodeData,
        level,
        isCollapsed: collapsedNodes?.has(nodeData.positionId) || false,
        hasChildren: nodeData.children && nodeData.children.length > 0,
      },
    };

    nodes.push(node);

    // Crear edge si tiene padre
    if (parentId) {
      const edge: Edge = {
        id: `${parentId}-${nodeData.positionId}`,
        source: parentId,
        target: nodeData.positionId,
        type: 'smoothstep',
        style: {
          strokeWidth: 2,
          stroke: nodeData.organizationColor || '#ddd',
          strokeDasharray: '5,5',
        },
        markerEnd: {
          type: 'arrowclosed',
          width: 15,
          height: 15,
          color: nodeData.organizationColor || '#ddd',
        },
      };

      edges.push(edge);
    }

    // Procesar hijos si no está colapsado
    const isCollapsed = collapsedNodes?.has(nodeData.positionId) || false;
    
    if (!isCollapsed && nodeData.children) {
      nodeData.children.forEach((child) => {
        if (child && child.positionId && child.name) {
          processNode(child, nodeData.positionId, level + 1);
        }
      });
    }
  }

  processNode(rootData);

  return { nodes, edges };
}

/**
 * Actualiza la visibilidad de nodos basado en el estado de colapso
 */
export function updateNodesVisibility(
  nodes: Node[],
  edges: Edge[],
  collapsedNodes: Set<string>
): { nodes: Node[]; edges: Edge[] } {
  // Encontrar todos los nodos que deben ocultarse
  const hiddenNodeIds = new Set<string>();
  
  function markDescendantsAsHidden(nodeId: string) {
    const childEdges = edges.filter(edge => edge.source === nodeId);
    childEdges.forEach(edge => {
      hiddenNodeIds.add(edge.target);
      markDescendantsAsHidden(edge.target);
    });
  }

  // Marcar descendientes de nodos colapsados como ocultos
  collapsedNodes.forEach(nodeId => {
    markDescendantsAsHidden(nodeId);
  });

  // Filtrar nodos y edges visibles
  const visibleNodes = nodes
    .filter(node => !hiddenNodeIds.has(node.id))
    .map(node => ({
      ...node,
      data: {
        ...node.data,
        isCollapsed: collapsedNodes.has(node.id),
      },
    }));

  const visibleEdges = edges.filter(
    edge => 
      !hiddenNodeIds.has(edge.source) && 
      !hiddenNodeIds.has(edge.target)
  );

  return {
    nodes: visibleNodes,
    edges: visibleEdges,
  };
}

/**
 * Encuentra todos los descendientes de un nodo
 */
export function findNodeDescendants(
  nodeId: string,
  edges: Edge[]
): string[] {
  const descendants: string[] = [];
  
  function findChildren(parentId: string) {
    const childEdges = edges.filter(edge => edge.source === parentId);
    childEdges.forEach(edge => {
      descendants.push(edge.target);
      findChildren(edge.target);
    });
  }

  findChildren(nodeId);
  return descendants;
}

/**
 * Encuentra el nodo raíz (sin padre)
 */
export function findRootNode(nodes: Node[], edges: Edge[]): Node | null {
  const hasParent = new Set(edges.map(edge => edge.target));
  return nodes.find(node => !hasParent.has(node.id)) || null;
}