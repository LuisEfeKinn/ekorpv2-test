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
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { GetObjectivesMapByIdService, GetObjectivesMapByIdExpandService } from 'src/services/architecture/business/objectives.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { ObjectiveRelationsDrawer } from './objective-relations-drawer';

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
  nodeId: string;
  sx?: SxProps<Theme>;
};

function findPath(root: MapData, targetId: string): MapData[] | null {
  if (String(root.id) === String(targetId)) return [root];
  const children = root.children || [];
  for (const child of children) {
    const found = findPath(child as any, targetId);
    if (found) return [root, ...found];
  }
  return null;
}

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
          label={`Nodo: ${String(data.appId)}`}
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
          Vista expandida
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

export function StrategicObjectivesMapExpandedDiagram({ objectiveId, nodeId, sx }: Props) {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [parentLabel, setParentLabel] = useState('');
  const [parentNodeId, setParentNodeId] = useState<string | null>(null);
  const [relationOpen, setRelationOpen] = useState(false);
  const [relationKind, setRelationKind] = useState<'process' | 'job' | 'document' | 'indicator'>('process');
  const [reloadKey, setReloadKey] = useState(0);

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
        data: { label: data.label, appId: nodeId },
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
    [colors, nodeId, objectiveId, router, setEdges, setNodes]
  );

  useEffect(() => {
    const fetchExpanded = async () => {
      try {
        setLoading(true);
        try {
          const resRoot = await GetObjectivesMapByIdService(objectiveId);
          const root = resRoot.data as MapData;
          const path = root && typeof root === 'object' ? findPath(root, nodeId) : null;
          const parent = path && path.length > 1 ? path[path.length - 2] : null;
          setParentLabel(parent?.label ?? root?.label ?? '');
          setParentNodeId(parent ? String(parent.id) : null);
        } catch {
          setParentLabel('');
          setParentNodeId(null);
        }
        const response = await GetObjectivesMapByIdExpandService(objectiveId, nodeId);
        const data = response.data as MapData;
        if (!Array.isArray((data as any).children)) (data as any).children = [];
        setMapData(data);
        generateNodesAndEdges(data);
      } catch {
        toast.error('Vista expandida aún no disponible');
        const fallback: MapData = { id: nodeId, label: `Nodo ${nodeId}`, children: [] };
        setMapData(fallback);
        generateNodesAndEdges(fallback);
      } finally {
        setLoading(false);
      }
    };

    if (objectiveId && nodeId) fetchExpanded();
  }, [generateNodesAndEdges, nodeId, objectiveId, reloadKey]);

  if (loading) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 600 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="body2" color="text.secondary">
            Cargando vista expandida...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (!mapData) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 600 }}>
        <Typography variant="body1" color="text.secondary">
          No hay datos para mostrar.
        </Typography>
      </Box>
    );
  }

  const labelLower = String(mapData?.label ?? '').toLowerCase();
  const nodeLower = String(nodeId ?? '').toLowerCase();
  const isProcessNode = nodeLower.includes('process') || labelLower.includes('proce');
  const isJobNode =
    nodeLower.includes('job') ||
    labelLower.includes('cargo') ||
    labelLower.includes('actor') ||
    labelLower.includes('actores') ||
    labelLower.includes('job') ||
    labelLower.includes('jobs');
  const isDocumentNode = nodeLower.includes('doc') || labelLower.includes('document') || labelLower.includes('documento');
  const isIndicatorNode = nodeLower.includes('indicator') || labelLower.includes('indic') || labelLower.includes('indicador');

  const showRelate = isProcessNode || isJobNode || isDocumentNode || isIndicatorNode;

  const relateLabel = isProcessNode
    ? 'Relacionar Proceso'
    : isJobNode
      ? 'Relacionar Actor'
      : isDocumentNode
        ? 'Relacionar Documento'
        : isIndicatorNode
          ? 'Relacionar Indicador'
          : 'Relacionar';

  return (
    <Card sx={{ width: '100%', position: 'relative', overflow: 'hidden', bgcolor: 'background.neutral', ...sx }}>
      <Box sx={{ position: 'absolute', top: { xs: 12, sm: 16 }, left: { xs: 12, sm: 16 }, zIndex: 100 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Paper elevation={4} sx={{ px: 2, py: 1, borderRadius: 2, bgcolor: alpha(theme.palette.background.paper, 0.95), backdropFilter: 'blur(10px)', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <Tooltip title="Volver">
              <IconButton
                size="small"
                onClick={() => {
                  if (!parentNodeId) {
                    router.push(paths.dashboard.architecture.strategicObjectivesTableMap(String(objectiveId)));
                    return;
                  }
                  router.push(paths.dashboard.architecture.strategicObjectivesTableMapExpand(String(objectiveId), String(parentNodeId)));
                }}
                sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.16) } }}
              >
                <Iconify icon="eva:arrow-ios-back-fill" width={18} />
              </IconButton>
            </Tooltip>
          </Paper>
          {parentLabel && (
            <Paper elevation={2} sx={{ px: 2, py: 1, borderRadius: 2, bgcolor: alpha(theme.palette.background.paper, 0.92), backdropFilter: 'blur(8px)', border: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>{parentLabel}</Typography>
            </Paper>
          )}
        </Stack>
      </Box>

      {showRelate && (
        <Box sx={{ position: 'absolute', top: { xs: 12, sm: 16 }, right: { xs: 12, sm: 16 }, zIndex: 100 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => {
              const kind = isProcessNode
                ? 'process'
                : isJobNode
                  ? 'job'
                  : isDocumentNode
                    ? 'document'
                    : 'indicator';
              setRelationKind(kind);
              setRelationOpen(true);
            }}
            sx={{ borderRadius: 2, boxShadow: 4 }}
          >
            {relateLabel}
          </Button>
        </Box>
      )}

      <Box sx={{ width: '100%', height: 850, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3, maxZoom: 1, duration: 800 }}
          minZoom={0.3}
          maxZoom={1.2}
          panOnScroll={false}
          panOnDrag={[1, 2]}
          selectionOnDrag={false}
          panActivationKeyCode="Space"
          zoomOnScroll
          zoomOnPinch
          zoomOnDoubleClick={false}
          preventScrolling={false}
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

      <ObjectiveRelationsDrawer
        open={relationOpen}
        onClose={() => setRelationOpen(false)}
        onSuccess={() => setReloadKey((k) => k + 1)}
        objectiveId={Number(objectiveId)}
        kind={relationKind}
      />
    </Card>
  );
}
