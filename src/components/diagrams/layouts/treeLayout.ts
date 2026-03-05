import type { Node, Edge } from '@xyflow/react';

import dagre from '@dagrejs/dagre';

// ----------------------------------------------------------------------

export interface TreeLayoutOptions {
  direction?: 'TB' | 'BT' | 'LR' | 'RL'; // Top-Bottom, Bottom-Top, Left-Right, Right-Left
  nodeWidth?: number;
  nodeHeight?: number;
  spacing?: {
    rank: number; // Espaciado vertical entre niveles
    node: number; // Espaciado horizontal entre nodos
  };
}

const DEFAULT_OPTIONS: Required<TreeLayoutOptions> = {
  direction: 'TB',
  nodeWidth: 420,
  nodeHeight: 220,
  spacing: {
    rank: 220, // Espaciado vertical entre niveles (aumentado significativamente)
    node: 100,  // Espaciado horizontal entre nodos (aumentado)
  },
};

/**
 * Crea un layout tipo árbol para organigramas usando dagre
 */
export function createTreeLayout(
  nodes: Node[],
  edges: Edge[],
  options: TreeLayoutOptions = {}
): { nodes: Node[]; edges: Edge[] } {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Crear grafo dirigido
  const graph = new dagre.graphlib.Graph();
  
  // Configurar el grafo
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: opts.direction,
    nodesep: opts.spacing.node,
    ranksep: opts.spacing.rank,
    marginx: 50,
    marginy: 50,
  });

  // Agregar nodos al grafo
  nodes.forEach((node) => {
    graph.setNode(node.id, {
      width: opts.nodeWidth,
      height: opts.nodeHeight,
    });
  });

  // Agregar edges al grafo
  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target);
  });

  // Calcular layout
  dagre.layout(graph);

  // Aplicar posiciones calculadas a los nodos
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = graph.node(node.id);
    
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - opts.nodeWidth / 2,
        y: nodeWithPosition.y - opts.nodeHeight / 2,
      },
    };
  });

  return {
    nodes: layoutedNodes,
    edges,
  };
}

/**
 * Layout optimizado para organigramas corporativos
 */
export function createOrganizationalLayout(
  nodes: Node[],
  edges: Edge[],
  options: Partial<TreeLayoutOptions> = {}
): { nodes: Node[]; edges: Edge[] } {
  return createTreeLayout(nodes, edges, {
    direction: 'TB',
    nodeWidth: 420,
    nodeHeight: 240,
    spacing: {
      rank: 280, // Espaciado vertical muy amplio
      node: 120,  // Espaciado horizontal amplio
    },
    ...options,
  });
}