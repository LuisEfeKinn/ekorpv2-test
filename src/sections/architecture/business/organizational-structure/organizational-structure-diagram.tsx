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

  const colors = useMemo(
    () => [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.info.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
      theme.palette.primary.dark,
    ],
    [theme]
  );

  const buildGraph = useCallback(
    (data: OrganizationalUnitMapNode) => {
      const radius = 420;
      const count = data.children?.length || 0;
      const angleStep = (2 * Math.PI) / Math.max(count, 1);
      const centerX = 0;
      const centerY = 0;

      const centralNode: Node = {
        id: 'central',
        type: 'central',
        position: { x: centerX - 160, y: centerY - 80 },
        data: { id: String(data.id), label: data.label } satisfies NodeDataCentral,
        draggable: true,
      };

      const childNodes: Node[] = (data.children || []).map((child, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius - 100;
        const y = centerY + Math.sin(angle) * radius - 90;
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
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Iconify
                icon="solar:inbox-in-bold"
                width={60}
                sx={{ color: alpha(theme.palette.primary.main, 0.5) }}
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
        height: 850,
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'background.neutral',
        ...sx,
      }}
    >
      <Box sx={{ position: 'absolute', top: { xs: 12, sm: 16 }, left: { xs: 12, sm: 16 }, zIndex: 100, pointerEvents: 'none' }}>
        <Paper elevation={2} sx={{ px: { xs: 1.5, sm: 2 }, py: { xs: 1, sm: 1.25 }, borderRadius: 1.5, bgcolor: alpha(theme.palette.background.paper, 0.9), backdropFilter: 'blur(8px)', border: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: { xs: 6, sm: 8 }, height: { xs: 6, sm: 8 }, borderRadius: '50%', bgcolor: theme.palette.success.main, animation: 'blink 2s ease-in-out infinite', '@keyframes blink': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.3 } } }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
              {(mapData.children || []).length} Módulos Conectados
            </Typography>
          </Stack>
        </Paper>
      </Box>

      <Box sx={{ position: 'absolute', top: { xs: 12, sm: 16 }, right: { xs: 12, sm: 16 }, zIndex: 100, pointerEvents: 'none' }}>
        <Paper elevation={2} sx={{ px: { xs: 1.5, sm: 2 }, py: { xs: 1, sm: 1.25 }, borderRadius: 1.5, bgcolor: alpha(theme.palette.background.paper, 0.9), backdropFilter: 'blur(8px)', border: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
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
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable
        zoomOnScroll
        panOnScroll
        proOptions={{ hideAttribution: true }}
      >
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable />
        <Background color={alpha(theme.palette.primary.main, 0.08)} gap={24} size={2} variant={BackgroundVariant.Dots} />
      </ReactFlow>
    </Card>
  );
}
