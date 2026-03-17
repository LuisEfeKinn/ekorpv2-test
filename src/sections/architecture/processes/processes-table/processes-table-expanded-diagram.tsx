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
import { Box, Card, Chip, Stack, Paper, Button, Tooltip, IconButton, Typography, CircularProgress } from '@mui/material';

import { useTranslate } from 'src/locales';
import { DeleteFeedbackService } from 'src/services/architecture/process/processFeedbacks.service';
import { GetProcessMapExpandByIdService } from 'src/services/architecture/process/processTable.service';
import {
  DeleteJobProcessRelationService,
  UploadJobProcessExcelByProcessService,
  DownloadJobProcessTemplateByProcessService,
} from 'src/services/architecture/business/jobProcesses.service';
import {
  DeleteProcessToolService,
  DeleteProcessRiskService,
  DeleteSystemProcessService,
  DeleteProcessDocumentService,
  DeleteObjectiveProcessService,
  DeleteProcessIndicatorService,
  DeleteProcessCompetencyService,
} from 'src/services/architecture/process/processRelations.service';

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
  const { color, label, onEdit, onDelete } = data;

  const displayId = data.originalId || data.id;
  const showRelationMeta = Boolean(data.showRelationMeta);
  const relationActionTypeNomenclature =
    showRelationMeta && typeof data.actionTypeNomenclature === 'string' ? data.actionTypeNomenclature : '';
  const relationDescription =
    showRelationMeta && typeof data.relationDescription === 'string' ? data.relationDescription : '';
  const description = showRelationMeta ? relationDescription : '';
  const chipLabel = relationActionTypeNomenclature.trim() || String(displayId ?? '');

  return (
    <Paper
      elevation={6}
      sx={{
        px: { xs: 2, sm: 2.5 },
        py: { xs: 2, sm: 2.5 },
        borderRadius: 2.5,
        background: theme.palette.background.paper,
        border: `2px solid ${alpha(color, 0.3)}`,
        boxShadow: `0 4px 20px ${alpha(color, 0.2)}`,
        cursor: 'pointer',
        minWidth: 220,
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
      <Box sx={{ position: 'absolute', top: 6, left: 6, right: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
        <Tooltip title="Editar">
          <IconButton
            size="small"
            onClick={onEdit}
            sx={{
              bgcolor: alpha(color, 0.06),
              '&:hover': { bgcolor: alpha(color, 0.16) },
            }}
          >
            <Iconify icon="solar:pen-bold" width={16} />
          </IconButton>
        </Tooltip>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {onDelete && (
            <Tooltip title="Eliminar">
              <IconButton
                size="small"
                onClick={onDelete}
                sx={{
                  color: 'error.main',
                  bgcolor: alpha(theme.palette.background.paper, 0.8),
                  '&:hover': { bgcolor: alpha(theme.palette.background.paper, 1) },
                }}
              >
                <Iconify icon="solar:trash-bin-trash-bold" width={16} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
      <Box onClick={onEdit} sx={{ pt: 3 }}>
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
            {label.length > 20 ? `${label.substring(0, 20)}...` : label}
          </Typography>

          {showRelationMeta && (relationActionTypeNomenclature || relationDescription) && chipLabel && (
            <Chip
              label={chipLabel}
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
          )}

          {showRelationMeta && !!description && (
            <Tooltip title={description}>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  textAlign: 'center',
                  fontSize: '0.7rem',
                  display: 'block',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {description}
              </Typography>
            </Tooltip>
          )}

          {displayId && (!showRelationMeta || (!relationActionTypeNomenclature && !relationDescription)) && (
            <Box
              sx={{
                px: 1,
                py: 0.5,
                borderRadius: 1,
                bgcolor: alpha(color, 0.1),
                border: `1px solid ${alpha(color, 0.2)}`,
              }}
            >
              <Typography variant="caption" sx={{ color, fontWeight: 700, fontSize: '0.65rem' }}>
                ID: {displayId}
              </Typography>
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
  const [excelLoading, setExcelLoading] = useState(false);
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
  const [editingRelation, setEditingRelation] = useState<{ id: number | null; data: any } | null>(null);
  
  // Feedback modals
  const [lessonProposalOpen, setLessonProposalOpen] = useState(false);
  const [isLessonLearned, setIsLessonLearned] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editFeedbackId, setEditFeedbackId] = useState<string | undefined>(undefined);
  const [editFeedbackInitialData, setEditFeedbackInitialData] = useState<unknown>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  const existingItemIds = useMemo(() => {
    const ids = new Set<number>();

    const pickNumber = (value: unknown): number | null => {
      const parsed = typeof value === 'number' ? value : Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const children = Array.isArray(mapData?.children) ? mapData!.children : [];

    children.forEach((child) => {
      const raw = child?.data && typeof child.data === 'object' ? child.data : child;
      if (!raw || typeof raw !== 'object') return;
      const rec = raw as Record<string, unknown>;

      const pickFromNested = (key: string): number | null => {
        const nested = rec[key];
        if (!nested || typeof nested !== 'object') return null;
        return pickNumber((nested as Record<string, unknown>).id);
      };

      const id = isJobNode
        ? pickNumber(rec.jobId ?? rec.job_id ?? rec.idJob ?? rec.id_job) ?? pickFromNested('job')
        : isToolNode
          ? pickNumber(rec.toolId ?? rec.tool_id ?? rec.idTool ?? rec.id_tool) ?? pickFromNested('tool')
          : isDocNode
            ? pickNumber(rec.documentId ?? rec.document_id ?? rec.idDocument ?? rec.id_document) ?? pickFromNested('document')
            : isSystemNode
              ? pickNumber(rec.systemId ?? rec.system_id ?? rec.applicationId ?? rec.application_id) ??
                pickFromNested('system') ??
                pickFromNested('application')
              : isCompetencyNode
                ? pickNumber(rec.competencyId ?? rec.competency_id ?? rec.idCompetency ?? rec.id_competency) ?? pickFromNested('competency')
                : isRiskNode
                  ? pickNumber(rec.riskId ?? rec.risk_id ?? rec.idRisk ?? rec.id_risk) ?? pickFromNested('risk')
                  : isObjectiveNode
                    ? pickNumber(rec.objectiveId ?? rec.objective_id ?? rec.idObjective ?? rec.id_objective) ?? pickFromNested('objective')
                    : isIndicatorNode
                      ? pickNumber(rec.indicatorId ?? rec.indicator_id ?? rec.idIndicator ?? rec.id_indicator) ?? pickFromNested('indicator')
                      : null;

      if (id != null) ids.add(id);
    });

    return Array.from(ids);
  }, [
    isCompetencyNode,
    isDocNode,
    isIndicatorNode,
    isJobNode,
    isObjectiveNode,
    isRiskNode,
    isSystemNode,
    isToolNode,
    mapData,
  ]);

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

  const handleDownloadTemplateForProcess = useCallback(async () => {
    try {
      const response = await DownloadJobProcessTemplateByProcessService();
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Job_Processes_Template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(t('process.table.messages.success.downloaded', { defaultValue: 'Template downloaded successfully' }));
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error(t('process.table.messages.error.downloading', { defaultValue: 'Error downloading template' }));
    }
  }, [t]);

  const handleUploadExcelForProcess = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (!file) return;

      try {
        setExcelLoading(true);
        await UploadJobProcessExcelByProcessService(processId, file);
        toast.success(t('process.table.messages.success.uploaded', { defaultValue: 'Uploaded successfully' }));
        fetchExpandedData();
      } catch (error) {
        console.error('Error uploading excel:', error);
        toast.error(t('process.table.messages.error.uploading', { defaultValue: 'Error uploading file' }));
      } finally {
        setExcelLoading(false);
      }
    },
    [fetchExpandedData, processId, t]
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
        data: { label: data.label || nodeLabel, appId: data.id },
        draggable: true,
      };

      const childNodes: Node[] = (data.children || []).map((child: ChildNode, index: number) => {
        const angle = index * angleStep - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius - 90;
        const y = centerY + Math.sin(angle) * radius - 90;
        const color = colors[index % colors.length];

        const relationData = typeof child.data === 'object' && child.data ? child.data : null;
        const relationIdCandidate =
          relationData && Object.prototype.hasOwnProperty.call(relationData, 'id')
            ? Number((relationData as any).id)
            : Number(child.id);
        const relationId = Number.isFinite(relationIdCandidate) ? relationIdCandidate : null;

        const pickNumber = (value: unknown): number | null => {
          const parsed = typeof value === 'number' ? value : Number(value);
          return Number.isFinite(parsed) ? parsed : null;
        };

        const isFeedbackNode = isLessonNode || isProposalNode;
        const looksLikeFeedback =
          relationData &&
          typeof relationData === 'object' &&
          ('improvementLesson' in (relationData as any) ||
            'problem' in (relationData as any) ||
            'rootCause' in (relationData as any) ||
            'proposedStrategy' in (relationData as any));

        const feedbackIdFromRelation = pickNumber(
          (relationData as any)?.feedbackId ??
            (relationData as any)?.feedback_id ??
            (relationData as any)?.idFeedback ??
            (relationData as any)?.id_feedback ??
            (relationData as any)?.feedback?.id ??
            (looksLikeFeedback ? (relationData as any)?.id : null)
        );

        const feedbackIdFromChild = pickNumber(
          (child as any)?.feedbackId ??
            (child as any)?.feedback_id ??
            (child as any)?.data?.feedbackId ??
            (child as any)?.data?.feedback_id ??
            (child as any)?.data?.feedback?.id ??
            (!relationData ? child.id : null)
        );

        const feedbackIdCandidate = isFeedbackNode ? feedbackIdFromRelation ?? feedbackIdFromChild : null;
        const feedbackId = feedbackIdCandidate != null ? String(feedbackIdCandidate) : undefined;
        const feedbackInitialData =
          relationData && typeof relationData === 'object'
            ? (relationData as any).feedback ?? relationData
            : child.data;

        const isRelationCentral =
          isJobNode ||
          isToolNode ||
          isDocNode ||
          isSystemNode ||
          isCompetencyNode ||
          isRiskNode ||
          isObjectiveNode ||
          isIndicatorNode ||
          isFeedbackNode;

        const handleEdit = () => {
          if (!isRelationCentral) return;
          if (isFeedbackNode) {
            setEditMode(true);
            setEditFeedbackId(feedbackId);
            setEditFeedbackInitialData(feedbackInitialData);
            setIsLessonLearned(isLessonNode);
            setLessonProposalOpen(true);
            return;
          }

          if (!relationId) return;
          setEditingRelation({ id: relationId, data: relationData || child });
          if (isJobNode) {
            setOpenJobLinkModal(true);
          } else if (isToolNode) {
            setOpenToolLinkModal(true);
          } else if (isDocNode) {
            setOpenDocLinkModal(true);
          } else if (isSystemNode) {
            setOpenSystemLinkModal(true);
          } else if (isCompetencyNode) {
            setOpenCompetencyLinkModal(true);
          } else if (isRiskNode) {
            setOpenRiskLinkModal(true);
          } else if (isObjectiveNode) {
            setOpenObjectiveLinkModal(true);
          } else if (isIndicatorNode) {
            setOpenIndicatorLinkModal(true);
          }
        };

        const handleNavigate = () => {
          if (onNavigateToChild) onNavigateToChild(child);
        };

        const handleDelete = async () => {
          if (!isRelationCentral) return;
          const confirmed = window.confirm('¿Eliminar esta relación del proceso?');
          if (!confirmed) return;
          try {
            if (isFeedbackNode) {
              if (!feedbackIdCandidate) return;
              await DeleteFeedbackService(feedbackIdCandidate);
            } else if (isJobNode) {
              if (!relationId) return;
              await DeleteJobProcessRelationService(relationId);
            } else if (isToolNode) {
              if (!relationId) return;
              await DeleteProcessToolService(relationId);
            } else if (isDocNode) {
              if (!relationId) return;
              await DeleteProcessDocumentService(relationId);
            } else if (isSystemNode) {
              if (!relationId) return;
              await DeleteSystemProcessService(relationId);
            } else if (isCompetencyNode) {
              if (!relationId) return;
              await DeleteProcessCompetencyService(relationId);
            } else if (isRiskNode) {
              if (!relationId) return;
              await DeleteProcessRiskService(relationId);
            } else if (isObjectiveNode) {
              if (!relationId) return;
              await DeleteObjectiveProcessService(relationId);
            } else if (isIndicatorNode) {
              if (!relationId) return;
              await DeleteProcessIndicatorService(relationId);
            }
            toast.success(t('process.map.modals.common.delete'));
            fetchExpandedData();
          } catch (error) {
            console.error(error);
            toast.error(t('process.map.modals.common.saveError'));
          }
        };

        const actionTypeNomenclature =
          typeof (child as any).actionTypeNomenclature === 'string' ? String((child as any).actionTypeNomenclature) : '';
        const relationDescription =
          typeof (child as any).description === 'string' ? String((child as any).description) : '';

        return {
          id: String(child.id),
          type: 'child',
          position: { x, y },
          data: {
            label: child.label,
            id: relationId != null ? String(relationId) : String(child.id),
            originalId: child.id,
            color,
            data: child.data,
            relationId,
            relationData,
            showRelationMeta: isJobNode,
            actionTypeNomenclature,
            relationDescription,
            onEdit: handleEdit,
            onDelete: handleDelete,
            onNavigate: onNavigateToChild ? handleNavigate : undefined,
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
    }, [
      colors,
      onNavigateToChild,
      setNodes,
      setEdges,
      nodeLabel,
      isJobNode,
      isToolNode,
      isDocNode,
      isSystemNode,
      isCompetencyNode,
      isRiskNode,
      isObjectiveNode,
      isIndicatorNode,
      isLessonNode,
      isProposalNode,
      setEditingRelation,
      setOpenJobLinkModal,
      setOpenToolLinkModal,
      setOpenDocLinkModal,
      setOpenSystemLinkModal,
      setOpenCompetencyLinkModal,
      setOpenRiskLinkModal,
      setOpenObjectiveLinkModal,
      setOpenIndicatorLinkModal,
      setLessonProposalOpen,
      setEditMode,
      setEditFeedbackId,
      setEditFeedbackInitialData,
      setIsLessonLearned,
      fetchExpandedData,
      t,
    ]);

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
            <Stack direction="row" spacing={1} alignItems="center">
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".xlsx, .xls"
                onChange={handleUploadExcelForProcess}
              />

              <Tooltip title="Carga Masiva Excel">
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    color: 'success.main',
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.success.main, 0.2),
                    },
                    width: 40,
                    height: 40,
                  }}
                >
                  {excelLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <Iconify icon="eva:cloud-upload-fill" width={20} />
                  )}
                </IconButton>
              </Tooltip>

              <Tooltip title="Descargar Plantilla">
                <IconButton
                  onClick={handleDownloadTemplateForProcess}
                  sx={{
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    color: 'info.main',
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.info.main, 0.2),
                    },
                    width: 40,
                    height: 40,
                  }}
                >
                  <Iconify icon="eva:cloud-download-fill" width={20} />
                </IconButton>
              </Tooltip>

              <Button
                variant="contained"
                color="primary"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={() => {
                  setEditingRelation(null);
                  setOpenJobLinkModal(true);
                }}
                sx={{ borderRadius: 2, boxShadow: 4 }}
              >
                {t('process.map.expanded.addJob')}
              </Button>
            </Stack>
          )}
          {isToolNode && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={() => {
                setEditingRelation(null);
                setOpenToolLinkModal(true);
              }}
              sx={{ borderRadius: 2, boxShadow: 4 }}
            >
              {t('process.map.expanded.addTool')}
            </Button>
          )}
          {isDocNode && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={() => {
                setEditingRelation(null);
                setOpenDocLinkModal(true);
              }}
              sx={{ borderRadius: 2, boxShadow: 4 }}
            >
              {t('process.map.expanded.addDocument')}
            </Button>
          )}
          {isSystemNode && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={() => {
                setEditingRelation(null);
                setOpenSystemLinkModal(true);
              }}
              sx={{ borderRadius: 2, boxShadow: 4 }}
            >
              {t('process.map.expanded.addSystem')}
            </Button>
          )}
          {isCompetencyNode && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={() => {
                setEditingRelation(null);
                setOpenCompetencyLinkModal(true);
              }}
              sx={{ borderRadius: 2, boxShadow: 4 }}
            >
              {t('process.map.expanded.addCompetency')}
            </Button>
          )}
          {isRiskNode && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={() => {
                setEditingRelation(null);
                setOpenRiskLinkModal(true);
              }}
              sx={{ borderRadius: 2, boxShadow: 4 }}
            >
              {t('process.map.expanded.addRisk')}
            </Button>
          )}
          {isObjectiveNode && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={() => {
                setEditingRelation(null);
                setOpenObjectiveLinkModal(true);
              }}
              sx={{ borderRadius: 2, boxShadow: 4 }}
            >
              {t('process.map.expanded.addObjective')}
            </Button>
          )}
          {isIndicatorNode && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={() => {
                setEditingRelation(null);
                setOpenIndicatorLinkModal(true);
              }}
              sx={{ borderRadius: 2, boxShadow: 4 }}
            >
              {t('process.map.expanded.addIndicator')}
            </Button>
          )}
          {isLessonNode && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={() => {
                setEditMode(false);
                setEditFeedbackId(undefined);
                setEditFeedbackInitialData(null);
                setIsLessonLearned(true);
                setLessonProposalOpen(true);
              }}
              sx={{ borderRadius: 2, boxShadow: 4 }}
            >
              {t('process.map.expanded.addLesson')}
            </Button>
          )}
          {isProposalNode && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={() => {
                setEditMode(false);
                setEditFeedbackId(undefined);
                setEditFeedbackInitialData(null);
                setIsLessonLearned(false);
                setLessonProposalOpen(true);
              }}
              sx={{ borderRadius: 2, boxShadow: 4 }}
            >
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
          onClose={() => {
            setOpenJobLinkModal(false);
          }}
          onSuccess={() => {
            setEditingRelation(null);
            fetchExpandedData();
          }}
          processId={processId}
          existingItemIds={existingItemIds}
          relationId={editingRelation?.id ?? null}
          initialData={editingRelation?.data}
          allowDelete
        />
      )}

      {isToolNode && (
        <ProcessToolLinkModal
          open={openToolLinkModal}
          onClose={() => {
            setOpenToolLinkModal(false);
          }}
          onSuccess={() => {
            setEditingRelation(null);
            fetchExpandedData();
          }}
          processId={processId}
          existingItemIds={existingItemIds}
          relationId={editingRelation?.id ?? null}
          initialData={editingRelation?.data}
          allowDelete
        />
      )}

      {isDocNode && (
        <ProcessDocumentLinkModal
          open={openDocLinkModal}
          onClose={() => {
            setOpenDocLinkModal(false);
          }}
          onSuccess={() => {
            setEditingRelation(null);
            fetchExpandedData();
          }}
          processId={processId}
          existingItemIds={existingItemIds}
          relationId={editingRelation?.id ?? null}
          initialData={editingRelation?.data}
          allowDelete
        />
      )}

      {isSystemNode && (
        <ProcessSystemLinkModal
          open={openSystemLinkModal}
          onClose={() => {
            setOpenSystemLinkModal(false);
          }}
          onSuccess={() => {
            setEditingRelation(null);
            fetchExpandedData();
          }}
          processId={processId}
          existingItemIds={existingItemIds}
          relationId={editingRelation?.id ?? null}
          initialData={editingRelation?.data}
          allowDelete
        />
      )}

      {isCompetencyNode && (
        <ProcessCompetencyLinkModal
          open={openCompetencyLinkModal}
          onClose={() => {
            setOpenCompetencyLinkModal(false);
          }}
          onSuccess={() => {
            setEditingRelation(null);
            fetchExpandedData();
          }}
          processId={processId}
          existingItemIds={existingItemIds}
          relationId={editingRelation?.id ?? null}
          initialData={editingRelation?.data}
          allowDelete
        />
      )}

      {isRiskNode && (
        <ProcessRiskLinkModal
          open={openRiskLinkModal}
          onClose={() => {
            setOpenRiskLinkModal(false);
          }}
          onSuccess={() => {
            setEditingRelation(null);
            fetchExpandedData();
          }}
          processId={processId}
          existingItemIds={existingItemIds}
          relationId={editingRelation?.id ?? null}
          initialData={editingRelation?.data}
          allowDelete
        />
      )}

      {isObjectiveNode && (
        <ProcessObjectiveLinkModal
          open={openObjectiveLinkModal}
          onClose={() => {
            setOpenObjectiveLinkModal(false);
          }}
          onSuccess={() => {
            setEditingRelation(null);
            fetchExpandedData();
          }}
          processId={processId}
          existingItemIds={existingItemIds}
          relationId={editingRelation?.id ?? null}
          initialData={editingRelation?.data}
          allowDelete
        />
      )}

      {isIndicatorNode && (
        <ProcessIndicatorLinkModal
          open={openIndicatorLinkModal}
          onClose={() => {
            setOpenIndicatorLinkModal(false);
          }}
          onSuccess={() => {
            setEditingRelation(null);
            fetchExpandedData();
          }}
          processId={processId}
          existingItemIds={existingItemIds}
          relationId={editingRelation?.id ?? null}
          initialData={editingRelation?.data}
          allowDelete
        />
      )}
      
      <ProcessFeedbackCreateModal
        open={lessonProposalOpen}
        onClose={() => {
          setLessonProposalOpen(false);
          setEditMode(false);
          setEditFeedbackId(undefined);
          setEditFeedbackInitialData(null);
        }}
        onSuccess={() => {
          setLessonProposalOpen(false);
          setEditMode(false);
          setEditFeedbackId(undefined);
          setEditFeedbackInitialData(null);
          fetchExpandedData();
        }}
        processId={processId}
        isLesson={isLessonLearned}
        editMode={editMode}
        feedbackId={editFeedbackId}
        initialData={editFeedbackInitialData}
      />
    </Card>
  );
}
