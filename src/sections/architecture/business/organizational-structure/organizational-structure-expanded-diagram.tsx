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
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import {
  type OrganizationalUnitMapNode,
  GetOrganizationalUnitMapExpandByIdService,
} from 'src/services/organization/organizationalUnit.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { OrganizationalUnitLessonsProposalsDrawer } from './feedbacks/organizational-unit-lessons-proposals-drawer';
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

export function OrganizationalStructureExpandedDiagram({ organizationalUnitId, nodeId, sx }: Props) {
  const theme = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState<OrganizationalUnitMapNode | null>(null);
  const [parentLabel, setParentLabel] = useState('');
  const [parentNodeId, setParentNodeId] = useState<string | null>(null);

  const [lessonProposalOpen, setLessonProposalOpen] = useState(false);
  const [isLessonLearned, setIsLessonLearned] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

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
        data: { id: String(data.id), label: String(data.label || 'Sin nombre') } satisfies NodeDataCentral,
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
            label: String(child.label || 'Sin nombre'),
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
        const response = await GetOrganizationalUnitMapExpandByIdService(String(organizationalUnitId), nodeId);
        if (!active) return;

        const data = response.data;
        setMapData(data);
        
        // Aquí asumimos que el padre se puede inferir o que no es crítico para este requerimiento inmediato,
        // o que el backend podría devolver info del padre.
        // Por ahora, para simplificar y cumplir con el requerimiento de usar la ruta,
        // usaremos el label del nodo actual si no hay info del padre, o lo dejaremos vacío.
        // Si se necesita el label del padre, habría que ver si el endpoint lo devuelve.
        // Basado en el json del usuario, no viene info del padre en la respuesta directa del nodo.
        // Pero podríamos mantener la lógica de navegación "Atrás" basada en historial o simplemente volver al root.
        
        // NOTA: Para mantener la funcionalidad de "Atrás" correctamente, lo ideal sería que el backend devolviera el parentId.
        // Si no, la navegación "Atrás" podría ser solo al nivel superior (root) si no tenemos el parentId.
        // En el código original se calculaba `parent` usando `findPath` desde el root.
        // Al usar el endpoint directo, perdemos el contexto del árbol completo a menos que lo pidamos.
        // Sin embargo, el usuario pidió explícitamente "usa la ruta sobre la ruta de mapa como en el resto de /expand/{nodeId}".
        
        // Ajuste: Si el nodo es hijo directo del root, el parentId sería el organizationalUnitId (pero ese es el ID de la unidad, no necesariamente el nodo padre en el grafo si es profundo).
        // Por ahora dejaremos parentNodeId como null para que el botón "Atrás" lleve al mapa principal,
        // o implementaremos una lógica simple si el usuario navega en profundidad (que parece ser lo que hace el router).
        
        setParentLabel(''); 
        setParentNodeId(null); 

        buildGraph(data);
      } catch {
        if (active) {
          toast.error('No se pudo cargar el mapa de estructura organizacional');
          setMapData(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    if (organizationalUnitId && nodeId) run();
    return () => {
      active = false;
    };
  }, [buildGraph, nodeId, organizationalUnitId, reloadKey]);

  const labelLower = String(mapData?.label ?? '').toLowerCase();
  const isLessonsLearnedNode = nodeId === 'lec' || labelLower.includes('lecciones') || labelLower.includes('lessons');
  const isProposalsNode = nodeId === 'prp' || labelLower.includes('propuestas') || labelLower.includes('mejora') || labelLower.includes('proposals');

  const showRelate = isLessonsLearnedNode || isProposalsNode;
  const relateLabel = isLessonsLearnedNode
    ? 'Agregar Lección Aprendida'
    : isProposalsNode
      ? 'Agregar Propuesta de Mejora'
      : 'Relacionar';

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

  if (!mapData) {
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

      {showRelate && (
        <Box sx={{ position: 'absolute', top: { xs: 12, sm: 16 }, right: { xs: 12, sm: 16 }, zIndex: 100 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => {
              if (isLessonsLearnedNode || isProposalsNode) {
                setIsLessonLearned(isLessonsLearnedNode);
                setLessonProposalOpen(true);
              }
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

      <OrganizationalUnitLessonsProposalsDrawer
        open={lessonProposalOpen}
        onClose={() => setLessonProposalOpen(false)}
        onSuccess={() => setReloadKey((k) => k + 1)}
        orgUnitId={organizationalUnitId}
        isLessonLearned={isLessonLearned}
      />
    </Card>
  );
}
