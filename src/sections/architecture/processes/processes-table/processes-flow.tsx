'use client';

import '@xyflow/react/dist/style.css';

import type { Node, Edge, NodeTypes } from '@xyflow/react';
import type { Theme, SxProps } from '@mui/material/styles';

import dagre from '@dagrejs/dagre';
import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  MarkerType,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionMode,
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

import { useTranslate } from 'src/locales';
import { GetProcessFlowService } from 'src/services/architecture/process/processTable.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type ProcessFlowNode = {
  id: number;
  label: string;
  data: {
    id: number;
    name: string;
    description: string;
    nomenclature: string;
    code: string | null;
    requiresOLA: boolean;
    periodicity: string;
    workload: number;
    cost: number;
    result: string;
    context: string;
  };
  children: ProcessFlowNode[];
};

type ProcessesFlowProps = {
  sx?: SxProps<Theme>;
};

// ----------------------------------------------------------------------

// Nodo de Proceso Estilo n8n/Make (reutilizando DataNode)
function ProcessNode({ data }: any) {
  const { t } = useTranslate('architecture');
  const theme = useTheme();
  const {
    label,
    description,
    nomenclature,
    requiresOLA,
    onExpand,
    onEdit,
    color,
    isExpanded,
    hasChildren
  } = data;

  return (
    <Paper
      elevation={8}
      sx={{
        px: 2.5,
        py: 2,
        borderRadius: 3,
        background: theme.palette.background.paper,
        border: `2px solid ${alpha(color, 0.4)}`,
        boxShadow: `0 8px 32px ${alpha(color, 0.25)}`,
        cursor: 'grab',
        minWidth: 240,
        maxWidth: 320,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-6px) scale(1.02)',
          boxShadow: `0 16px 48px ${alpha(color, 0.35)}`,
          borderColor: color,
          '& .action-buttons': {
            opacity: 1,
          },
        },
        '&:active': {
          cursor: 'grabbing',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '5px',
          background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.6)})`,
          boxShadow: `0 3px 10px ${alpha(color, 0.4)}`,
        },
      }}
    >
      {/* Handle de entrada (arriba) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: 14,
          height: 14,
          background: color,
          border: `2px solid ${theme.palette.background.paper}`,
          boxShadow: `0 2px 8px ${alpha(color, 0.5)}`,
        }}
      />

      {/* Handle de salida (abajo) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: 14,
          height: 14,
          background: color,
          border: `2px solid ${theme.palette.background.paper}`,
          boxShadow: `0 2px 8px ${alpha(color, 0.5)}`,
        }}
      />

      <Stack spacing={1.5}>
        {/* Header con ícono y botón de expandir */}
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                bgcolor: alpha(color, 0.15),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `2px solid ${alpha(color, 0.25)}`,
                position: 'relative',
              }}
            >
              <Iconify
                icon="solar:settings-bold"
                width={22}
                sx={{ color }}
              />
            </Box>

            {requiresOLA && (
              <Tooltip title={t('process.table.table.columns.requiresOLA')}>
                <Chip
                  size="small"
                  icon={<Iconify icon="solar:shield-check-bold" width={14} />}
                  sx={{
                    height: 22,
                    bgcolor: alpha(theme.palette.success.main, 0.12),
                    color: theme.palette.success.main,
                    '& .MuiChip-icon': { color: theme.palette.success.main },
                  }}
                />
              </Tooltip>
            )}
          </Stack>

          {/* Botón de expandir/contraer integrado */}
          <Tooltip title={isExpanded ? t('data.diagram.tooltips.collapse') : t('data.diagram.tooltips.expand')}>
            <span>
              <IconButton
                size="small"
                onClick={onExpand}
                disabled={!hasChildren}
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: alpha(color, 0.1),
                  color,
                  border: `2px solid ${alpha(color, 0.25)}`,
                  '&:hover': {
                    bgcolor: alpha(color, 0.2),
                    borderColor: color,
                    transform: 'scale(1.05)',
                  },
                  '&:disabled': {
                    opacity: 0.4,
                    bgcolor: alpha(theme.palette.grey[400], 0.1),
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <Iconify
                  icon={(isExpanded ? "eva:chevron-up-fill" : "eva:chevron-down-fill") as any}
                  width={20}
                />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>

        {/* Título */}
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            color: 'text.primary',
            fontSize: '0.95rem',
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {label}
        </Typography>

        {/* Descripción */}
        {description && (
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontSize: '0.75rem',
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {description}
          </Typography>
        )}

        {/* Footer con nomenclatura */}
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          {nomenclature && (
            <Chip
              label={nomenclature}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.7rem',
                bgcolor: alpha(color, 0.1),
                color,
                fontWeight: 600,
              }}
            />
          )}
        </Stack>

        {/* Botones de acción */}
        <Stack
          className="action-buttons"
          direction="row"
          spacing={0.75}
          sx={{
            opacity: 0,
            transition: 'opacity 0.2s',
            mt: 0.5,
          }}
        >
          <Tooltip title={t('process.table.actions.edit')} placement="top">
            <Button
              size="medium"
              variant="outlined"
              onClick={onEdit}
              fullWidth
              sx={{
                height: 36,
                borderColor: alpha(theme.palette.primary.main, 0.3),
                color: theme.palette.primary.main,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.2s',
              }}
              startIcon={<Iconify icon="solar:pen-bold" width={18} />}
            >
              {t('process.table.actions.edit')}
            </Button>
          </Tooltip>
        </Stack>
      </Stack>
    </Paper>
  );
}

const nodeTypes: NodeTypes = {
  processNode: ProcessNode,
};

// Componente de controles personalizados
function CustomControls({
  onReset,
  onResetView,
}: {
  onReset: () => void;
  onResetView: () => void;
}) {
  const { t } = useTranslate('architecture');
  const theme = useTheme();

  const buttonStyle = {
    width: 36,
    height: 36,
    backgroundColor: alpha(theme.palette.background.paper, 0.95),
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: theme.palette.background.paper,
      transform: 'scale(1.05)',
      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
      borderColor: alpha(theme.palette.primary.main, 0.3),
    },
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 270,
        left: 16,
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <Tooltip title={t('data.diagram.tooltips.initialView')} placement="right">
        <IconButton onClick={onResetView} sx={buttonStyle}>
          <Iconify
            icon="solar:eye-scan-bold"
            width={20}
            sx={{ color: theme.palette.text.primary }}
          />
        </IconButton>
      </Tooltip>

      <Tooltip title={t('data.diagram.tooltips.restartDiagram')} placement="right">
        <IconButton onClick={onReset} sx={buttonStyle}>
          <Iconify
            icon="solar:restart-bold"
            width={20}
            sx={{ color: theme.palette.text.primary }}
          />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

// ----------------------------------------------------------------------

export function ProcessesFlow({ sx }: ProcessesFlowProps) {
  const { t } = useTranslate('architecture');
  const theme = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [rootProcesses, setRootProcesses] = useState<ProcessFlowNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [shouldResetView, setShouldResetView] = useState(true);

  // Paleta de colores para los nodos
  const colors = useMemo(
    () => [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.info.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#FFA07A',
      '#98D8C8',
      '#F7DC6F',
    ],
    [theme]
  );

  // Cargar procesos
  const loadProcesses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await GetProcessFlowService();
      if (response?.data) {
        setRootProcesses(response.data);
        
        // Expandir todos los nodos por defecto para ver el flujo completo
        const allNodeIds = new Set<number>();
        const collectIds = (nodesList: ProcessFlowNode[]) => {
          nodesList.forEach(node => {
            allNodeIds.add(node.id);
            if (node.children) {
              collectIds(node.children);
            }
          });
        };
        collectIds(response.data);
        setExpandedNodes(allNodeIds);
      }
    } catch (error) {
      console.error('Error loading processes:', error);
      toast.error(t('process.table.messages.error.loading'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadProcesses();
  }, [loadProcesses]);

  // Handler para expandir/contraer
  const handleExpandNode = useCallback((nodeId: number) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  // Handler para editar
  const handleEditNode = useCallback((nodeId: number) => {
    router.push(paths.dashboard.architecture.processesTableEdit(String(nodeId)));
  }, [router]);

  // Función para aplicar layout con dagre
  const applyDagreLayout = useCallback((nds: Node[], edgs: Edge[]): Node[] => {
    if (nds.length === 0) return nds;

    const graph = new dagre.graphlib.Graph();
    graph.setDefaultEdgeLabel(() => ({}));
    
    graph.setGraph({
      rankdir: 'TB',
      nodesep: 100,
      ranksep: 150,
      marginx: 50,
      marginy: 50,
    });

    nds.forEach((node) => {
      const nodeWidth = 320;
      const nodeHeight = 200; // Aproximado
      graph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edgs.forEach((edge) => {
      graph.setEdge(edge.source, edge.target);
    });

    dagre.layout(graph);

    return nds.map((node) => {
      const nodeWithPosition = graph.node(node.id);
      const nodeWidth = 320;
      const nodeHeight = 200;
      
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2,
        },
      };
    });
  }, []);

  // Generar nodos y conexiones
  const generateNodesAndEdges = useCallback(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    const processNode = (
      node: ProcessFlowNode,
      parentId?: number
    ): void => {
      const color = colors[node.id % colors.length];
      const isExpanded = expandedNodes.has(node.id);
      const hasChildren = node.children && node.children.length > 0;

      newNodes.push({
        id: `node-${node.id}`,
        type: 'processNode',
        position: { x: 0, y: 0 },
        data: {
          label: node.label,
          description: node.data.description,
          nomenclature: node.data.nomenclature,
          requiresOLA: node.data.requiresOLA,
          color,
          isExpanded,
          hasChildren,
          onExpand: () => handleExpandNode(node.id),
          onEdit: () => handleEditNode(node.id),
        },
        draggable: true,
      });

      if (parentId) {
        newEdges.push({
          id: `edge-${parentId}-${node.id}`,
          source: `node-${parentId}`,
          target: `node-${node.id}`,
          type: 'smoothstep',
          animated: true,
          style: {
            stroke: alpha(color, 0.5),
            strokeWidth: 3,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: alpha(color, 0.5),
            width: 20,
            height: 20,
          },
        });
      }

      if (isExpanded && hasChildren) {
        node.children.forEach((child) => {
          processNode(child, node.id);
        });
      }
    };

    rootProcesses.forEach((process) => {
      processNode(process);
    });

    const layoutedNodes = applyDagreLayout(newNodes, newEdges);

    setNodes(layoutedNodes);
    setEdges(newEdges);
  }, [rootProcesses, expandedNodes, colors, handleExpandNode, handleEditNode, applyDagreLayout, setNodes, setEdges]);

  useEffect(() => {
    if (!loading) {
      generateNodesAndEdges();
    }
  }, [loading, generateNodesAndEdges]);

  // Alinear nodos (similar a DataDiagramFlow)
  useEffect(() => {
    if (nodes.length === 0 || !reactFlowInstance || !shouldResetView) return undefined;

    const timer = setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2, duration: 400 });
      setShouldResetView(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [nodes, reactFlowInstance, shouldResetView]);

  const handleReset = useCallback(() => {
    generateNodesAndEdges();
    setShouldResetView(true);
  }, [generateNodesAndEdges]);

  const handleResetView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2, duration: 400 });
    }
  }, [reactFlowInstance]);

  if (loading) {
    return (
      <Card
        sx={{
          width: '100%',
          height: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...sx,
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="body2" color="text.secondary">
            {t('process.table.messages.loading')}
          </Typography>
        </Stack>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'background.neutral',
        ...sx,
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: 800,
          position: 'relative',
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onInit={setReactFlowInstance}
          minZoom={0.1}
          maxZoom={2}
          panOnScroll
          panOnDrag
          zoomOnScroll={false}
          zoomOnPinch
          zoomOnDoubleClick
          connectionMode={ConnectionMode.Loose}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            color={alpha(theme.palette.primary.main, 0.08)}
            gap={20}
            size={1.5}
            variant={BackgroundVariant.Dots}
          />
          
          <Box
            sx={{
              position: 'absolute',
              top: 96,
              left: 16,
              zIndex: 5,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <Tooltip title={t('data.diagram.tooltips.zoomIn')} placement="right">
              <IconButton
                onClick={() => reactFlowInstance?.zoomIn()}
                sx={{
                  width: 36,
                  height: 36,
                  backgroundColor: alpha(theme.palette.background.paper, 0.95),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  borderRadius: '8px',
                  '&:hover': {
                    backgroundColor: theme.palette.background.paper,
                    transform: 'scale(1.05)',
                  },
                }}
              >
                <Iconify icon="material-symbols-light:zoom-in" width={20} />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('data.diagram.tooltips.zoomOut')} placement="right">
              <IconButton
                onClick={() => reactFlowInstance?.zoomOut()}
                sx={{
                  width: 36,
                  height: 36,
                  backgroundColor: alpha(theme.palette.background.paper, 0.95),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  borderRadius: '8px',
                  '&:hover': {
                    backgroundColor: theme.palette.background.paper,
                    transform: 'scale(1.05)',
                  },
                }}
              >
                <Iconify icon="material-symbols-light:zoom-out" width={20} />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('data.diagram.tooltips.fitView')} placement="right">
              <IconButton
                onClick={() => reactFlowInstance?.fitView({ padding: 0.2, duration: 400 })}
                sx={{
                  width: 36,
                  height: 36,
                  backgroundColor: alpha(theme.palette.background.paper, 0.95),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  borderRadius: '8px',
                  '&:hover': {
                    backgroundColor: theme.palette.background.paper,
                    transform: 'scale(1.05)',
                  },
                }}
              >
                <Iconify icon="iconoir:expand" width={20} />
              </IconButton>
            </Tooltip>
          </Box>

          <CustomControls
            onReset={handleReset}
            onResetView={handleResetView}
          />
          
          <MiniMap
            nodeColor={(node) => (node.data as any).color || theme.palette.grey[400]}
            maskColor={alpha(theme.palette.background.paper, 0.85)}
            style={{
              backgroundColor: alpha(theme.palette.background.paper, 0.9),
              borderRadius: '12px',
              border: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
            position="bottom-right"
          />
        </ReactFlow>
      </Box>
    </Card>
  );
}
