'use client';

import '@xyflow/react/dist/style.css';

import type { Node, Edge } from '@xyflow/react';
import type { Theme, SxProps } from '@mui/material/styles';

import { useRef, useMemo, useState, useEffect, useCallback, type ChangeEvent } from 'react';
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

import { useTranslate } from 'src/locales';
import { GetJobsMapExpandByIdService } from 'src/services/architecture/business/jobs.service';
import { DeleteJobFeedbackObjectService } from 'src/services/architecture/business/job-feedbacks.service';
import {
  UploadJobProcessExcelService,
  DeleteJobProcessRelationService,
  DownloadJobProcessTemplateService,
} from 'src/services/architecture/business/jobProcesses.service';
import {
  DeleteNextJobService,
  DeleteJobDataRelationService,
  DeleteJobRelationTypeService,
  DeleteJobSystemRelationService,
  DeleteJobDocumentRelationService,
  DeleteJobIndicatorRelationService,
  DeleteJobTechnologiesRelationService,
} from 'src/services/architecture/business/jobRelations.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { JobsRelationsDrawer } from './jobs-relations-drawer';
import { JobsLessonsProposalsDrawer } from './jobs-lessons-proposals-drawer';

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

type Props = {
  jobId: string;
  nodeId: string;
  nodeLabel: string;
  parentLabel: string;
  onBack: () => void;
  onNavigateToChild: (child: ChildNode) => void;
  sx?: SxProps<Theme>;
};

function CentralNode({ data }: any) {
  const { t } = useTranslate('business');
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
          label={`Nodo: ${data.nodeId}`}
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
          {data.label}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: alpha(theme.palette.common.white, 0.85),
            fontWeight: 600,
            fontSize: '0.7rem',
          }}
        >
          {t('positions.mapDetail')}
        </Typography>
      </Stack>
    </Paper>
  );
}

function ChildNode({ data }: any) {
  const theme = useTheme();
  const { color, label, id, onEdit, onDelete, actionTypeNomenclature, isProcessNode, description } = data;

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
        minWidth: 180,
        maxWidth: 220,
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
      <Box
        sx={{
          position: 'absolute',
          top: 6,
          left: 6,
          right: 6,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 2,
        }}
      >
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
            }}
          >
            {label}
          </Typography>

          <Stack direction="column" alignItems="center" spacing={0.5} sx={{ width: '100%' }}>
            <Chip
              label={actionTypeNomenclature || id}
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

            {isProcessNode && description && (
              <Tooltip title={description}>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    textAlign: 'center',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    mt: 0.5,
                    width: '100%',
                  }}
                >
                  {description}
                </Typography>
              </Tooltip>
            )}
          </Stack>

        </Stack>
      </Box>
    </Paper>
  );
}

const nodeTypes = { central: CentralNode, child: ChildNode };

