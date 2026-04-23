'use client';

import '@xyflow/react/dist/style.css';

import type { Theme, SxProps } from '@mui/material/styles';
import type { Edge, Node, NodeProps, NodeTypes } from '@xyflow/react';

import { useMemo, useEffect, useCallback } from 'react';
import {
  Handle,
  MiniMap,
  Controls,
  Position,
  ReactFlow,
  Background,
  useEdgesState,
  useNodesState,
  BackgroundVariant,
} from '@xyflow/react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

export type LocalizedText = {
  es: string;
  en: string;
};

export type ExpandibleMapNode<TPayload = unknown> = {
  id: string | number;
  label: string;
  payload?: TPayload;
};

export type ExpandibleMapSection<TPayload = unknown> = ExpandibleMapNode<TPayload> & {
  color?: string;
};

type Labels = {
  backToTable: LocalizedText;
  backToMap: LocalizedText;
  openForm: LocalizedText;
  zoomHint: LocalizedText;
  moveHint: LocalizedText;
  zoomShort: LocalizedText;
  moveShort: LocalizedText;
  connected: LocalizedText;
};

const DEFAULT_LABELS: Labels = {
  backToTable: { es: 'Volver a la tabla', en: 'Back to table' },
  backToMap: { es: 'Volver al mapa', en: 'Back to map' },
  openForm: { es: 'Abrir formulario', en: 'Open form' },
  zoomHint: { es: 'Zoom: rueda del mouse', en: 'Zoom: mouse wheel' },
  moveHint: { es: 'Mover: click sostenido y arrastrar', en: 'Move: click and drag' },
  zoomShort: { es: 'Zoom', en: 'Zoom' },
  moveShort: { es: 'Mover', en: 'Move' },
  connected: { es: 'Conectados', en: 'Connected' },
};

function resolveText(text: LocalizedText, lang: 'es' | 'en') {
  return lang === 'es' ? text.es : text.en;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCentralNodeData(data: unknown): data is CentralNodeData {
  if (!isRecord(data)) return false;
  if (typeof data.label !== 'string') return false;
  if (!('subtitle' in data)) return true;
  return typeof data.subtitle === 'string' || typeof data.subtitle === 'undefined';
}

function isInitialChildNodeData(data: unknown): data is InitialChildNodeData {
  if (!isRecord(data)) return false;
  return (
    typeof data.id === 'string' &&
    typeof data.label === 'string' &&
    typeof data.color === 'string' &&
    typeof data.onClick === 'function'
  );
}

function isExpandedChildNodeData(data: unknown): data is ExpandedChildNodeData {
  if (!isRecord(data)) return false;
  return (
    typeof data.id === 'string' &&
    typeof data.label === 'string' &&
    typeof data.color === 'string' &&
    typeof data.onClick === 'function' &&
    typeof data.onEdit === 'function' &&
    typeof data.onDelete === 'function'
  );
}

type CentralNodeData = {
  label: string;
  subtitle?: string;
};

type InitialChildNodeData = {
  id: string;
  label: string;
  color: string;
  onClick: () => void;
};

type ExpandedChildNodeData = {
  id: string;
  label: string;
  color: string;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function CentralNode({ data }: NodeProps) {
  const theme = useTheme();
  const nodeData: CentralNodeData = isCentralNodeData(data) ? data : { label: '' };

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
          label={String(nodeData.label || '')}
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
            maxWidth: 420,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
          }}
        >
          {String(nodeData.label || '')}
        </Typography>
        {nodeData.subtitle ? (
          <Typography
            variant="caption"
            sx={{ color: alpha(theme.palette.common.white, 0.85), fontWeight: 600, fontSize: '0.7rem' }}
          >
            {nodeData.subtitle}
          </Typography>
        ) : null}
      </Stack>
    </Paper>
  );
}

