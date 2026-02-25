'use client';

import '@xyflow/react/dist/style.css';

import type { Node, Edge } from '@xyflow/react';
import type { Theme, SxProps } from '@mui/material/styles';

import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  Handle,
  MiniMap,
  Controls,
  Position,
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from '@xyflow/react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { GetObjectivesMapByIdService } from 'src/services/architecture/business/objectives.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

type ChildNode = {
  id: string | number;
  label: string;
  data?: unknown;
  children?: ChildNode[];
};

type MapData = {
  id: string | number;
  label: string;
  data?: unknown;
  children: ChildNode[];
};

type Props = {
  objectiveId: string;
  sx?: SxProps<Theme>;
};

function CentralNode({ data }: any) {
  const theme = useTheme();

  return (
    <Paper
      elevation={16}
      sx={{
        px: { xs: 3, sm: 4, md: 5 },
        py: { xs: 3, sm: 3.5, md: 4 },
        borderRadius: 3,
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.5)}`,
        cursor: 'grab',
        minWidth: 280,
        position: 'relative',
        '&:active': { cursor: 'grabbing' },
      }}
    >
      <Handle
        type="source"
        position={Position.Top}
        style={{
          opacity: 0,
          width: 0,
          height: 0,
          border: 'none',
          background: 'transparent',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
      <Stack spacing={1.5} alignItems="center">
        <Chip
          label={`ID: ${String(data.appId)}`}
          size="small"
          sx={{
            bgcolor: alpha(theme.palette.common.white, 0.25),
            color: 'common.white',
            fontWeight: 700,
            fontSize: '0.75rem',
            height: 24,
            backdropFilter: 'blur(10px)',
          }}
        />
        <Typography
          variant="h5"
          sx={{
            color: 'common.white',
            fontWeight: 800,
            textAlign: 'center',
            textShadow: `0 3px 12px ${alpha(theme.palette.common.black, 0.4)}`,
            letterSpacing: '-0.5px',
            lineHeight: 1.3,
          }}
        >
          {String(data.label || '')}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: alpha(theme.palette.common.white, 0.85), fontWeight: 600, fontSize: '0.7rem' }}
        >
          Objetivo estratégico
        </Typography>
      </Stack>
    </Paper>
  );
}

function ChildNode({ data }: any) {
  const theme = useTheme();
  const { color, label, id, onClick } = data;

  return (
    <Paper
      elevation={6}
      onClick={onClick}
      sx={{
        px: { xs: 2, sm: 2.5 },
        py: { xs: 2, sm: 2.5 },
        borderRadius: 2.5,
        background: theme.palette.background.paper,
        border: `2px solid ${alpha(color, 0.3)}`,
        boxShadow: `0 4px 20px ${alpha(color, 0.2)}`,
        cursor: 'pointer',
        minWidth: 180,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px) scale(1.03)',
          boxShadow: `0 8px 32px ${alpha(color, 0.35)}`,
          borderColor: color,
        },
        '&:active': { transform: 'scale(0.98)' },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.6)})`,
          boxShadow: `0 2px 8px ${alpha(color, 0.3)}`,
        },
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          opacity: 0,
          width: 0,
          height: 0,
          border: 'none',
          background: 'transparent',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
      <Stack spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            bgcolor: alpha(color, 0.12),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px solid ${alpha(color, 0.2)}`,
            transition: 'all 0.3s ease',
          }}
        >
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              bgcolor: color,
              boxShadow: `0 3px 12px ${alpha(color, 0.5)}`,
            }}
          />
        </Box>

        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            textAlign: 'center',
            color: 'text.primary',
            fontSize: '0.95rem',
            letterSpacing: '-0.2px',
            lineHeight: 1.2,
          }}
        >
          {String(label || '')}
        </Typography>

        <Chip
          label={String(id || '')}
          size="small"
          sx={{
            bgcolor: alpha(color, 0.1),
            color,
            fontWeight: 600,
            fontSize: '0.72rem',
            height: 22,
            border: `1px solid ${alpha(color, 0.2)}`,
          }}
        />
      </Stack>
    </Paper>
  );
}

const nodeTypes = { central: CentralNode, child: ChildNode };

export function StrategicObjectivesMapDiagram({ objectiveId, sx }: Props) {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState<MapData | null>(null);
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

  const generateNodesAndEdges = useCallback(
    (data: MapData) => {
      const radius = 400;
      const angleStep = (2 * Math.PI) / (data.children?.length || 1);
      const centerX = 0;
      const centerY = 0;

      const centralNode: Node = {
        id: 'central',
        type: 'central',
        position: { x: centerX - 140, y: centerY - 80 },
        data: { label: data.label, appId: data.id },
        draggable: true,
      };

      const childNodes: Node[] = (data.children || []).map((child: ChildNode, index: number) => {
        const angle = index * angleStep - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius - 90;
        const y = centerY + Math.sin(angle) * radius - 90;
        const color = colors[index % colors.length];
        const childId = String(child.id);
        return {
          id: childId,
          type: 'child',
          position: { x, y },
          data: {
            label: child.label,
            id: childId,
            color,
            onClick: () => {
              router.push(paths.dashboard.architecture.strategicObjectivesTableMapExpand(objectiveId, childId));
            },
          },
          draggable: true,
        };
      });

      const newEdges: Edge[] = (data.children || []).map((child: ChildNode, index: number) => {
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
    [colors, objectiveId, router, setEdges, setNodes]
  );

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        setLoading(true);
        const response = await GetObjectivesMapByIdService(objectiveId);
        const data = response.data as MapData;
        setMapData(data);
        generateNodesAndEdges(data);
      } catch {
        toast.error('Error al cargar el mapa de objetivos estratégicos');
        setMapData(null);
      } finally {
        setLoading(false);
      }
    };

    if (objectiveId) fetchMapData();
  }, [generateNodesAndEdges, objectiveId]);

  if (loading) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 600 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="body2" color="text.secondary">
            Cargando mapa...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (!mapData) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 600 }}>
        <Typography variant="body1" color="text.secondary">
          No fue posible cargar el mapa.
        </Typography>
      </Box>
    );
  }

  if (!mapData.children || mapData.children.length === 0) {
    return (
      <Card sx={{ width: '100%', position: 'relative', overflow: 'hidden', bgcolor: 'background.neutral', ...sx }}>
        <Box sx={{ width: '100%', height: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
              <Iconify icon="solar:inbox-in-bold" width={60} sx={{ color: alpha(theme.palette.primary.main, 0.5) }} />
            </Box>
            <Stack spacing={1} alignItems="center">
              <Typography variant="h6" color="text.primary">
                {mapData.label}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No hay relaciones para mostrar.
              </Typography>
            </Stack>
          </Stack>
        </Box>
      </Card>
    );
  }

  return (
    <Card sx={{ width: '100%', position: 'relative', overflow: 'hidden', bgcolor: 'background.neutral', ...sx }}>
      <Box sx={{ width: '100%', height: 850, position: 'relative' }}>
        <Box sx={{ position: 'absolute', top: { xs: 12, sm: 16 }, left: { xs: 12, sm: 16 }, zIndex: 100, pointerEvents: 'none' }}>
          <Paper
            elevation={2}
            sx={{
              px: { xs: 1.5, sm: 2 },
              py: { xs: 1, sm: 1.25 },
              borderRadius: 1.5,
              bgcolor: alpha(theme.palette.background.paper, 0.9),
              backdropFilter: 'blur(8px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                sx={{
                  width: { xs: 6, sm: 8 },
                  height: { xs: 6, sm: 8 },
                  borderRadius: '50%',
                  bgcolor: theme.palette.success.main,
                  animation: 'blink 2s ease-in-out infinite',
                  '@keyframes blink': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.3 } },
                }}
              />
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
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3, maxZoom: 1, duration: 800 }}
          minZoom={0.2}
          maxZoom={2}
          panOnScroll={false}
          panOnDrag
          selectionOnDrag={false}
          zoomOnScroll
          zoomOnPinch
          zoomOnDoubleClick
          preventScrolling
          defaultEdgeOptions={{ type: 'straight', animated: true }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color={alpha(theme.palette.primary.main, 0.08)} gap={24} size={2} variant={BackgroundVariant.Dots} />
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={(n) => {
              if (n.type === 'central') return theme.palette.primary.main;
              return alpha(theme.palette.primary.main, 0.7);
            }}
            maskColor={alpha(theme.palette.background.paper, 0.8)}
            style={{ backgroundColor: alpha(theme.palette.background.paper, 0.9) }}
          />
        </ReactFlow>
      </Box>
    </Card>
  );
}
