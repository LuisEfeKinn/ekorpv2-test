import type { OrganizationPosition } from 'src/types/organizational-chart-position';

import { useMemo, useState, useCallback } from 'react';

import { createOrganizationalLayout } from '../layouts/treeLayout';
import { 
  transformTreeToReactFlow,
} from '../utils/dataTransforms';

// ----------------------------------------------------------------------

interface UseDiagramDataOptions {
  onEdit?: (position: OrganizationPosition) => void;
  onDelete?: (position: OrganizationPosition) => void;
  onAssign?: (position: OrganizationPosition) => void;
  readonly?: boolean;
}

export function useDiagramData(
  rootData: OrganizationPosition | null,
  options: UseDiagramDataOptions = {}
) {
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  
  // Destructurar options para evitar dependencias de objeto
  const { onEdit, onDelete, onAssign, readonly } = options;

  // Memoizar la transformación de datos base
  const baseNodesAndEdges = useMemo(() => {
    if (!rootData) return { nodes: [], edges: [] };
    
    return transformTreeToReactFlow(rootData, new Set());
  }, [rootData]);

  // Memoizar el mapa de edges para optimizar búsquedas
  const edgeMap = useMemo(() => {
    const map = new Map<string, string[]>();
    baseNodesAndEdges.edges.forEach(edge => {
      if (!map.has(edge.source)) {
        map.set(edge.source, []);
      }
      map.get(edge.source)!.push(edge.target);
    });
    return map;
  }, [baseNodesAndEdges.edges]);

  // Cache de posiciones calculadas para evitar recalcular layout
  const layoutCache = useMemo(() => {
    if (baseNodesAndEdges.nodes.length === 0) return new Map();
    
    // Solo calcular layout una vez y cachear todas las posiciones
    const { nodes: layoutedNodes } = createOrganizationalLayout(
      baseNodesAndEdges.nodes,
      baseNodesAndEdges.edges
    );
    
    const cache = new Map();
    layoutedNodes.forEach(node => {
      cache.set(node.id, { x: node.position.x, y: node.position.y });
    });
    
    return cache;
  }, [baseNodesAndEdges]);

  // Crear función estable que no cambie en cada render
  const toggleCollapseFn = useCallback((positionId: string) => {
    setCollapsedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(positionId)) {
        newSet.delete(positionId);
      } else {
        newSet.add(positionId);
      }
      return newSet;
    });
  }, []);

  // Handlers para nodos (optimizado)
  const handleToggleCollapse = useCallback((positionId: string) => {
    toggleCollapseFn(positionId);
  }, [toggleCollapseFn]);

  const handleExpandAll = useCallback(() => {
    setCollapsedNodes(new Set());
  }, []);

  const handleCollapseAll = useCallback(() => {
    if (!rootData) return;

    // Optimizado: Solo colapsar nodos que tienen hijos
    const getNodeIdsWithChildren = (node: OrganizationPosition): string[] => {
      const ids: string[] = [];
      
      if (node.children && node.children.length > 0) {
        if (node.positionId) ids.push(node.positionId);
        
        node.children.forEach(child => {
          ids.push(...getNodeIdsWithChildren(child));
        });
      }
      
      return ids;
    };

    const nodeIdsWithChildren = getNodeIdsWithChildren(rootData);
    setCollapsedNodes(new Set(nodeIdsWithChildren));
  }, [rootData]);

  // Aplicar estado de colapso con cache de posiciones (súper optimizado)
  const { nodes, edges } = useMemo(() => {
    const { nodes: allNodes, edges: allEdges } = baseNodesAndEdges;

    // Determinar qué nodos deben estar ocultos (optimizado)
    const hiddenNodeIds = new Set<string>();
    
    const markDescendantsAsHidden = (nodeId: string) => {
      const children = edgeMap.get(nodeId) || [];
      children.forEach(childId => {
        hiddenNodeIds.add(childId);
        markDescendantsAsHidden(childId);
      });
    };

    // Marcar descendientes de nodos colapsados como ocultos
    collapsedNodes.forEach(nodeId => {
      markDescendantsAsHidden(nodeId);
    });

    // 2. Agregar handlers y configurar visibilidad
    const nodesWithState = allNodes.map(node => {
      const hasChildren = edgeMap.has(node.id);
      const cachedPosition = layoutCache.get(node.id);
      
      return {
        ...node,
        hidden: hiddenNodeIds.has(node.id),
        position: cachedPosition || node.position, // Aplicar posiciones desde cache
        data: {
          ...node.data,
          onEdit,
          onDelete,
          onAssign,
          readonly,
          onToggleCollapse: toggleCollapseFn,
          isCollapsed: collapsedNodes.has(node.id),
          hasChildren,
        },
      };
    });

    // 3. Filtrar edges de nodos ocultos
    const visibleEdges = allEdges.filter(
      edge => !hiddenNodeIds.has(edge.source) && !hiddenNodeIds.has(edge.target)
    );
    
    return {
      nodes: nodesWithState,
      edges: visibleEdges,
    };
  }, [baseNodesAndEdges, collapsedNodes, onEdit, onDelete, onAssign, readonly, toggleCollapseFn, layoutCache, edgeMap]);

  return {
    nodes,
    edges,
    collapsedNodes,
    handleToggleCollapse,
    handleExpandAll,
    handleCollapseAll,
  };
}