function InitialChildNode({ data }: NodeProps) {
  const theme = useTheme();
  const nodeData: InitialChildNodeData = isInitialChildNodeData(data)
    ? data
    : { id: '', label: '', color: theme.palette.primary.main, onClick: () => {} };
  const { color, label, id, onClick } = nodeData;

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
            maxWidth: 220,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
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

function ExpandedChildNode({ data }: NodeProps) {
  const theme = useTheme();
  const nodeData: ExpandedChildNodeData = isExpandedChildNodeData(data)
    ? data
    : {
        id: '',
        label: '',
        color: theme.palette.primary.main,
        onClick: () => {},
        onEdit: () => {},
        onDelete: () => {},
      };
  const { color, label, id, onClick, onEdit, onDelete } = nodeData;

  return (
    <Paper
      elevation={6}
      onClick={onClick}
      sx={{
        px: { xs: 2, sm: 2.5 },
        py: { xs: 2.5, sm: 3 },
        borderRadius: 2.5,
        background: theme.palette.background.paper,
        border: `2px solid ${alpha(color, 0.3)}`,
        boxShadow: `0 4px 20px ${alpha(color, 0.2)}`,
        cursor: 'pointer',
        minWidth: 220,
        maxWidth: 260,
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

      <Box sx={{ position: 'absolute', top: 6, left: 6, zIndex: 9 }}>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          aria-label="edit"
          sx={{
            color: 'text.secondary',
            bgcolor: alpha(theme.palette.background.paper, 0.8),
            '&:hover': { bgcolor: alpha(theme.palette.background.paper, 1) },
          }}
        >
          <Iconify icon="solar:pen-bold" width={16} />
        </IconButton>
      </Box>

      <Box sx={{ position: 'absolute', top: 6, right: 6, zIndex: 9 }}>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="delete"
          sx={{
            color: 'error.main',
            bgcolor: alpha(theme.palette.background.paper, 0.8),
            '&:hover': { bgcolor: alpha(theme.palette.background.paper, 1) },
          }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" width={16} />
        </IconButton>
      </Box>

      <Stack spacing={1.5} alignItems="center" sx={{ pt: 1.5 }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            textAlign: 'center',
            color: 'text.primary',
            fontSize: { xs: '0.85rem', sm: '0.9rem' },
            letterSpacing: '-0.2px',
            lineHeight: 1.2,
            maxWidth: '100%',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
          }}
        >
          {String(label || '')}
        </Typography>
        <Chip
          label={String(id || '')}
          size="small"
          sx={{
            maxWidth: '100%',
            bgcolor: alpha(color, 0.1),
            color,
            fontWeight: 600,
            fontSize: '0.72rem',
            height: 22,
            border: `1px solid ${alpha(color, 0.2)}`,
            '& .MuiChip-label': {
              display: 'block',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
          }}
        />
      </Stack>
    </Paper>
  );
}

export type NodesExpandibleMapInitialProps<TSectionPayload = unknown> = {
  center: ExpandibleMapNode;
  sections: ExpandibleMapSection<TSectionPayload>[];
  onSectionClick: (section: ExpandibleMapSection<TSectionPayload>) => void;
  centerSubtitle?: string;
  height?: number;
  sx?: SxProps<Theme>;
  showHints?: boolean;
  uiVariant?: 'plain' | 'card';
  connectedCount?: number;
  labels?: Partial<Labels>;
};

export function NodesExpandibleMapInitial<TSectionPayload = unknown>({
  center,
  sections,
  onSectionClick,
  centerSubtitle,
  height = 850,
  sx,
  showHints = true,
  uiVariant = 'plain',
  connectedCount,
  labels,
}: NodesExpandibleMapInitialProps<TSectionPayload>) {
  const theme = useTheme();
  const { currentLang } = useTranslate();
  const lang = currentLang.value === 'en' ? 'en' : 'es';
  const mergedLabels: Labels = useMemo(
    () => ({
      backToTable: labels?.backToTable ?? DEFAULT_LABELS.backToTable,
      backToMap: labels?.backToMap ?? DEFAULT_LABELS.backToMap,
      openForm: labels?.openForm ?? DEFAULT_LABELS.openForm,
      zoomHint: labels?.zoomHint ?? DEFAULT_LABELS.zoomHint,
      moveHint: labels?.moveHint ?? DEFAULT_LABELS.moveHint,
      zoomShort: labels?.zoomShort ?? DEFAULT_LABELS.zoomShort,
      moveShort: labels?.moveShort ?? DEFAULT_LABELS.moveShort,
      connected: labels?.connected ?? DEFAULT_LABELS.connected,
    }),
    [labels]
  );

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

  const generate = useCallback((): { nodes: Node[]; edges: Edge[] } => {
    const radius = 400;
    const angleStep = (2 * Math.PI) / (sections.length || 1);
    const centerX = 0;
    const centerY = 0;

    const centralNode: Node = {
      id: 'central',
      type: 'central',
      position: { x: centerX - 140, y: centerY - 80 },
      data: { label: center.label, subtitle: centerSubtitle },
      draggable: true,
    };

    const childNodes: Node[] = sections.map((section, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius - 90;
      const y = centerY + Math.sin(angle) * radius - 90;
      const color = section.color ?? colors[index % colors.length];
      const id = String(section.id);

      return {
        id,
        type: 'child',
        position: { x, y },
        data: {
          id,
          label: section.label,
          color,
          onClick: () => onSectionClick(section),
        } satisfies InitialChildNodeData,
        draggable: true,
      };
    });

    const childEdges: Edge[] = sections.map((section) => {
      const id = String(section.id);
      return {
        id: `e-central-${id}`,
        source: 'central',
        target: id,
        animated: true,
        style: { strokeWidth: 2, stroke: alpha(theme.palette.primary.main, 0.7) },
      };
    });

    return { nodes: [centralNode, ...childNodes], edges: childEdges };
  }, [center.label, centerSubtitle, colors, onSectionClick, sections, theme.palette.primary.main]);

  const initialGraph = useMemo(() => generate(), [generate]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialGraph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialGraph.edges);

  const nodeTypes = useMemo<NodeTypes>(() => ({ central: CentralNode, child: InitialChildNode }), []);

  useEffect(() => {
    setNodes(initialGraph.nodes);
    setEdges(initialGraph.edges);
  }, [initialGraph.edges, initialGraph.nodes, setEdges, setNodes]);

  const diagram = (
    <Box sx={{ width: '100%', height, position: 'relative' }}>
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
  );

  return (
    <Box sx={{ width: '100%', position: 'relative', ...sx }}>
      {uiVariant === 'plain' && showHints ? (
        <Box sx={{ position: 'absolute', zIndex: 10, top: 16, left: 16 }}>
          <Paper
            elevation={6}
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.background.paper, 0.88),
              backdropFilter: 'blur(10px)',
              minWidth: 240,
            }}
          >
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Iconify icon="solar:magnifer-zoom-in-bold" width={18} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  {resolveText(mergedLabels.zoomHint, lang)}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Iconify icon="eva:move-fill" width={18} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  {resolveText(mergedLabels.moveHint, lang)}
                </Typography>
              </Stack>
            </Stack>
          </Paper>
        </Box>
      ) : null}
      {uiVariant === 'card' ? (
        <Card sx={{ width: '100%', position: 'relative', overflow: 'hidden', bgcolor: 'background.neutral' }}>
          <Box sx={{ position: 'relative' }}>
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
                    {Number.isFinite(connectedCount) ? connectedCount : sections.length} {resolveText(mergedLabels.connected, lang)}
                  </Typography>
                </Stack>
              </Paper>
            </Box>

            <Box sx={{ position: 'absolute', top: { xs: 12, sm: 16 }, right: { xs: 12, sm: 16 }, zIndex: 100, pointerEvents: 'none' }}>
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
                <Stack spacing={0.75}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        bgcolor: alpha(theme.palette.text.secondary, 0.08),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Iconify icon="solar:magnifer-zoom-in-bold" width={10} sx={{ color: 'text.secondary' }} />
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                      {resolveText(mergedLabels.zoomShort, lang)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        bgcolor: alpha(theme.palette.text.secondary, 0.08),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Iconify icon="eva:move-fill" width={10} sx={{ color: 'text.secondary' }} />
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                      {resolveText(mergedLabels.moveShort, lang)}
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            </Box>
            {diagram}
          </Box>
        </Card>
      ) : (
        diagram
      )}
    </Box>
  );
}

export type NodesExpandibleMapExpandedProps<TItemPayload = unknown> = {
  headerTitle: string;
  center: ExpandibleMapNode;
  centerSubtitle?: string;
  items: ExpandibleMapNode<TItemPayload>[];
  onBackToMap: () => void;
  onBackToTable?: () => void;
  onOpenFormDrawer?: () => void;
  onItemClick?: (item: ExpandibleMapNode<TItemPayload>) => void;
  onItemEdit?: (item: ExpandibleMapNode<TItemPayload>) => void;
  onItemDelete?: (item: ExpandibleMapNode<TItemPayload>) => void;
  height?: number;
  sx?: SxProps<Theme>;
  labels?: Partial<Labels>;
};

export function NodesExpandibleMapExpanded<TItemPayload = unknown>({
  headerTitle,
  center,
  centerSubtitle,
  items,
  onBackToMap,
  onBackToTable,
  onOpenFormDrawer,
  onItemClick,
  onItemEdit,
  onItemDelete,
  height = 850,
  sx,
  labels,
}: NodesExpandibleMapExpandedProps<TItemPayload>) {
  const theme = useTheme();
  const { currentLang } = useTranslate();
  const lang = currentLang.value === 'en' ? 'en' : 'es';
  const mergedLabels: Labels = useMemo(
    () => ({
      backToTable: labels?.backToTable ?? DEFAULT_LABELS.backToTable,
      backToMap: labels?.backToMap ?? DEFAULT_LABELS.backToMap,
      openForm: labels?.openForm ?? DEFAULT_LABELS.openForm,
      zoomHint: labels?.zoomHint ?? DEFAULT_LABELS.zoomHint,
      moveHint: labels?.moveHint ?? DEFAULT_LABELS.moveHint,
      zoomShort: labels?.zoomShort ?? DEFAULT_LABELS.zoomShort,
      moveShort: labels?.moveShort ?? DEFAULT_LABELS.moveShort,
      connected: labels?.connected ?? DEFAULT_LABELS.connected,
    }),
    [labels]
  );

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

  const generate = useCallback((): { nodes: Node[]; edges: Edge[] } => {
    const centerX = 0;
    const centerY = 0;

    const centralNode: Node = {
      id: 'central',
      type: 'central',
      position: { x: centerX - 160, y: centerY - 80 },
      data: { label: center.label, subtitle: centerSubtitle },
      draggable: true,
    };

    const spacingY = 240;
    const startY = -((items.length - 1) * spacingY) / 2;

    const childNodes: Node[] = items.map((item, index) => {
      const y = startY + index * spacingY;
      const x = centerX + 360;
      const color = colors[index % colors.length];
      const id = String(item.id);

      return {
        id,
        type: 'child',
        position: { x, y },
        data: {
          id,
          label: item.label,
          color,
          onClick: () => onItemClick?.(item),
          onEdit: () => onItemEdit?.(item),
          onDelete: () => onItemDelete?.(item),
        } satisfies ExpandedChildNodeData,
        draggable: true,
      };
    });

    const childEdges: Edge[] = items.map((item, index) => {
      const id = String(item.id);
      const color = colors[index % colors.length];
      return {
        id: `e-central-${id}`,
        source: 'central',
        target: id,
        animated: true,
        style: { strokeWidth: 2, stroke: alpha(color, 0.7) },
      };
    });

    return { nodes: [centralNode, ...childNodes], edges: childEdges };
  }, [center.label, centerSubtitle, colors, items, onItemClick, onItemDelete, onItemEdit]);

  const expandedGraph = useMemo(() => generate(), [generate]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(expandedGraph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(expandedGraph.edges);

  const nodeTypes = useMemo<NodeTypes>(() => ({ central: CentralNode, child: ExpandedChildNode }), []);

  useEffect(() => {
    setNodes(expandedGraph.nodes);
    setEdges(expandedGraph.edges);
  }, [expandedGraph.edges, expandedGraph.nodes, setEdges, setNodes]);

  return (
    <Box sx={{ width: '100%', ...sx }}>
      {onBackToTable ? (
        <Box sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
            onClick={onBackToTable}
          >
            {resolveText(mergedLabels.backToTable, lang)}
          </Button>
        </Box>
      ) : null}

      <Box
        sx={{
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
          <Button
            variant="text"
            onClick={onBackToMap}
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
          >
            {resolveText(mergedLabels.backToMap, lang)}
          </Button>
          <Typography variant="h6" sx={{ minWidth: 0 }} noWrap>
            {headerTitle}
          </Typography>
        </Stack>

        {onOpenFormDrawer ? (
          <Button
            variant="contained"
            onClick={onOpenFormDrawer}
            startIcon={<Iconify icon="mingcute:add-line" />}
            aria-label="open-form-drawer"
          >
            {resolveText(mergedLabels.openForm, lang)}
          </Button>
        ) : null}
      </Box>

      <Box sx={{ width: '100%', height, position: 'relative' }}>
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
          panOnDrag={[0, 1]}
          selectionOnDrag={false}
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
    </Box>
  );
}
