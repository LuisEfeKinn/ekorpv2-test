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
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { GetToolsTableMapByIdExpandService } from 'src/services/architecture/tools/toolsMap.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { toolsMapNodeTypes } from './tools-table-map-nodes';
import { ToolsRelationsDrawer } from './tools-relations-drawer';
import { ToolsLessonsProposalsDrawer } from './tools-lessons-proposals-drawer';

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
  toolId: string;
  nodeId: string;
  sx?: SxProps<Theme>;
};

export function ToolsTableMapExpandedDiagram({ toolId, nodeId, sx }: Props) {
  const { t } = useTranslate('architecture');
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  
  const [lessonProposalOpen, setLessonProposalOpen] = useState(false);
  const [isLessonLearned, setIsLessonLearned] = useState(true);
  
  const [relationOpen, setRelationOpen] = useState(false);
  const [relationKind, setRelationKind] = useState<'document' | 'indicator'>('document');

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
              router.push(paths.dashboard.architecture.toolsTableMapExpand(String(toolId), childId));
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
    [colors, router, setEdges, setNodes, toolId]
  );

  useEffect(() => {
    const fetchExpanded = async () => {
      try {
        setLoading(true);

        // Fetch parent/root context for navigation logic if needed
        // (Similar to OrganizationalStructure logic where we might need to know the parent)
        // For now, we keep the existing logic of trying to find the node in the full tree to set parent info?
        // But the user explicitly asked to use the expand route "like in the rest".
        // In other modules we simplified navigation or fetched root to find path.
        // Let's keep the path finding logic but use the new service for the actual map data.
        
        const response = await GetToolsTableMapByIdExpandService(toolId, nodeId);
        const data = response.data as MapData;
        
        // Ensure children is an array
        if (!Array.isArray((data as any).children)) (data as any).children = [];

        setMapData(data);
        generateNodesAndEdges(data);
      } catch (error) {
        console.error('Error al cargar vista expandida de herramienta:', error);
        toast.error(t('tools.map.diagram.messages.error.loadMapError'));
        // Fallback or empty state
        const fallback: MapData = { id: nodeId, label: t('tools.map.diagram.nodeNotAvailable'), children: [] };
        setMapData(fallback);
        generateNodesAndEdges(fallback);
      } finally {
        setLoading(false);
      }
    };

    if (toolId && nodeId) fetchExpanded();
  }, [generateNodesAndEdges, nodeId, t, toolId, reloadKey]);

  const labelLower = String(mapData?.label ?? '').toLowerCase();
  const isLessonsLearnedNode = nodeId === 'lec' || labelLower.includes('lecciones') || labelLower.includes('lessons');
  const isProposalsNode = nodeId === 'prp' || labelLower.includes('propuestas') || labelLower.includes('mejora') || labelLower.includes('proposals');
  const isDocumentNode = nodeId.includes('doc') || labelLower.includes('document') || labelLower.includes('documento');
  const isIndicatorNode = nodeId.includes('ind') || labelLower.includes('indic') || labelLower.includes('indicador');

  const showRelate = isLessonsLearnedNode || isProposalsNode || isDocumentNode || isIndicatorNode;
  const relateLabel = isLessonsLearnedNode
    ? 'Agregar Lección Aprendida'
    : isProposalsNode
      ? 'Agregar Propuesta de Mejora'
      : isDocumentNode
        ? 'Relacionar Documento'
        : isIndicatorNode
          ? 'Relacionar Indicador'
          : 'Relacionar';

  if (loading) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 600 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="body2" color="text.secondary">
            {t('tools.map.diagram.loadingExpand')}
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (!mapData) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 600 }}>
        <Typography variant="body1" color="text.secondary">
          {t('tools.map.diagram.noData')}
        </Typography>
      </Box>
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
              <Typography
                variant="caption"
                sx={{ fontWeight: 600, color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
              >
                {(mapData.children || []).length} {t('tools.map.diagram.conections')}
              </Typography>
            </Stack>
          </Paper>
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
                  return;
                }

                if (isDocumentNode || isIndicatorNode) {
                  setRelationKind(isDocumentNode ? 'document' : 'indicator');
                  setRelationOpen(true);
                }
              }}
              sx={{ borderRadius: 2, boxShadow: 4 }}
            >
              {relateLabel}
            </Button>
          </Box>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={toolsMapNodeTypes}
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
          <Background variant={BackgroundVariant.Dots} gap={24} size={1.2} color={alpha(theme.palette.text.secondary, 0.2)} />
          <Controls showZoom showFitView showInteractive />
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

      <ToolsLessonsProposalsDrawer
        open={lessonProposalOpen}
        onClose={() => setLessonProposalOpen(false)}
        onSuccess={() => setReloadKey((k) => k + 1)}
        toolId={toolId}
        isLessonLearned={isLessonLearned}
      />
      <ToolsRelationsDrawer
        open={relationOpen}
        onClose={() => setRelationOpen(false)}
        onSuccess={() => setReloadKey((k) => k + 1)}
        toolId={toolId}
        kind={relationKind}
      />
    </Card>
  );
}
