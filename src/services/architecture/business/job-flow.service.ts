
import type { JobFlowNode } from 'src/types/job-flow';

import axios from 'src/utils/axios';

// ----------------------------------------------------------------------

const transformData = (nodes: any[]): JobFlowNode[] => nodes.map((node) => ({
    ...node,
    name: node.label, // Map label to name
    children: node.children ? transformData(node.children) : [],
  }));

export const JobFlowService = {
  getFlow: async () => {
    // The user specified /api/job/flow
    const response = await axios.get<any[]>(
      '/api/job/flow'
    );
    
    // Transform data to include 'name' property
    const transformedData = transformData(response.data);
    
    return { data: transformedData };
  },
};
