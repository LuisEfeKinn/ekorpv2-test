'use client';

import '@xyflow/react/dist/style.css';

import type { Node, Edge } from '@xyflow/react';
import type { Theme, SxProps } from '@mui/material/styles';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
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

import { alpha, useTheme } from '@mui/material/styles';
import { Box, Card, Stack, Paper, Button, Tooltip, IconButton, Typography, CircularProgress } from '@mui/material';

import { useTranslate } from 'src/locales';
import { GetProcessMapExpandByIdService } from 'src/services/architecture/process/processTable.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { ProcessJobLinkModal } from './process-job-link-modal';
import { ProcessToolLinkModal } from './process-tool-link-modal';
import { ProcessRiskLinkModal } from './process-risk-link-modal';
import { ProcessSystemLinkModal } from './process-system-link-modal';
import { ProcessDocumentLinkModal } from './process-document-link-modal';
import { ProcessObjectiveLinkModal } from './process-objective-link-modal';
import { ProcessIndicatorLinkModal } from './process-indicator-link-modal';
import { ProcessFeedbackCreateModal } from './process-feedback-create-modal';
import { ProcessCompetencyLinkModal } from './process-competency-link-modal';

type ChildNode = {
  id: string | number;
  label: string;
  data?: any;
  children?: ChildNode[];
};

type MapData = {
  id: number | string;
  label: string;
  data?: any;
  children: ChildNode[];
};

type ProcessesTableExpandedDiagramProps = {
  processId: string;
  nodeId: string;
  nodeLabel: string;
  parentLabel?: string;
  onBack: () => void;
  onNavigateToChild?: (child: ChildNode) => void;
  sx?: SxProps<Theme>;
};

function CentralNode({ data }: any) {
  const theme = useTheme();
  const { t } = useTranslate('architecture');
  return (
    <Paper elevation={16} sx={{ px: { xs: 3, sm: 4, md: 5 }, py: { xs: 3, sm: 3.5, md: 4 }, borderRadius: 3, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`, boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.5)}`, cursor: 'grab', minWidth: 280, position: 'relative', '&:active': { cursor: 'grabbing' } }}>
      <Handle type="source" position={Position.Top} style={{ opacity: 0, width: 0, height: 0, border: 'none', background: 'transparent', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
      <Stack spacing={1.5} alignItems="center">
        <Typography variant="h5" sx={{ color: 'common.white', fontWeight: 800, textAlign: 'center', textShadow: `0 3px 12px ${alpha(theme.palette.common.black, 0.4)}`, letterSpacing: '-0.5px', lineHeight: 1.3 }}>
          {data.label?.length > 20 ? `${data.label.substring(0, 20)}...` : data.label}
        </Typography>
        <Typography variant="caption" sx={{ color: alpha(theme.palette.common.white, 0.85), fontWeight: 600, fontSize: '0.7rem' }}>
          {t('process.map.expanded.selectedCategory')}
        </Typography>
      </Stack>
    </Paper>
  );
}

function ChildNode({ data }: any) {
  const theme = useTheme();
  const { color, label, onClick } = data;
  
  // Extract ID from data if available for display
  const displayId = data.originalId || data.id;
  const description = data.description || (data.data && typeof data.data === 'object' ? JSON.stringify(data.data).slice(0, 30) + '...' : '');

  return (
    <Paper elevation={6} sx={{ px: { xs: 2, sm: 2.5 }, py: { xs: 2, sm: 2.5 }, borderRadius: 2.5, background: theme.palette.background.paper, border: `2px solid ${alpha(color, 0.3)}`, boxShadow: `0 4px 20px ${alpha(color, 0.2)}`, cursor: 'pointer', minWidth: 220, position: 'relative', overflow: 'hidden', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', '&:hover': { transform: 'translateY(-4px) scale(1.03)', boxShadow: `0 8px 32px ${alpha(color, 0.35)}`, borderColor: color }, '&:active': { transform: 'scale(0.98)' }, '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.6)})`, boxShadow: `0 2px 8px ${alpha(color, 0.3)}` } }}>
      <Handle type="target" position={Position.Top} style={{ opacity: 0, width: 0, height: 0, border: 'none', background: 'transparent', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
      <Box onClick={onClick}>
        <Stack spacing={1.5} alignItems="center">
          <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: alpha(color, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${alpha(color, 0.2)}` }}>
            <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: color, boxShadow: `0 3px 12px ${alpha(color, 0.5)}` }} />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, textAlign: 'center', color: 'text.primary', fontSize: '0.95rem', letterSpacing: '-0.2px', lineHeight: 1.2 }}>
            {label.length > 20 ? `${label.substring(0, 20)}...` : label}
          </Typography>
          
          {description && (
             <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center', fontSize: '0.7rem', display: 'block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
               {description}
             </Typography>
          )}

          {displayId && (
            <Box sx={{ px: 1, py: 0.5, borderRadius: 1, bgcolor: alpha(color, 0.1), border: `1px solid ${alpha(color, 0.2)}` }}>
                <Typography variant="caption" sx={{ color, fontWeight: 700, fontSize: '0.65rem' }}>ID: {displayId}</Typography>
            </Box>
          )}
        </Stack>
      </Box>
    </Paper>
  );
}

