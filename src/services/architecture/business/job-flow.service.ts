
import type { JobFlowNode } from 'src/types/job-flow';

import axios from 'src/utils/axios';

// ----------------------------------------------------------------------

type JobFlowParams = Record<string, string | number | boolean | undefined>;

const transformData = (nodes: unknown): JobFlowNode[] => {
  if (!Array.isArray(nodes)) return [];

  return nodes.map((node) => {
    const safeNode = (node ?? {}) as Record<string, unknown>;
    const children = safeNode.children;

    return {
      ...(safeNode as unknown as JobFlowNode),
      name: typeof safeNode.label === 'string' ? safeNode.label : '',
      children: transformData(children),
    };
  });
};

export const JobFlowService = {
  getFlow: async (params?: JobFlowParams) => {
    const response = await axios.get<unknown>('/api/job/flow', { params });
    return { data: transformData(response.data) };
  },
};
