'use client';

import '@xyflow/react/dist/style.css';

import type { Edge, Node } from '@xyflow/react';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha, useTheme, type Theme, type SxProps } from '@mui/material/styles';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import {
  type NodeDataCentral,
  organizationalStructureNodeTypes,
} from './organizational-structure-node-types';

// Define a generic interface for the node data
export interface ChartNodeData {
  id: string | number;
  label: string;
  children?: ChartNodeData[];
  [key: string]: any;
}

type Props = {
  initialNodeId: string;
  fetchNodeData: (id: string) => Promise<ChartNodeData>;
  onNodeClick?: (node: ChartNodeData) => void;
  sx?: SxProps<Theme>;
};

export function OrganizationalChartComponent({ initialNodeId, fetchNodeData, onNodeClick, sx }: Props) {
  const theme = useTheme();
  
  // State
  const [loading, setLoading] = useState(true);
  const [currentNodeId, setCurrentNodeId] = useState<string>(initialNodeId);
  const [mapData, setMapData] = useState<ChartNodeData | null>(null);
  const [history, setHistory] = useState<{ id: string; label: string }[]>([]);
  
  // React Flow State
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Refs for click handling
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleNodeClick = useCallback((event: React.MouseEvent, node: ChartNodeData) => {
    // Check click count from event
    if (event.detail === 2) {
      // Double click detected
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }

      if (mapData) {
        setHistory((prev) => [...prev, { id: String(mapData.id), label: mapData.label }]);
      }
      
      setCurrentNodeId(String(node.id));
      return;
    }

    // Single click logic with debounce
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }

    clickTimeoutRef.current = setTimeout(() => {
      if (onNodeClick) {
        onNodeClick(node);
      }
      clickTimeoutRef.current = null;
    }, 250);
  }, [mapData, onNodeClick]);

  const buildGraph = useCallback(
    (data: ChartNodeData) => {
      const count = data.children?.length || 0;
      const centerX = 0;
      const centerY = -350;
      const centralWidth = 320;
      const centralHeight = 200;
      const childWidth = 220;
      const childHeight = 180;
      const maxPerRing = 8;
      const baseRadius = 450;
      const ringSpacing = 300;

      const centralNode: Node = {
        id: 'central',
        type: 'central',
        position: { x: centerX - centralWidth / 2, y: centerY - centralHeight / 2 },
        data: { id: String(data.id), label: data.label } satisfies NodeDataCentral,
        draggable: true,
      };

      const childNodes: Node[] = (data.children || []).map((child, index) => {
        const ringIndex = Math.floor(index / maxPerRing);
        const ringCount = Math.min(maxPerRing, count - ringIndex * maxPerRing);
        const angleStep = (2 * Math.PI) / Math.max(ringCount, 1);
        const angle = (index % maxPerRing) * angleStep - Math.PI / 2;
        const radius = baseRadius + ringIndex * ringSpacing;
        const x = centerX + Math.cos(angle) * radius - childWidth / 2;
        const y = centerY + Math.sin(angle) * radius - childHeight / 2;
        const color = theme.palette.info.main;

        return {
          id: String(child.id),
          type: 'child',
          position: { x, y },
          data: {
            id: String(child.id),
            label: child.label,
            color,
            onClick: (event: any) => handleNodeClick(event, child),
          } as any,
          draggable: true,
        };
      });

      const newEdges: Edge[] = (data.children || []).map((child, index) => {
        const color = theme.palette.info.main;
        return {
          id: `central-${String(child.id)}`,
          source: 'central',
          target: String(child.id),
          type: 'straight',
          animated: true,
          style: { stroke: alpha(color, 0.5), strokeWidth: 3 },
          markerEnd: { type: 'arrowclosed' as const, color: alpha(color, 0.5) },
        };
      });

      setNodes([centralNode, ...childNodes]);
      setEdges(newEdges);
    },
    [handleNodeClick, setEdges, setNodes, theme]
  );

  // Fetch Data
  useEffect(() => {
    let active = true;

    const run = async () => {
      setLoading(true);

      try {
        const response = await fetchNodeData(currentNodeId);

        if (!active) return;

        // Ensure response matches ChartNodeData structure. 
        // The service usually returns { data: ... } or just data.
        // Assuming fetchNodeData returns the node object directly or we adjust it.
        // If the service returns `response.data`, the caller should handle it.
        // We assume `fetchNodeData` returns the node data directly.
        
        setMapData(response);
        buildGraph(response);
      } catch (error) {
        console.error(error);
        if (active) {
          setMapData(null);
          toast.error('No se pudo cargar el mapa de estructura organizacional');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    if (currentNodeId) run();

    return () => {
      active = false;
    };
  }, [currentNodeId, fetchNodeData, buildGraph]);

  // Navigation Back
  const handleGoBack = () => {
    if (history.length === 0) return;
    
    const newHistory = [...history];
    const parent = newHistory.pop();
    
    if (parent) {
      setHistory(newHistory);
      setCurrentNodeId(parent.id);
    }
  };

  const parentNode = history.length > 0 ? history[history.length - 1] : null;

  if (loading) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 600,
          ...sx,
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="body2" color="text.secondary">
            Cargando mapa…
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (!mapData) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 600,
          ...sx,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No se encontraron datos.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '80vh', position: 'relative', ...sx }}>
      {/* Back Navigation Header */}
      {parentNode && (
        <Box
          sx={{
            position: 'absolute',
            top: 20,
            left: 20,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: 'background.paper',
            p: 1,
            borderRadius: 1,
            boxShadow: theme.shadows[3],
          }}
        >
          <Button
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
            onClick={handleGoBack}
            color="inherit"
          >
            Volver a {parentNode.label}
          </Button>
        </Box>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={organizationalStructureNodeTypes}
        fitView
        attributionPosition="bottom-right"
        // We handle clicks on nodes via data.onClick/onDoubleClick
        // But we can also use onNodeClick/onNodeDoubleClick if we prefer not to pass callbacks in data.
        // However, ChildNode is custom and consumes data.onClick.
      />
    </Box>
  );
}