const nodeTypes = { central: CentralNode, child: ChildNode };

export function ProcessTableExpandedDiagram({ processId, nodeId, nodeLabel, parentLabel, onBack, onNavigateToChild, sx }: ProcessesTableExpandedDiagramProps) {
  const theme = useTheme();
  const { t } = useTranslate('architecture');
  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const [openJobLinkModal, setOpenJobLinkModal] = useState(false);
  const [openToolLinkModal, setOpenToolLinkModal] = useState(false);
  const [openDocLinkModal, setOpenDocLinkModal] = useState(false);
  const [openSystemLinkModal, setOpenSystemLinkModal] = useState(false);
  const [openCompetencyLinkModal, setOpenCompetencyLinkModal] = useState(false);
  const [openRiskLinkModal, setOpenRiskLinkModal] = useState(false);
  const [openObjectiveLinkModal, setOpenObjectiveLinkModal] = useState(false);
  const [openIndicatorLinkModal, setOpenIndicatorLinkModal] = useState(false);
  
  // Feedback modals
  const [openLessonModal, setOpenLessonModal] = useState(false);
  const [openProposalModal, setOpenProposalModal] = useState(false);

  const idLower = String(nodeId).toLowerCase();
  const labelLower = String(nodeLabel || '').toLowerCase();

  const isJobNode = idLower.includes('job') || labelLower.includes('puesto') || labelLower.includes('cargo');
  const isToolNode = idLower.includes('tool') || labelLower.includes('herramienta') || labelLower.includes('tool');
  const isDocNode = idLower.includes('doc') || labelLower.includes('document') || labelLower.includes('documento');
  const isSystemNode = idLower.includes('system') || idLower.includes('app') || labelLower.includes('sistema') || labelLower.includes('system') || labelLower.includes('aplicacion');
  const isCompetencyNode = idLower.includes('competen') || labelLower.includes('competen');
  const isRiskNode = idLower.includes('risk') || idLower.includes('riesgo') || labelLower.includes('risk') || labelLower.includes('riesgo');
  const isObjectiveNode = idLower.includes('objective') || idLower.includes('objetivo') || labelLower.includes('objective') || labelLower.includes('objetivo');
  const isIndicatorNode = idLower.includes('indicator') || idLower.includes('indicador') || labelLower.includes('indicator') || labelLower.includes('indicador');
  
  // New checks for Lessons and Proposals
  const isLessonNode = labelLower.includes('lesson') || labelLower.includes('leccion') || labelLower.includes('aprendida');
  const isProposalNode = labelLower.includes('proposal') || labelLower.includes('propuesta') || labelLower.includes('mejora');

  const colors = useMemo(() => [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.info.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.primary.dark,
  ], [theme]);

  const fetchExpandedData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await GetProcessMapExpandByIdService(processId, nodeId);
      const data = response.data;
      // Ensure children is an array
      if (!data.children) data.children = [];
      setMapData(data);
    } catch (error) {
      console.error('Error al cargar el mapa expandido de procesos:', error);
      toast.error('Error al cargar datos del nodo');
      // Fallback data for demo if API fails or is empty
      setMapData({ id: nodeId, label: nodeLabel, children: [] });
    } finally {
      setLoading(false);
    }
  }, [processId, nodeId, nodeLabel]);

  const generateNodesAndEdges = useCallback((data: MapData) => {
    const radius = 400;
    const angleStep = (2 * Math.PI) / (data.children?.length || 1);
    const centerX = 0;
    const centerY = 0;

    const centralNode: Node = {
      id: 'central',
      type: 'central',
      position: { x: centerX - 140, y: centerY - 80 },
      data: { label: data.label || nodeLabel, appId: data.id },
      draggable: true,
    };

    const childNodes: Node[] = (data.children || []).map((child: ChildNode, index: number) => {
      // Semi-circle layout above or circle depending on count
      // Let's use the circle layout from Risk Map for consistency
      const angle = index * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius - 90;
      const y = centerY + Math.sin(angle) * radius - 90;
      const color = colors[index % colors.length];
      
      return {
        id: String(child.id),
        type: 'child',
        position: { x, y },
        data: {
          label: child.label,
          id: String(child.id),
          originalId: child.id,
          color,
          data: child.data, // Pass extra data
          onClick: () => {
            if (onNavigateToChild) onNavigateToChild(child);
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
  }, [colors, onNavigateToChild, setNodes, setEdges, nodeLabel]);

  useEffect(() => { fetchExpandedData(); }, [fetchExpandedData]);

  useEffect(() => { if (mapData) generateNodesAndEdges(mapData); }, [mapData, generateNodesAndEdges]);

  if (loading) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 600 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="body2" color="text.secondary">Cargando...</Typography>
        </Stack>
      </Box>
    );
  }

  if (!mapData) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 600 }}>
        <Typography variant="body1" color="text.secondary">No hay datos disponibles</Typography>
      </Box>
    );
  }

  return (
    <Card sx={{ width: '100%', position: 'relative', overflow: 'hidden', bgcolor: 'background.neutral', ...sx }}>
      {/* Top Left Back Navigation */}
      <Box sx={{ position: 'absolute', top: { xs: 12, sm: 16 }, left: { xs: 12, sm: 16 }, zIndex: 100 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Paper elevation={4} sx={{ px: 2, py: 1, borderRadius: 2, bgcolor: alpha(theme.palette.background.paper, 0.95), backdropFilter: 'blur(10px)', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <Tooltip title={t('process.map.expanded.backTooltip')}>
              <IconButton size="small" onClick={onBack} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.16) } }}>
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
        <Box sx={{ position: 'absolute', top: { xs: 12, sm: 16 }, right: { xs: 12, sm: 16 }, zIndex: 100, display: 'flex', gap: 1 }}>
          {isJobNode && (
            <Button variant="contained" color="primary" startIcon={<Iconify icon="solar:add-circle-bold" />} onClick={() => setOpenJobLinkModal(true)} sx={{ borderRadius: 2, boxShadow: 4 }}>
              {t('process.map.expanded.addJob')}
            </Button>
          )}
          {isToolNode && (
            <Button variant="contained" color="primary" startIcon={<Iconify icon="solar:add-circle-bold" />} onClick={() => setOpenToolLinkModal(true)} sx={{ borderRadius: 2, boxShadow: 4 }}>
              {t('process.map.expanded.addTool')}
            </Button>
          )}
          {isDocNode && (
            <Button variant="contained" color="primary" startIcon={<Iconify icon="solar:add-circle-bold" />} onClick={() => setOpenDocLinkModal(true)} sx={{ borderRadius: 2, boxShadow: 4 }}>
              {t('process.map.expanded.addDocument')}
            </Button>
          )}
          {isSystemNode && (
            <Button variant="contained" color="primary" startIcon={<Iconify icon="solar:add-circle-bold" />} onClick={() => setOpenSystemLinkModal(true)} sx={{ borderRadius: 2, boxShadow: 4 }}>
              {t('process.map.expanded.addSystem')}
            </Button>
          )}
          {isCompetencyNode && (
            <Button variant="contained" color="primary" startIcon={<Iconify icon="solar:add-circle-bold" />} onClick={() => setOpenCompetencyLinkModal(true)} sx={{ borderRadius: 2, boxShadow: 4 }}>
              {t('process.map.expanded.addCompetency')}
            </Button>
          )}
          {isRiskNode && (
            <Button variant="contained" color="primary" startIcon={<Iconify icon="solar:add-circle-bold" />} onClick={() => setOpenRiskLinkModal(true)} sx={{ borderRadius: 2, boxShadow: 4 }}>
              {t('process.map.expanded.addRisk')}
            </Button>
          )}
          {isObjectiveNode && (
            <Button variant="contained" color="primary" startIcon={<Iconify icon="solar:add-circle-bold" />} onClick={() => setOpenObjectiveLinkModal(true)} sx={{ borderRadius: 2, boxShadow: 4 }}>
              {t('process.map.expanded.addObjective')}
            </Button>
          )}
          {isIndicatorNode && (
            <Button variant="contained" color="primary" startIcon={<Iconify icon="solar:add-circle-bold" />} onClick={() => setOpenIndicatorLinkModal(true)} sx={{ borderRadius: 2, boxShadow: 4 }}>
              {t('process.map.expanded.addIndicator')}
            </Button>
          )}
          {isLessonNode && (
            <Button variant="contained" color="primary" startIcon={<Iconify icon="solar:add-circle-bold" />} onClick={() => setOpenLessonModal(true)} sx={{ borderRadius: 2, boxShadow: 4 }}>
              {t('process.map.expanded.addLesson')}
            </Button>
          )}
          {isProposalNode && (
            <Button variant="contained" color="primary" startIcon={<Iconify icon="solar:add-circle-bold" />} onClick={() => setOpenProposalModal(true)} sx={{ borderRadius: 2, boxShadow: 4 }}>
              {t('process.map.expanded.addProposal')}
            </Button>
          )}
        </Box>

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
            nodeColor={(node) => {
              if (node.type === 'central') return theme.palette.primary.main;
              return (node.data as any).color || theme.palette.grey[400];
            }}
            maskColor={alpha(theme.palette.background.paper, 0.8)}
          />
        </ReactFlow>
      </Box>

      {isJobNode && (
        <ProcessJobLinkModal
          open={openJobLinkModal}
          onClose={() => setOpenJobLinkModal(false)}
          onSuccess={fetchExpandedData}
          processId={processId}
        />
      )}

      {isToolNode && (
        <ProcessToolLinkModal
          open={openToolLinkModal}
          onClose={() => setOpenToolLinkModal(false)}
          onSuccess={fetchExpandedData}
          processId={processId}
        />
      )}

      {isDocNode && (
        <ProcessDocumentLinkModal
          open={openDocLinkModal}
          onClose={() => setOpenDocLinkModal(false)}
          onSuccess={fetchExpandedData}
          processId={processId}
        />
      )}

      {isSystemNode && (
        <ProcessSystemLinkModal
          open={openSystemLinkModal}
          onClose={() => setOpenSystemLinkModal(false)}
          onSuccess={fetchExpandedData}
          processId={processId}
        />
      )}

      {isCompetencyNode && (
        <ProcessCompetencyLinkModal
          open={openCompetencyLinkModal}
          onClose={() => setOpenCompetencyLinkModal(false)}
          onSuccess={fetchExpandedData}
          processId={processId}
        />
      )}

      {isRiskNode && (
        <ProcessRiskLinkModal
          open={openRiskLinkModal}
          onClose={() => setOpenRiskLinkModal(false)}
          onSuccess={fetchExpandedData}
          processId={processId}
        />
      )}

      {isObjectiveNode && (
        <ProcessObjectiveLinkModal
          open={openObjectiveLinkModal}
          onClose={() => setOpenObjectiveLinkModal(false)}
          onSuccess={fetchExpandedData}
          processId={processId}
        />
      )}

      {isToolNode && (
        <ProcessToolLinkModal
          open={openToolLinkModal}
          onClose={() => setOpenToolLinkModal(false)}
          onSuccess={fetchExpandedData}
          processId={processId}
        />
      )}

      {isDocNode && (
        <ProcessDocumentLinkModal
          open={openDocLinkModal}
          onClose={() => setOpenDocLinkModal(false)}
          onSuccess={fetchExpandedData}
          processId={processId}
        />
      )}

      {isSystemNode && (
        <ProcessSystemLinkModal
          open={openSystemLinkModal}
          onClose={() => setOpenSystemLinkModal(false)}
          onSuccess={fetchExpandedData}
          processId={processId}
        />
      )}

      {isCompetencyNode && (
        <ProcessCompetencyLinkModal
          open={openCompetencyLinkModal}
          onClose={() => setOpenCompetencyLinkModal(false)}
          onSuccess={fetchExpandedData}
          processId={processId}
        />
      )}

      {isRiskNode && (
        <ProcessRiskLinkModal
          open={openRiskLinkModal}
          onClose={() => setOpenRiskLinkModal(false)}
          onSuccess={fetchExpandedData}
          processId={processId}
        />
      )}

      {isObjectiveNode && (
        <ProcessObjectiveLinkModal
          open={openObjectiveLinkModal}
          onClose={() => setOpenObjectiveLinkModal(false)}
          onSuccess={fetchExpandedData}
          processId={processId}
        />
      )}

      <ProcessIndicatorLinkModal
        open={openIndicatorLinkModal}
        onClose={() => setOpenIndicatorLinkModal(false)}
        onSuccess={fetchExpandedData}
        processId={processId}
      />
      
      <ProcessFeedbackCreateModal
        open={openLessonModal}
        onClose={() => setOpenLessonModal(false)}
        onSuccess={fetchExpandedData}
        processId={processId}
        isLesson
      />
      <ProcessFeedbackCreateModal
        open={openProposalModal}
        onClose={() => setOpenProposalModal(false)}
        onSuccess={fetchExpandedData}
        processId={processId}
        isLesson={false}
      />
    </Card>
  );
}