export function JobsMapExpandedDiagram({
  jobId,
  nodeId,
  nodeLabel,
  parentLabel,
  onBack,
  onNavigateToChild,
  sx,
}: Props) {
  const { t } = useTranslate('business');
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [relationOpen, setRelationOpen] = useState(false);
  const [relationKind, setRelationKind] = useState<'process' | 'document' | 'system' | 'indicator' | 'data' | 'technology' | 'relation' | 'nextJob'>('process');
  const [lessonProposalOpen, setLessonProposalOpen] = useState(false);
  const [isLessonLearned, setIsLessonLearned] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editFeedbackId, setEditFeedbackId] = useState<string | undefined>(undefined);
  const [editFeedbackInitialData, setEditFeedbackInitialData] = useState<unknown>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ relationId: number; type: string } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [editingRelation, setEditingRelation] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const existingItemIds = useMemo(() => {
    const ids = new Set<number>();
    const children = mapData?.children ?? [];
    const currentJobId = Number(jobId);

    const pickNumber = (value: unknown) => {
      const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
      return Number.isFinite(n) ? n : null;
    };

    children.forEach((child) => {
      const data = child?.data;
      const childRec = child && typeof child === 'object' ? (child as unknown as Record<string, unknown>) : {};
      const dataRec = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
      const rec: Record<string, unknown> = { ...childRec, ...dataRec };

      if (relationKind === 'process') {
        const id = pickNumber(
          rec.processId ??
            rec.process_id ??
            rec.processTableId ??
            rec.idProcess ??
            rec.id_process ??
            (rec.process as { id?: unknown } | undefined)?.id ??
            (rec.processTable as { id?: unknown } | undefined)?.id
        );
        if (id != null) ids.add(id);
        return;
      }
      if (relationKind === 'document') {
        const id = pickNumber(
          rec.documentId ??
            rec.document_id ??
            rec.documentTableId ??
            rec.idDocument ??
            rec.id_document ??
            (rec.document as { id?: unknown } | undefined)?.id ??
            (rec.documentTable as { id?: unknown } | undefined)?.id
        );
        if (id != null) ids.add(id);
        return;
      }
      if (relationKind === 'system') {
        const id = pickNumber(
          rec.systemId ??
            rec.applicationId ??
            rec.system_id ??
            rec.application_id ??
            (rec.system as { id?: unknown } | undefined)?.id ??
            (rec.application as { id?: unknown } | undefined)?.id
        );
        if (id != null) ids.add(id);
        return;
      }
      if (relationKind === 'indicator') {
        const id = pickNumber(
          rec.indicatorId ??
            rec.indicator_id ??
            rec.idIndicator ??
            rec.id_indicator ??
            (rec.indicator as { id?: unknown } | undefined)?.id
        );
        if (id != null) ids.add(id);
        return;
      }
      if (relationKind === 'data') {
        const id = pickNumber(
          rec.dataId ??
            rec.data_id ??
            rec.idData ??
            rec.id_data ??
            (rec.data as { id?: unknown } | undefined)?.id
        );
        if (id != null) ids.add(id);
        return;
      }
      if (relationKind === 'technology') {
        const id = pickNumber(
          rec.technologyId ??
            rec.technology_id ??
            rec.infrastructureId ??
            rec.infraestructureId ??
            (rec.technology as { id?: unknown } | undefined)?.id ??
            (rec.infrastructure as { id?: unknown } | undefined)?.id ??
            (rec.infraestructure as { id?: unknown } | undefined)?.id
        );
        if (id != null) ids.add(id);
        return;
      }
      if (relationKind === 'relation') {
        const job1Id = pickNumber(rec.job1Id ?? (rec.job1 as { id?: unknown } | undefined)?.id);
        const job2Id = pickNumber(rec.job2Id ?? (rec.job2 as { id?: unknown } | undefined)?.id);

        const otherJobId =
          Number.isFinite(currentJobId) && currentJobId > 0
            ? job1Id === currentJobId
              ? job2Id
              : job2Id === currentJobId
                ? job1Id
                : job2Id
            : job2Id;

        if (otherJobId != null) ids.add(otherJobId);
        return;
      }
      if (relationKind === 'nextJob') {
        const id = pickNumber(
          rec.nextJobId ??
            (rec.nextJob as { id?: unknown } | undefined)?.id ??
            rec.job2Id ??
            (rec.job2 as { id?: unknown } | undefined)?.id
        );
        if (id != null) ids.add(id);
      }
    });

    return Array.from(ids);
  }, [jobId, mapData?.children, relationKind]);

  const getFeedbackIdFromNode = useCallback((raw: unknown, fallbackChildId: unknown) => {
    if (!raw || typeof raw !== 'object') {
      const id = Number(fallbackChildId);
      return Number.isFinite(id) ? id : null;
    }

    const obj = raw as Record<string, unknown>;
    const direct = Number(obj.feedbackId);
    if (Number.isFinite(direct)) return direct;

    const feedback = obj.feedback;
    if (feedback && typeof feedback === 'object') {
      const feedbackId = Number((feedback as Record<string, unknown>).id);
      if (Number.isFinite(feedbackId)) return feedbackId;
    }

    const id = Number(obj.id);
    if (Number.isFinite(id)) return id;

    const fallback = Number(fallbackChildId);
    return Number.isFinite(fallback) ? fallback : null;
  }, []);

  const getFeedbackObjectRelationIdFromNode = useCallback((raw: unknown, fallbackChildId: unknown) => {
    if (!raw || typeof raw !== 'object') {
      const id = Number(fallbackChildId);
      return Number.isFinite(id) ? id : null;
    }

    const obj = raw as Record<string, unknown>;
    const rel1 = Number(obj.feedbackObjectId);
    if (Number.isFinite(rel1)) return rel1;

    const rel2 = Number(obj.relationId);
    if (Number.isFinite(rel2)) return rel2;

    const rel3 = Number(obj.id);
    if (Number.isFinite(rel3)) return rel3;

    const fallback = Number(fallbackChildId);
    return Number.isFinite(fallback) ? fallback : null;
  }, []);

  const confirmDelete = useCallback((relationId: number, type: string) => {
    setDeleteTarget({ relationId, type });
    setConfirmOpen(true);
  }, []);

  const handleDeleteConfirmed = useCallback(async () => {
    if (!deleteTarget) return;
    const { relationId, type } = deleteTarget;

    try {
      if (type === 'process') {
        await DeleteJobProcessRelationService(relationId);
      } else if (type === 'document') {
        await DeleteJobDocumentRelationService(relationId);
      } else if (type === 'system') {
        await DeleteJobSystemRelationService(relationId);
      } else if (type === 'indicator') {
        await DeleteJobIndicatorRelationService(relationId);
      } else if (type === 'data') {
        await DeleteJobDataRelationService(relationId);
      } else if (type === 'technology') {
        await DeleteJobTechnologiesRelationService(relationId);
      } else if (type === 'relation') {
        await DeleteJobRelationTypeService(relationId);
      } else if (type === 'nextJob') {
        await DeleteNextJobService(relationId);
      } else if (type === 'lesson' || type === 'proposal') {
        await DeleteJobFeedbackObjectService(relationId);
      } else {
        return;
      }

      toast.success(t('positions.relations.common.deleteSuccess'));
      setReloadKey((k) => k + 1);
    } catch {
      toast.error(t('positions.relations.common.deleteError'));
    } finally {
      setConfirmOpen(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, t]);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      await UploadJobProcessExcelService(jobId, file);
      toast.success('Carga masiva exitosa');
      setReloadKey((prev) => prev + 1);
    } catch (error) {
      console.error(error);
      toast.error('Error en la carga masiva');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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

      const labelLowerLocal = String(data.label ?? '').toLowerCase();
      const nodeLowerLocal = String(nodeId ?? '').toLowerCase();
      const dataIdLower = String(data.id ?? '').toLowerCase();

      const isProcessNodeLocal =
        nodeLowerLocal.includes('process') ||
        labelLowerLocal.includes('proce') ||
        nodeId === 'pro' ||
        dataIdLower === 'pro' ||
        dataIdLower.includes('process');
      const isDocumentNodeLocal =
        nodeLowerLocal.includes('doc') ||
        labelLowerLocal.includes('document') ||
        labelLowerLocal.includes('documento') ||
        nodeId === 'doc';
      const isSystemNodeLocal =
        nodeLowerLocal.includes('system') ||
        labelLowerLocal.includes('sistema') ||
        nodeId === 'sis';
      const isIndicatorNodeLocal =
        nodeLowerLocal.includes('indicator') ||
        labelLowerLocal.includes('indic') ||
        labelLowerLocal.includes('indicador') ||
        nodeId === 'ind';
      const isDataNodeLocal =
        nodeId === 'dat' ||
        labelLowerLocal.includes('datos') ||
        labelLowerLocal.includes('data');
      const isTechnologyNodeLocal =
        nodeId === 'tec' ||
        labelLowerLocal.includes('tecnolog') ||
        labelLowerLocal.includes('technology');
      const isRelationNodeLocal =
        nodeId === 'rel' ||
        labelLowerLocal.includes('relaciones') ||
        labelLowerLocal.includes('relations');
      const isNextJobNodeLocal =
        nodeId === 'nex' ||
        nodeId === 'sig' ||
        labelLowerLocal.includes('siguientes') ||
        labelLowerLocal.includes('next');
      const isLessonsLearnedNodeLocal =
        nodeId === 'lec' || labelLowerLocal.includes('lecciones') || labelLowerLocal.includes('lessons');
      const isProposalsNodeLocal =
        nodeId === 'prp' ||
        labelLowerLocal.includes('propuestas') ||
        labelLowerLocal.includes('mejora') ||
        labelLowerLocal.includes('proposals');

      const centralNode: Node = {
        id: 'central',
        type: 'central',
        position: { x: centerX - 140, y: centerY - 80 },
        data: { label: nodeLabel || data.label, nodeId },
        draggable: true,
      };

      const childNodes: Node[] = (data.children || []).map((child: ChildNode, index: number) => {
        const angle = index * angleStep - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius - 90;
        const y = centerY + Math.sin(angle) * radius - 90;
        const color = colors[index % colors.length];

        const relationData =
          child.data && typeof child.data === 'object'
            ? child.data
            : null;

        const rawRelationId = relationData && (relationData as any).relationId
          ? Number((relationData as any).relationId)
          : relationData && (relationData as any).id
            ? Number((relationData as any).id)
            : Number(child.id);

        const relationId = Number.isFinite(rawRelationId) ? rawRelationId : null;

        const handleEdit = () => {
          if (isLessonsLearnedNodeLocal || isProposalsNodeLocal) {
            const feedbackId = getFeedbackIdFromNode(relationData, child.id);
            setIsLessonLearned(isLessonsLearnedNodeLocal);
            setEditMode(true);
            setEditFeedbackId(feedbackId ? String(feedbackId) : undefined);
            setEditFeedbackInitialData(relationData ?? child);
            setLessonProposalOpen(true);
            return;
          }

          if (!relationId) return;

          const kind = isProcessNodeLocal
            ? 'process'
            : isDocumentNodeLocal
              ? 'document'
              : isSystemNodeLocal
                ? 'system'
                : isIndicatorNodeLocal
                  ? 'indicator'
                  : isDataNodeLocal
                    ? 'data'
                    : isTechnologyNodeLocal
                      ? 'technology'
                      : isRelationNodeLocal
                        ? 'relation'
                        : isNextJobNodeLocal
                          ? 'nextJob'
                          : null;

          if (!kind) return;

          const initial = relationData && typeof relationData === 'object'
            ? { ...(relationData as any), id: relationId }
            : { id: relationId };

          setEditingRelation(initial);
          setRelationKind(kind);
          setRelationOpen(true);
        };

        const handleDelete = () => {
          if (isLessonsLearnedNodeLocal || isProposalsNodeLocal) {
            const relId = getFeedbackObjectRelationIdFromNode(relationData, child.id);
            if (!relId) return;
            confirmDelete(relId, isLessonsLearnedNodeLocal ? 'lesson' : 'proposal');
            return;
          }

          if (!relationId) return;

          const kind = isProcessNodeLocal
            ? 'process'
            : isDocumentNodeLocal
              ? 'document'
              : isSystemNodeLocal
                ? 'system'
                : isIndicatorNodeLocal
                  ? 'indicator'
                  : isDataNodeLocal
                    ? 'data'
                    : isTechnologyNodeLocal
                      ? 'technology'
                      : isRelationNodeLocal
                        ? 'relation'
                        : isNextJobNodeLocal
                          ? 'nextJob'
                          : null;

          if (!kind) return;
          confirmDelete(relationId, kind);
        };

        const handleNavigate = () => {
          onNavigateToChild(child);
        };

        const actionTypeNomenclature = (child as any).actionTypeNomenclature;
        const description = (child as any).description;

        return {
          id: String(child.id),
          type: 'child',
          position: { x, y },
          data: {
            label: child.label,
            id: String(child.id),
            color,
            onEdit: handleEdit,
            onDelete: handleDelete,
            onNavigate: handleNavigate,
            actionTypeNomenclature,
            isProcessNode: isProcessNodeLocal,
            description,
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
    [
      colors,
      confirmDelete,
      getFeedbackIdFromNode,
      getFeedbackObjectRelationIdFromNode,
      nodeId,
      nodeLabel,
      onNavigateToChild,
      setEdges,
      setNodes,
    ]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await GetJobsMapExpandByIdService(jobId, nodeId);
        const data = response.data;
        setMapData(data);
        generateNodesAndEdges(data);
      } catch {
        toast.error(t('positions.errors.loadDetail'));
        setMapData({ id: jobId, label: nodeLabel || 'Nodo', children: [] });
        generateNodesAndEdges({ id: jobId, label: nodeLabel || 'Nodo', children: [] });
      } finally {
        setLoading(false);
      }
    };
    if (jobId && nodeId) fetchData();
  }, [t, generateNodesAndEdges, jobId, nodeId, nodeLabel, reloadKey]);

  const labelLower = String(mapData?.label ?? nodeLabel ?? '').toLowerCase();
  const nodeLower = String(nodeId ?? '').toLowerCase();
  const handleDownloadTemplate = async () => {
    try {
      const response = await DownloadJobProcessTemplateService();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Plantilla_Carga_Masiva_Procesos.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(error);
      toast.error('Error al descargar la plantilla');
    }
  };

  const isProcessNode = nodeLower.includes('process') || labelLower.includes('proce') || nodeId === 'pro';
  const isDocumentNode = nodeLower.includes('doc') || labelLower.includes('document') || labelLower.includes('documento') || nodeId === 'doc';
  const isSystemNode = nodeLower.includes('system') || labelLower.includes('sistema') || nodeId === 'sis';
  const isIndicatorNode = nodeLower.includes('indicator') || labelLower.includes('indic') || labelLower.includes('indicador') || nodeId === 'ind';
  const isLessonsLearnedNode = nodeId === 'lec' || labelLower.includes('lecciones') || labelLower.includes('lessons');
  const isProposalsNode = nodeId === 'prp' || labelLower.includes('propuestas') || labelLower.includes('mejora') || labelLower.includes('proposals');
  const isDataNode = nodeId === 'dat' || labelLower.includes('datos') || labelLower.includes('data');
  const isTechnologyNode = nodeId === 'tec' || labelLower.includes('tecnolog') || labelLower.includes('technology');
  const isRelationNode = nodeId === 'rel' || labelLower.includes('relaciones') || labelLower.includes('relations');
  const isNextJobNode = nodeId === 'nex' || nodeId === 'sig' || labelLower.includes('siguientes') || labelLower.includes('next');

  const showRelate = isProcessNode || isDocumentNode || isSystemNode || isIndicatorNode || isLessonsLearnedNode || isProposalsNode || isDataNode || isTechnologyNode || isRelationNode || isNextJobNode;
  const relateLabel = isProcessNode
    ? t('positions.relations.process.buttonLabel')
    : isDocumentNode
      ? t('positions.relations.document.buttonLabel')
      : isSystemNode
        ? t('positions.relations.system.buttonLabel')
        : isIndicatorNode
          ? t('positions.relations.indicator.buttonLabel')
          : isLessonsLearnedNode
            ? t('positions.relations.lessonLearned.buttonLabel')
            : isProposalsNode
              ? t('positions.relations.proposal.buttonLabel')
              : isDataNode
                ? t('positions.relations.data.buttonLabel')
                : isTechnologyNode
                  ? t('positions.relations.technology.buttonLabel')
                  : isRelationNode
                    ? t('positions.relations.relation.buttonLabel')
                    : isNextJobNode
                      ? t('positions.relations.nextJob.buttonLabel')
                      : t('positions.relations.common.relate');

  return (
    <Card sx={{ width: '100%', position: 'relative', overflow: 'hidden', bgcolor: 'background.neutral', ...sx }}>
      <Box sx={{ position: 'absolute', top: { xs: 12, sm: 16 }, left: { xs: 12, sm: 16 }, zIndex: 100 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Paper elevation={4} sx={{ px: 2, py: 1, borderRadius: 2, bgcolor: alpha(theme.palette.background.paper, 0.95), backdropFilter: 'blur(10px)', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <Tooltip title={t('positions.map.back')}>
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

      {showRelate && (
        <Stack
          direction="row"
          spacing={1}
          sx={{ position: 'absolute', top: { xs: 12, sm: 16 }, right: { xs: 12, sm: 16 }, zIndex: 100 }}
        >
          {isProcessNode && (
            <Stack direction="row" spacing={1}>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
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
                  {loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <Iconify icon="eva:cloud-upload-fill" width={20} />
                  )}
                </IconButton>
              </Tooltip>

              <Tooltip title="Descargar Plantilla">
                <IconButton
                  onClick={handleDownloadTemplate}
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
            </Stack>
          )}
          <Button
            variant="contained"
            color="primary"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => {
              if (isLessonsLearnedNode) {
                setIsLessonLearned(isLessonsLearnedNode);
                setEditMode(false);
                setEditFeedbackId(undefined);
                setEditFeedbackInitialData(null);
                setLessonProposalOpen(true);
              } else if (isProposalsNode) {
                setIsLessonLearned(false);
                setEditMode(false);
                setEditFeedbackId(undefined);
                setEditFeedbackInitialData(null);
                setLessonProposalOpen(true);
              } else {
                setEditingRelation(null);
                const kind = isProcessNode
                  ? 'process'
                  : isDocumentNode
                    ? 'document'
                    : isSystemNode
                      ? 'system'
                      : isIndicatorNode
                        ? 'indicator'
                        : isDataNode
                          ? 'data'
                          : isTechnologyNode
                            ? 'technology'
                            : isRelationNode
                              ? 'relation'
                              : isNextJobNode
                                ? 'nextJob'
                                : 'process';
                setRelationKind(kind);
                setRelationOpen(true);
              }
            }}
            sx={{ borderRadius: 2, boxShadow: 4 }}
          >
            {relateLabel}
          </Button>
        </Stack>
      )}

      <Box sx={{ width: '100%', height: 850, position: 'relative' }}>
        {loading ? (
          <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Stack alignItems="center" spacing={2}>
              <CircularProgress size={56} thickness={4} />
              <Typography variant="body2" color="text.secondary">{t('positions.map.loadingDetail')}</Typography>
            </Stack>
          </Box>
        ) : (
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
                return String((node.data as any)?.color || theme.palette.grey[400]);
              }}
              maskColor={alpha(theme.palette.background.paper, 0.8)}
            />
          </ReactFlow>
        )}
      </Box>

      <JobsRelationsDrawer
        open={relationOpen}
        onClose={() => {
          setRelationOpen(false);
          setEditingRelation(null);
        }}
        onSuccess={() => setReloadKey((k) => k + 1)}
        jobId={Number(jobId)}
        kind={relationKind}
        initialData={editingRelation}
        existingItemIds={existingItemIds}
      />

      <JobsLessonsProposalsDrawer
        open={lessonProposalOpen}
        onClose={() => {
          setLessonProposalOpen(false);
          setEditMode(false);
          setEditFeedbackId(undefined);
          setEditFeedbackInitialData(null);
        }}
        onSuccess={() => setReloadKey((k) => k + 1)}
        jobId={jobId}
        isLessonLearned={isLessonLearned}
        editMode={editMode}
        initialData={editFeedbackInitialData ?? undefined}
        feedbackId={editFeedbackId}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setDeleteTarget(null);
        }}
        title={t('positions.table.actions.delete', { defaultValue: 'Eliminar' })}
        content={t('positions.table.messages.deleteConfirm', { defaultValue: '¿Estás seguro de que quieres eliminar este elemento?' })}
        action={
          <Button variant="contained" color="error" onClick={handleDeleteConfirmed}>
            {t('positions.table.actions.delete', { defaultValue: 'Eliminar' })}
          </Button>
        }
      />
    </Card>
  );
}
