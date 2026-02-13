'use client';

import '@xyflow/react/dist/style.css';

import {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  addEdge,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  Background,
  useReactFlow,
  useEdgesState,
  useNodesState,
  type NodeTypes,
  type Connection,
  ReactFlowProvider,
} from '@xyflow/react';

import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import { alpha, useTheme, useColorScheme } from '@mui/material/styles';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

import { NodeDetailOverlay } from './NodeDetailOverlay';


// ----------------------------------------------------------------------

interface DiagramBaseProps {
  nodes: Node[];
  edges: Edge[];
  nodeTypes: NodeTypes;
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
  onConnect?: (connection: Connection) => void;
  fitView?: boolean;
  interactive?: boolean;
  showMiniMap?: boolean;
  showControls?: boolean;
  showBackground?: boolean;
  minZoom?: number;
  maxZoom?: number;
  defaultViewport?: { x: number; y: number; zoom: number };
  className?: string;
  style?: React.CSSProperties;
  showExpandCollapseControls?: boolean;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  onRestart?: () => void;
}

function DiagramFlow({
  nodes: initialNodes,
  edges: initialEdges,
  nodeTypes,
  onNodesChange: onExternalNodesChange,
  onEdgesChange: onExternalEdgesChange,
  onConnect: onExternalConnect,
  fitView = true,
  interactive = true,
  showMiniMap = true,
  showControls = true,
  showBackground = true,
  minZoom = 0.1,
  maxZoom = 2,
  defaultViewport = { x: 0, y: 0, zoom: 0.6 },
  className,
  style,
  showExpandCollapseControls,
  onExpandAll,
  onCollapseAll,
  onRestart,
}: DiagramBaseProps) {
  const { t } = useTranslate('common');
  const theme = useTheme();
  const { colorScheme } = useColorScheme();
  const { fitView: reactFlowFitView, zoomIn, zoomOut } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isInteractive, setIsInteractive] = useState(interactive);
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [overlayPosition, setOverlayPosition] = useState({ x: 0, y: 0 });

  // Get current state of the selected node
  const selectedNode = useMemo(() =>
    nodes.find(n => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]);

  // Actualización optimizada de nodos y edges
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Aplicar fitView optimizado
  useEffect(() => {
    if (fitView && initialNodes.length > 0) {
      const timer = setTimeout(() => {
        reactFlowFitView({ duration: 150, padding: 0.05 });
      }, 50);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [fitView, reactFlowFitView, initialNodes.length]);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = addEdge(params, edges);
      setEdges(newEdge);
      onExternalConnect?.(params);
    },
    [edges, setEdges, onExternalConnect]
  );

  // Sincronizar cambios externos
  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChange(changes);
      onExternalNodesChange?.(nodes);
    },
    [onNodesChange, onExternalNodesChange, nodes]
  );

  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChange(changes);
      onExternalEdgesChange?.(edges);
    },
    [onEdgesChange, onExternalEdgesChange, edges]
  );

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    event.stopPropagation(); // Prevent onPaneClick

    // Calculate position relative to container
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      setOverlayPosition({ x, y });
    }

    setSelectedNodeId(node.id);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleCloseOverlay = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden', // Ensure overlay stays inside
        '& .react-flow': {
          bgcolor: colorScheme === 'dark' ? theme.palette.grey[700] : theme.palette.grey[200],
          borderRadius: 2,
        },
        // Desactivar animaciones para respuesta inmediata
        '& .react-flow__node': {
          transition: 'none !important',
          willChange: 'auto',
          '&[data-hidden="true"]': {
            display: 'none !important', // Forzar ocultado inmediato
          },
        },
        '& .react-flow__edge': {
          transition: 'none !important',
          willChange: 'auto',
        },
        '& .react-flow__background': {
          backgroundColor: colorScheme === 'dark' ? theme.palette.grey[700] : theme.palette.grey[200],
        },
        '& .react-flow__controls': {
          button: {
            backgroundColor: theme.palette.background.paper,
            borderColor: theme.palette.divider,
            color: theme.palette.text.primary,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          },
        },
        '& .react-flow__minimap': {
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
        },
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView={fitView}
        fitViewOptions={{ padding: 0.2 }}
        minZoom={minZoom}
        maxZoom={maxZoom}
        defaultViewport={defaultViewport}
        nodesDraggable={isInteractive}
        nodesConnectable={false}
        elementsSelectable
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        panOnScroll
        selectionOnDrag={false}
        panOnDrag
        zoomOnScroll={false}
        zoomActivationKeyCode="Control"
        // Optimizaciones de performance críticas
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Ctrl"
        snapToGrid={false}
        snapGrid={[15, 15]}
        attributionPosition="bottom-left"
        // Desactivar animaciones para respuesta inmediata
        connectionLineStyle={{ transition: 'none' }}
        proOptions={{
          hideAttribution: true
        }}
        zoomOnPinch
        zoomOnDoubleClick
        preventScrolling={false}
        className={className}
        style={style}
      >
        {showBackground && (
          <Background
            gap={20}
            size={1}
            color={theme.palette.action.disabled}
          />
        )}

        {showControls && (
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              zIndex: 5,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {/* 1. Zoom In */}
            <Tooltip title={t('diagrams.actions.zoomIn') || 'Zoom In'} placement="right">
              <IconButton
                onClick={() => zoomIn()}
                sx={{
                  width: 36,
                  height: 36,
                  color: theme.palette.text.primary,
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
                }}
              >
                <Iconify icon="material-symbols-light:zoom-in" width={20} />
              </IconButton>
            </Tooltip>

            {/* 2. Zoom Out */}
            <Tooltip title={t('diagrams.actions.zoomOut') || 'Zoom Out'} placement="right">
              <IconButton
                onClick={() => zoomOut()}
                sx={{
                  width: 36,
                  height: 36,
                  color: theme.palette.text.primary,
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
                }}
              >
                <Iconify icon="material-symbols-light:zoom-out" width={20} />
              </IconButton>
            </Tooltip>

            {/* 3. Fit View */}
            <Tooltip title={t('diagrams.actions.fitView') || 'Fit View'} placement="right">
              <IconButton
                onClick={() => reactFlowFitView({ padding: 0.2, duration: 400 })}
                sx={{
                  width: 36,
                  height: 36,
                  color: theme.palette.text.primary,
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
                }}
              >
                <Iconify icon="iconoir:expand" width={20} />
              </IconButton>
            </Tooltip>

            {/* 4. Lock/Unlock Layout */}
            <Tooltip title={isInteractive ? (t('diagrams.actions.lock') || 'Lock Diagram') : (t('diagrams.actions.unlock') || 'Unlock Diagram')} placement="right">
              <IconButton
                onClick={() => setIsInteractive(!isInteractive)}
                sx={{
                  width: 36,
                  height: 36,
                  color: theme.palette.text.primary,
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
                }}
              >
                <Iconify icon={isInteractive ? "tabler:lock-open" : "tabler:lock"} width={20} />
              </IconButton>
            </Tooltip>

            {/* 5. Expand All */}
            {showExpandCollapseControls && onExpandAll && (
              <Tooltip title={t('diagrams.actions.expandAll') || 'Expand All'} placement="right">
                <IconButton
                  onClick={onExpandAll}
                  sx={{
                    width: 36,
                    height: 36,
                    color: theme.palette.text.primary,
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
                  }}
                >
                  <Iconify icon="eva:expand-fill" width={20} />
                </IconButton>
              </Tooltip>
            )}

            {/* 6. Collapse All */}
            {showExpandCollapseControls && onCollapseAll && (
              <Tooltip title={t('diagrams.actions.collapseAll') || 'Collapse All'} placement="right">
                <IconButton
                  onClick={onCollapseAll}
                  sx={{
                    width: 36,
                    height: 36,
                    color: theme.palette.text.primary,
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
                  }}
                >
                  <Iconify icon="eva:collapse-fill" width={20} />
                </IconButton>
              </Tooltip>
            )}


            {/* 7. Restart Diagram */}
            {onRestart && (
              <Tooltip title={t('diagrams.actions.restart') || 'Restart'} placement="right">
                <IconButton
                  onClick={onRestart}
                  sx={{
                    width: 36,
                    height: 36,
                    color: theme.palette.text.primary,
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
                  }}
                >
                  <Iconify icon="solar:restart-bold" width={20} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}

        {showMiniMap && (
          <MiniMap
            position="bottom-right"
            pannable
            zoomable
            nodeColor={(node: Node) => {
              // Color basado en el tipo de nodo
              if (node.type === 'employee') return theme.palette.primary.main;
              if (node.type === 'architecture') return theme.palette.info.main;
              return theme.palette.grey[400];
            }}
          />
        )}
      </ReactFlow>

      <NodeDetailOverlay
        node={selectedNode}
        open={!!selectedNode}
        onClose={handleCloseOverlay}
        position={overlayPosition}
      />
    </Box>
  );
}

export function DiagramBase(props: DiagramBaseProps) {
  return (
    <ReactFlowProvider>
      <DiagramFlow {...props} />
    </ReactFlowProvider>
  );
}

export type { DiagramBaseProps };