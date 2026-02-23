'use client';

import '@xyflow/react/dist/style.css';

import type { Edge, Node } from '@xyflow/react';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  MiniMap,
  Controls,
  ReactFlow,
  Background,
  useEdgesState,
  useNodesState,
  BackgroundVariant,
} from '@xyflow/react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha, useTheme, type Theme, type SxProps } from '@mui/material/styles';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import {
  type OrganizationalUnitMapNode,
  GetOrganizationalUnitMapByIdService,
} from 'src/services/organization/organizationalUnit.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import {
  type NodeDataChild,
  type NodeDataCentral,
  organizationalStructureNodeTypes,
} from './organizational-structure-node-types';

type Props = {
  organizationalUnitId: string;
  sx?: SxProps<Theme>;
};

export function OrganizationalStructureDiagram({ organizationalUnitId, sx }: Props) {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState<OrganizationalUnitMapNode | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const primaryMain = theme.palette.primary?.main || '#000000';
  const successMain = theme.palette.success?.main || '#000000';
  const backgroundPaper = theme.palette.background?.paper || '#FFFFFF';
  const divider = theme.palette.divider || '#000000';

  const colors = useMemo(
    () => [
      theme.palette.primary?.main || '#000',
      theme.palette.secondary?.main || '#000',
      theme.palette.info?.main || '#000',
      theme.palette.success?.main || '#000',
      theme.palette.warning?.main || '#000',
      theme.palette.error?.main || '#000',
      theme.palette.primary?.dark || '#000',
    ],
    [theme]
  );

  const buildGraph = useCallback(
    (data: OrganizationalUnitMapNode) => {
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
        const color = colors[index % colors.length];

        return {
          id: String(child.id),
          type: 'child',
          position: { x, y },
          data: {
            id: String(child.id),
            label: child.label,
            color,
            onClick: () =>
              router.push(
                paths.dashboard.architecture.organizationalStructureTableMapExpand(
                  String(organizationalUnitId),
                  String(child.id)
                )
              ),
          } satisfies NodeDataChild,
          draggable: true,
        };
      });

      const newEdges: Edge[] = (data.children || []).map((child, index) => {
        const color = colors[index % colors.length];
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
    [colors, organizationalUnitId, router, setEdges, setNodes]
  );

  useEffect(() => {
    let active = true;

    const run = async () => {
      setLoading(true);

      try {
        const response = await GetOrganizationalUnitMapByIdService(String(organizationalUnitId));

        if (!active) {
          return;
        }

        setMapData(response.data);
        buildGraph(response.data);
      } catch {
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

    if (organizationalUnitId) run();

    return () => {
      active = false;
    };
  }, [buildGraph, organizationalUnitId]);

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
        }}
      >
        <Typography variant="body1" color="text.secondary">
          No hay datos para mostrar
        </Typography>
      </Box>
    );
  }

  if (!mapData.children || mapData.children.length === 0) {
    return (
      <Card sx={{ width: '100%', position: 'relative', overflow: 'hidden', bgcolor: 'background.neutral', ...sx }}>
        <Box
          sx={{
            width: '100%',
            height: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Stack alignItems="center" spacing={3}>
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                bgcolor: alpha(primaryMain, 0.08),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Iconify
                icon="solar:inbox-in-bold"
                width={60}
                sx={{ color: alpha(primaryMain, 0.5) }}
              />
            </Box>
            <Stack spacing={1} alignItems="center">
              <Typography variant="h6" color="text.primary">
                {mapData.label}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 380 }}>
                Esta unidad organizacional no tiene nodos hijos para mostrar.
              </Typography>
            </Stack>
          </Stack>
        </Box>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        width: '100%',
        height: 720,
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'background.neutral',
        ...sx,
      }}
    >
      <Box sx={{ position: 'absolute', top: { xs: 12, sm: 16 }, left: { xs: 12, sm: 16 }, zIndex: 100, pointerEvents: 'none' }}>
        <Paper elevation={2} sx={{ px: { xs: 1.5, sm: 2 }, py: { xs: 1, sm: 1.25 }, borderRadius: 1.5, bgcolor: alpha(backgroundPaper, 0.9), backdropFilter: 'blur(8px)', border: `1px solid ${alpha(divider, 0.12)}` }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: { xs: 6, sm: 8 }, height: { xs: 6, sm: 8 }, borderRadius: '50%', bgcolor: successMain, animation: 'blink 2s ease-in-out infinite', '@keyframes blink': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.3 } } }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
              {(mapData.children || []).length} Módulos Conectados
            </Typography>
          </Stack>
        </Paper>
      </Box>

      <Box sx={{ position: 'absolute', top: { xs: 12, sm: 16 }, right: { xs: 12, sm: 16 }, zIndex: 100, pointerEvents: 'none' }}>
        <Paper elevation={2} sx={{ px: { xs: 1.5, sm: 2 }, py: { xs: 1, sm: 1.25 }, borderRadius: 1.5, bgcolor: alpha(backgroundPaper, 0.9), backdropFilter: 'blur(8px)', border: `1px solid ${alpha(divider, 0.12)}` }}>
          <Stack spacing={0.75}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: alpha(theme.palette.text.secondary, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Iconify icon="solar:magnifer-zoom-in-bold" width={10} sx={{ color: 'text.secondary' }} />
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                Zoom: Rueda del ratón
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: alpha(theme.palette.text.secondary, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Iconify icon="eva:move-fill" width={10} sx={{ color: 'text.secondary' }} />
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                Mover: Click sostenido y arrastrar
              </Typography>
            </Stack>
          </Stack>
        </Paper>
      </Box>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={organizationalStructureNodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.3, maxZoom: 1, duration: 800 }}
        minZoom={0.2}
        maxZoom={2}
        nodesDraggable
        zoomOnScroll
        panOnScroll={false}
        panOnDrag
        selectionOnDrag={false}
        zoomOnPinch
        zoomOnDoubleClick
        preventScrolling
        defaultEdgeOptions={{ type: 'straight', animated: true }}
        proOptions={{ hideAttribution: true }}
      >
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable maskColor={alpha(backgroundPaper, 0.8)} />
        <Background color={alpha(primaryMain, 0.08)} gap={24} size={2} variant={BackgroundVariant.Dots} />
      </ReactFlow>
    </Card>
  );
}
