'use client';

import '@xyflow/react/dist/style.css';

import type { Node, Edge } from '@xyflow/react';
import type { Theme, SxProps } from '@mui/material/styles';

import { useMemo, useEffect, useCallback } from 'react';
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

import { Iconify } from 'src/components/iconify';

type FeedbackNode = {
  id: string | number;
  label: string;
  description: string;
  isLesson: boolean;
  data?: unknown;
};

type MapData = {
  lessons: FeedbackNode[];
  proposals: FeedbackNode[];
};

type Props = {
  lessons: FeedbackNode[];
  proposals: FeedbackNode[];
  onEditLesson?: (id: string | number, data: unknown) => void;
  onEditProposal?: (id: string | number, data: unknown) => void;
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
        maxWidth: 560,
        width: 'fit-content',
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
      </Stack>
    </Paper>
  );
}

function FeedbackNode({ data }: any) {
  const theme = useTheme();
  const { color, label, description, isLesson, onClick } = data;

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
        minWidth: 200,
        maxWidth: 280,
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
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: alpha(color, 0.12),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${alpha(color, 0.2)}`,
              flexShrink: 0,
            }}
          >
            <Iconify
              icon={isLesson ? 'solar:inbox-in-bold' : 'solar:flag-bold'}
              sx={{ color, width: 20, height: 20 }}
            />
          </Box>
          <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
            <Chip
              label={isLesson ? 'Lección' : 'Propuesta'}
              size="small"
              sx={{
                bgcolor: alpha(color, 0.1),
                color,
                fontWeight: 600,
                fontSize: '0.65rem',
                height: 20,
                border: `1px solid ${alpha(color, 0.2)}`,
                width: 'fit-content',
              }}
            />
          </Stack>
        </Stack>

        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            color: 'text.primary',
            fontSize: '0.9rem',
            lineHeight: 1.2,
            wordBreak: 'break-word',
          }}
        >
          {String(label || '')}
        </Typography>

        {description ? (
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontSize: '0.75rem',
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {String(description || '')}
          </Typography>
        ) : null}
      </Stack>
    </Paper>
  );
}

const nodeTypes = { central: CentralNode, feedback: FeedbackNode };

export function DocumentMapFeedbacksDiagram({
  lessons = [],
  proposals = [],
  onEditLesson,
  onEditProposal,
  sx,
}: Props) {
  const theme = useTheme();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const colors = useMemo(
    () => [
      theme.palette.success.main,
      theme.palette.info.main,
      theme.palette.warning.main,
      theme.palette.error.main,
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.primary.dark,
    ],
    [theme]
  );

  const allFeedbacks = useMemo(() => [...lessons, ...proposals], [lessons, proposals]);

  const generateNodesAndEdges = useCallback(() => {
    const totalFeedbacks = allFeedbacks.length;
    if (totalFeedbacks === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const radius = Math.max(400, 280 + (totalFeedbacks > 6 ? totalFeedbacks * 20 : 0));
    const angleStep = (2 * Math.PI) / totalFeedbacks;
    const centerX = 0;
    const centerY = 0;

    const centralNode: Node = {
      id: 'central',
      type: 'central',
      position: { x: centerX - 140, y: centerY - 80 },
      data: { label: 'Documento' },
      draggable: true,
    };

    const feedbackNodes: Node[] = allFeedbacks.map((feedback, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius - 100;
      const y = centerY + Math.sin(angle) * radius - 100;
      const color = colors[index % colors.length];
      const feedbackId = String(feedback.id);
      const isLesson = feedback.isLesson;

      return {
        id: feedbackId,
        type: 'feedback',
        position: { x, y },
        data: {
          label: feedback.label,
          description: feedback.description,
          id: feedbackId,
          color,
          isLesson,
          onClick: () => {
            if (isLesson && onEditLesson) {
              onEditLesson(feedback.id, feedback.data);
            } else if (!isLesson && onEditProposal) {
              onEditProposal(feedback.id, feedback.data);
            }
          },
        },
        draggable: true,
      };
    });

    const newEdges: Edge[] = allFeedbacks.map((feedback, index) => {
      const color = colors[index % colors.length];
      return {
        id: `central-${String(feedback.id)}`,
        source: 'central',
        target: String(feedback.id),
        type: 'straight',
        animated: true,
        style: { stroke: alpha(color, 0.5), strokeWidth: 3 },
        markerEnd: { type: 'arrowclosed' as const, color: alpha(color, 0.5) },
      };
    });

    setNodes([centralNode, ...feedbackNodes]);
    setEdges(newEdges);
  }, [allFeedbacks, colors, onEditLesson, onEditProposal, setEdges, setNodes]);

  useEffect(() => {
    generateNodesAndEdges();
  }, [generateNodesAndEdges]);

  const totalCount = allFeedbacks.length;
  const lessonCount = lessons.length;
  const proposalCount = proposals.length;

  if (totalCount === 0) {
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
                Sin lecciones ni propuestas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Comienza agregando una lección aprendida o propuesta de mejora
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
            <Stack spacing={0.75}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: theme.palette.success.main,
                    animation: 'blink 2s ease-in-out infinite',
                    '@keyframes blink': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.3 } },
                  }}
                />
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                  {totalCount} {totalCount === 1 ? 'Feedback' : 'Feedbacks'}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={2}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Iconify icon="solar:inbox-in-bold" width={14} sx={{ color: 'success.main' }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.7rem' }}>
                    {lessonCount} Lección{lessonCount !== 1 ? 'es' : ''}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Iconify icon="solar:flag-bold" width={14} sx={{ color: 'info.main' }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.7rem' }}>
                    {proposalCount} Propuesta{proposalCount !== 1 ? 's' : ''}
                  </Typography>
                </Stack>
              </Stack>
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
