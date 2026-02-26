'use client';

import type { OrganizationPosition } from 'src/types/organizational-chart-position';

import { memo, useMemo } from 'react';

import Box from '@mui/material/Box';

import { useTranslate } from 'src/locales';

import { DiagramBase } from './DiagramBase';
import { EmployeeNode } from './nodes/EmployeeNode';
import { useDiagramData } from './hooks/useDiagramData';

// ----------------------------------------------------------------------

export interface OrganizationChartProps {
  data: OrganizationPosition | null;
  onPositionEdit?: (position: OrganizationPosition) => void;
  onPositionDelete?: (position: OrganizationPosition) => void;
  onPositionAssign?: (position: OrganizationPosition) => void;
  onAddSubPosition?: (parentPosition?: OrganizationPosition) => void;
  readonly?: boolean;
  height?: number | string;
  showControls?: boolean;
  showMiniMap?: boolean;
}

function OrganizationChartComponent({
  data,
  onPositionEdit,
  onPositionDelete,
  onPositionAssign,
  onAddSubPosition,
  readonly = false,
  height = 700,
  showControls = true,
  showMiniMap = true,
}: OrganizationChartProps) {
  const { t } = useTranslate('organization');

  const {
    nodes,
    edges,
    handleExpandAll,
    handleCollapseAll,
  } = useDiagramData(data, {
    onEdit: onPositionEdit,
    onDelete: onPositionDelete,
    onAssign: onPositionAssign,
    readonly,
  });

  // Tipos de nodos personalizados (memoizado)
  const nodeTypes = useMemo(() => ({
    employee: EmployeeNode,
  }), []);

  if (!data) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.neutral',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {t('organigrama.messages.noData')}
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', height }}>
      <DiagramBase
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        showControls={showControls}
        showMiniMap={showMiniMap}
        showBackground
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
        style={{ height: '100%' }}
        showExpandCollapseControls
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
      />
    </Box>
  );
}

// Exportar componente memoizado para optimizar re-renders
export const OrganizationChart = memo(OrganizationChartComponent);

