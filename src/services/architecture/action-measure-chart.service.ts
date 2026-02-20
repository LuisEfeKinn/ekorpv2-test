
import type { ActionMeasureNode } from 'src/types/action-measure-chart';

import axios from 'src/utils/axios';

// ----------------------------------------------------------------------

const transformData = (nodes: any[]): ActionMeasureNode[] => nodes.map((node) => ({
    ...node,
    name: node.label, // Map label to name
    children: node.children ? transformData(node.children) : [],
  }));

export const ActionMeasureChartService = {
  getFlow: async () => {
    // The user specified /api/actionMeasure/flow
    const response = await axios.get<any[]>(
      '/api/actionMeasure/flow'
    );
    
    // Transform data to include 'name' property
    const transformedData = transformData(response.data);
    
    return { data: transformedData };
  },
};
