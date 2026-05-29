// ✅ Tipos actualizados para cargos (sin level)
import type { OrganizationPosition, OrganizationalChartData } from 'src/types/organizational-chart-position';

import { MOCK_ORGANIZATIONAL_DATA } from 'src/_mock/organization-chart';


const organizationalChartData = MOCK_ORGANIZATIONAL_DATA;


// ✅ Función helper para calcular la profundidad del árbol
const calculateTreeDepth = (position: OrganizationPosition, currentDepth = 1): number => {
  if (!position.children || position.children.length === 0) {
    return currentDepth;
  }
  
  const childDepths = position.children.map(child => 
    calculateTreeDepth(child, currentDepth + 1)
  );
  
  return Math.max(...childDepths);
};

// ✅ Función helper para contar total de empleados
const countTotalEmployees = (position: OrganizationPosition): number => {
  const currentEmployees = position.assignedEmployees?.filter(emp => emp.isActive).length || 0;
  
  if (!position.children || position.children.length === 0) {
    return currentEmployees;
  }
  
  const childrenEmployees = position.children.reduce((total, child) => 
    total + countTotalEmployees(child), 0
  );
  
  return currentEmployees + childrenEmployees;
};

// ✅ Función helper para contar total de cargos
const countTotalPositions = (position: OrganizationPosition): number => {
  if (!position.children || position.children.length === 0) {
    return 1;
  }
  
  return 1 + position.children.reduce((total, child) => 
    total + countTotalPositions(child), 0
  );
};

// ✅ Métodos del servicio actualizados
export const OrganizationalChartService = {
  async getOrganizationalChart(): Promise<{ data: OrganizationalChartData }> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // ✅ Recalcular estadísticas dinámicamente
    const data = {
      ...organizationalChartData,
      totalPositions: countTotalPositions(organizationalChartData.root),
      totalEmployees: countTotalEmployees(organizationalChartData.root),
      maxDepth: calculateTreeDepth(organizationalChartData.root),
    };
    
    return { data };
  },

  async createPosition(data: Partial<OrganizationPosition>): Promise<{ data: OrganizationPosition }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newPosition: OrganizationPosition = {
      id: `pos-${Date.now()}`,
      positionId: `pos-${data.positionCode?.toLowerCase()}-${Date.now()}`,
      name: data.name || '',
      positionCode: data.positionCode,
      positionImage: data.positionImage || null,
      organizationId: data.organizationId || '',
      organizationName: data.organizationName || 'Sin organización',
      organizationColor: data.organizationColor || '#1976d2',
      functionalArea: data.functionalArea || 'Sin área funcional',
      location: data.location || 'Sin ubicación',
      hierarchicalLevel: data.hierarchicalLevel || 'Sin nivel jerárquico',
      requiredEmployees: data.requiredEmployees || 0,
      vacancies: data.vacancies || 0,
      
      // ✅ Usar parentPositionId en lugar de level
      parentPositionId: data.parentPositionId || null,
      parentPositionName: data.parentPositionName || null,
      
      description: data.description,
      skills: data.skills || [],
      isManagerial: data.isManagerial || false,
      assignedEmployees: [],
      children: [],
    };
    
    console.log('✅ Creando nuevo cargo:', newPosition);
    return { data: newPosition };
  },

  async updatePosition(data: Partial<OrganizationPosition>): Promise<{ data: OrganizationPosition }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('✅ Actualizando cargo:', data);
    return { data: data as OrganizationPosition };
  },

  async deletePosition(positionId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('🗑️ Eliminando cargo:', positionId);
  },

  // ✅ Nuevo método para obtener lista plana de cargos (útil para selectors)
  async getAvailablePositions(excludeId?: string): Promise<{ data: OrganizationPosition[] }> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const flattenPositions = (position: OrganizationPosition): OrganizationPosition[] => {
      const result = [position];
      if (position.children) {
        position.children.forEach(child => {
          result.push(...flattenPositions(child));
        });
      }
      return result;
    };
    
    const allPositions = flattenPositions(organizationalChartData.root);
    const filteredPositions = excludeId 
      ? allPositions.filter(pos => pos.id !== excludeId)
      : allPositions;
    
    return { data: filteredPositions };
  },

  // ✅ Método para obtener jerarquía de un cargo específico
  async getPositionHierarchy(positionId: string): Promise<{ 
    data: { 
      position: OrganizationPosition; 
      parent?: OrganizationPosition; 
      children: OrganizationPosition[] 
    } 
  }> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const findPositionInTree = (
      tree: OrganizationPosition, 
      id: string, 
      parent?: OrganizationPosition
    ): { position: OrganizationPosition; parent?: OrganizationPosition } | null => {
      if (tree.id === id) {
        return { position: tree, parent };
      }
      
      if (tree.children) {
        for (const child of tree.children) {
          const found = findPositionInTree(child, id, tree);
          if (found) return found;
        }
      }
      
      return null;
    };
    
    const result = findPositionInTree(organizationalChartData.root, positionId);
    
    if (!result) {
      throw new Error(`Position with id ${positionId} not found`);
    }
    
    return {
      data: {
        position: result.position,
        parent: result.parent,
        children: result.position.children || [],
      }
    };
  },
};