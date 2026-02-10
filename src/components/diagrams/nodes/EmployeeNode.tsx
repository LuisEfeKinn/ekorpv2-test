'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

import { EmployeeNodeCard, type EmployeeNodeData } from './EmployeeNodeCard';

// ----------------------------------------------------------------------

export type { EmployeeNodeData };

function EmployeeNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as unknown as EmployeeNodeData;

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: nodeData.organizationColor || '#ddd',
          width: 8,
          height: 8,
          border: 'none',
        }}
      />

      <EmployeeNodeCard data={nodeData} selected={selected} />

      {nodeData.hasChildren && !nodeData.isCollapsed && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{
            background: nodeData.organizationColor || '#ddd',
            width: 8,
            height: 8,
            border: 'none',
            bottom: -4,
          }}
        />
      )}
    </>
  );
}

export const EmployeeNode = memo(EmployeeNodeComponent);