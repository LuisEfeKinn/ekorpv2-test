'use client';

import '@xyflow/react/dist/style.css';

import type { Edge, Node } from '@xyflow/react';
import type { Theme, SxProps } from '@mui/material/styles';

import { useMemo, useState, useEffect, useCallback } from 'react';
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
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';

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
  nodeId: string;
  sx?: SxProps<Theme>;
};

function findPath(root: OrganizationalUnitMapNode, targetId: string): OrganizationalUnitMapNode[] | null {
  if (String(root.id) === String(targetId)) return [root];
  const children = root.children || [];
  for (const child of children) {
    const found = findPath(child, targetId);
    if (found) return [root, ...found];
  }
  return null;
}

export function OrganizationalStructureExpandedDiagram({ organizationalUnitId, nodeId, sx }: Props) {
  const theme = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [rootMap, setRootMap] = useState<OrganizationalUnitMapNode | null>(null);
  const [currentNode, setCurrentNode] = useState<OrganizationalUnitMapNode | null>(null);
  const [parentLabel, setParentLabel] = useState('');
  const [parentNodeId, setParentNodeId] = useState<string | null>(null);

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
            onClick: () => {
              router.push(
                paths.dashboard.architecture.organizationalStructureTableMapExpand(
                  String(organizationalUnitId),
                  String(child.id)
                )
              );
            },
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
        if (!active) return;

        const root = response.data;
        setRootMap(root);

        const path = findPath(root, nodeId);
        const parent = path && path.length > 1 ? path[path.length - 2] : null;
        const current = path ? path[path.length - 1] : null;

        setCurrentNode(current);
        setParentLabel(parent?.label ?? root.label);
        setParentNodeId(parent ? String(parent.id) : null);

        if (current) buildGraph(current);
      } catch {
        if (active) {
          toast.error('No se pudo cargar el mapa de estructura organizacional');
          setRootMap(null);
          setCurrentNode(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    if (organizationalUnitId && nodeId) run();
    return () => {
      active = false;
    };
  }, [buildGraph, nodeId, organizationalUnitId]);

  if (loading) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 600 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="body2" color="text.secondary">Cargando mapa…</Typography>
        </Stack>
      </Box>
    );
  }

  if (!rootMap || !currentNode) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 600 }}>
        <Typography variant="body1" color="text.secondary">No hay datos para mostrar</Typography>
      </Box>
    );
  }

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
                    router.push(paths.dashboard.architecture.organizationalStructureTableMap(String(organizationalUnitId)));
                    return;
                  }
                  router.push(
                    paths.dashboard.architecture.organizationalStructureTableMapExpand(
                      String(organizationalUnitId),
                      String(parentNodeId)
                    )
                  );
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

      <Box sx={{ width: '100%', height: 850, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={organizationalStructureNodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
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
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable maskColor={alpha(theme.palette.background.paper, 0.8)} />
          <Background color={alpha(theme.palette.primary.main, 0.08)} gap={24} size={2} variant={BackgroundVariant.Dots} />
        </ReactFlow>
      </Box>
    </Card>
  );
}
