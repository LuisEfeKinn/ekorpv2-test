'use client';

import '@xyflow/react/dist/style.css';

import type { Node, Edge, NodeProps } from '@xyflow/react';
import type { Theme, SxProps } from '@mui/material/styles';

import {
  useMemo,
  Fragment,
  useState,
  useEffect,
  useCallback,
} from 'react';
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
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import { alpha, useTheme } from '@mui/material/styles';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';
import DialogContentText from '@mui/material/DialogContentText';

import axios from 'src/utils/axios';

import { useTranslate } from 'src/locales';
import {
  DeleteDataTableMapNodeService,
  GetDataTableMapByIdExpandService,
} from 'src/services/architecture/data/dataMap.service';
import {
  type JobDataRelation,
  GetJobDataRelationsService,
  DeleteJobDataRelationService,
} from 'src/services/architecture/data/jobData.service';
import {
  type SystemDataRelation,
  GetSystemDataRelationsService,
  DeleteSystemDataRelationService,
} from 'src/services/architecture/data/systemData.service';
import {
  type DataProcessRelation,
  GetDataProcessRelationsService,
  DeleteDataProcessRelationService,
} from 'src/services/architecture/data/dataProcess.service';
import {
  type DataDocumentRelation,
  GetDataDocumentRelationsService,
  DeleteDataDocumentRelationService,
} from 'src/services/architecture/data/dataDocuments.service';
import {
  type DataIndicatorRelation,
  GetDataIndicatorRelationsService,
  DeleteDataIndicatorRelationService,
} from 'src/services/architecture/data/dataIndicator.service';
import {
  type TechnologyDataRelation,
  GetTechnologyDataRelationsService,
  DeleteTechnologyDataRelationService,
} from 'src/services/architecture/data/technologyData.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { DataAuditDrawer } from './data-audit-drawer';
import { DataJobDataDrawer } from './data-job-data-drawer';
import { DataSystemDataDrawer } from './data-system-data-drawer';
import { DataProcessDataDrawer } from './data-process-data-drawer';
import { DataIndicatorDataDrawer } from './data-indicator-data-drawer';
import { DataDocumentsDataDrawer } from './data-documents-data-drawer';
import { DataTechnologyDataDrawer } from './data-technology-data-drawer';
import { DataTableNodeCreateModal } from './data-table-node-create-modal';

// ----------------------------------------------------------------------

type ChildNode = {
  id: string;
  label: string;
  data?: unknown;
  children?: ChildNode[];
};

type MapData = {
  id: number | string;
  label: string;
  data?: unknown;
  children: ChildNode[];
};

type DataTableExpandedDiagramProps = {
  dataId: string;
  nodeId: string;
  nodeLabel: string;
  dataLabel?: string;
  onBack: () => void;
  onNavigateToChild?: (child: ChildNode) => void;
  path?: Array<{ id: string; label: string }>;
  onNavigateToPathIndex?: (index: number) => void;
  sx?: SxProps<Theme>;
};

type CentralNodeData = { label: string; appId: number | string };
type ChildNodeData = {
  color: string;
  label: string;
  id: string;
  onClick?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
};

function isCentralNodeData(value: unknown): value is CentralNodeData {
  if (!value || typeof value !== 'object') return false;
  const rec = value as Record<string, unknown>;
  return (
    (typeof rec.label === 'string' || typeof rec.label === 'number') &&
    (typeof rec.appId === 'string' || typeof rec.appId === 'number')
  );
}

function isChildNodeData(value: unknown): value is ChildNodeData {
  if (!value || typeof value !== 'object') return false;
  const rec = value as Record<string, unknown>;
  return typeof rec.color === 'string' && typeof rec.label === 'string' && typeof rec.id === 'string';
}

function CentralNode({ data }: NodeProps) {
  const { t } = useTranslate('architecture');
  const theme = useTheme();
  const safeData: CentralNodeData = isCentralNodeData(data) ? data : { label: '-', appId: '-' };

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
      <Handle type="source" position={Position.Top} style={{ opacity: 0, width: 0, height: 0, border: 'none', background: 'transparent', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
      <Stack spacing={1.5} alignItems="center">
        <Chip label={`ID: ${safeData.appId}`} size="small" sx={{ bgcolor: alpha(theme.palette.common.white, 0.25), color: 'common.white', fontWeight: 700, fontSize: '0.75rem', height: 24, backdropFilter: 'blur(10px)' }} />
        <Typography variant="h5" sx={{ color: 'common.white', fontWeight: 800, textAlign: 'center', textShadow: `0 3px 12px ${alpha(theme.palette.common.black, 0.4)}`, letterSpacing: '-0.5px', lineHeight: 1.3 }}>
          {safeData.label}
        </Typography>
        <Typography variant="caption" sx={{ color: alpha(theme.palette.common.white, 0.85), fontWeight: 600, fontSize: '0.7rem' }}>
          {t('data.map.diagram.systemTitle')}
        </Typography>
      </Stack>
    </Paper>
  );
}

function ChildNodeWithDelete({ data }: NodeProps) {
  const theme = useTheme();
  const safeData: ChildNodeData = isChildNodeData(data) ? data : { color: theme.palette.grey[400], label: '-', id: '-' };
  const { color, label, id, onClick, onDelete, onEdit } = safeData;

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
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px) scale(1.03)',
          boxShadow: `0 8px 32px ${alpha(color, 0.35)}`,
          borderColor: color,
          '& .edit-button': { opacity: 1, transform: 'scale(1)' },
          '& .delete-button': { opacity: 1, transform: 'scale(1)' },
        },
        '&:active': { transform: 'scale(0.98)' },
        '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.6)})`, boxShadow: `0 2px 8px ${alpha(color, 0.3)}` },
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0, width: 0, height: 0, border: 'none', background: 'transparent', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />

      {onEdit ? (
        <IconButton
          className="edit-button"
          size="small"
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          sx={{ position: 'absolute', top: 8, left: 8, opacity: 0, transform: 'scale(0.8)', transition: 'all 0.2s ease', bgcolor: alpha(theme.palette.primary.main, 0.9), color: 'white', width: 28, height: 28, '&:hover': { bgcolor: theme.palette.primary.main, transform: 'scale(1.1)' }, zIndex: 10 }}
        >
          <Iconify icon="solar:pen-bold" width={16} />
        </IconButton>
      ) : null}

      <IconButton
        className="delete-button"
        size="small"
        onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
        sx={{ position: 'absolute', top: 8, right: 8, opacity: 0, transform: 'scale(0.8)', transition: 'all 0.2s ease', bgcolor: alpha(theme.palette.error.main, 0.9), color: 'white', width: 28, height: 28, '&:hover': { bgcolor: theme.palette.error.main, transform: 'scale(1.1)' }, zIndex: 10 }}
      >
        <Iconify icon="solar:trash-bin-trash-bold" width={16} />
      </IconButton>

      <Box onClick={onClick}>
        <Stack spacing={1.5} alignItems="center">
          <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: alpha(color, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${alpha(color, 0.2)}`, transition: 'all 0.3s ease' }}>
            <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: color, boxShadow: `0 3px 12px ${alpha(color, 0.5)}` }} />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, textAlign: 'center', color: 'text.primary', fontSize: '0.95rem', letterSpacing: '-0.2px', lineHeight: 1.2 }}>
            {label}
          </Typography>
          <Chip label={id} size="small" sx={{ bgcolor: alpha(color, 0.1), color, fontWeight: 600, fontSize: '0.72rem', height: 22, border: `1px solid ${alpha(color, 0.2)}` }} />
        </Stack>
      </Box>
    </Paper>
  );
}

const nodeTypes = { central: CentralNode, child: ChildNodeWithDelete };

// ----------------------------------------------------------------------

export function DataTableExpandedDiagram({
  dataId,
  nodeId,
  nodeLabel,
  dataLabel,
  onBack,
  onNavigateToChild,
  path,
  onNavigateToPathIndex,
  sx,
}: DataTableExpandedDiagramProps) {
  const { t } = useTranslate('architecture');
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [openCreateModal, setOpenCreateModal] = useState(false);

  // Drawer states
  const [jobDataOpen, setJobDataOpen] = useState(false);
  const [jobDataRelationId, setJobDataRelationId] = useState<number | null>(null);
  const [processDataOpen, setProcessDataOpen] = useState(false);
  const [processDataRelationId, setProcessDataRelationId] = useState<number | null>(null);
  const [systemDataOpen, setSystemDataOpen] = useState(false);
  const [systemDataRelationId, setSystemDataRelationId] = useState<number | null>(null);
  const [technologyDataOpen, setTechnologyDataOpen] = useState(false);
  const [technologyDataRelationId, setTechnologyDataRelationId] = useState<number | null>(null);
  const [indicatorDataOpen, setIndicatorDataOpen] = useState(false);
  const [indicatorDataRelationId, setIndicatorDataRelationId] = useState<number | null>(null);
  const [documentsDataOpen, setDocumentsDataOpen] = useState(false);
  const [documentsDataRelationId, setDocumentsDataRelationId] = useState<number | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditId, setAuditId] = useState<number | null>(null);

  const [existingEntityIds, setExistingEntityIds] = useState<number[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; nodeId: string | null }>({ open: false, nodeId: null });
  const [deleting, setDeleting] = useState(false);

  const isJobsModule = useMemo(() => {
    const id = String(nodeId ?? '').toLowerCase();
    return id === 'jobs' || id === 'job' || id === 'cargos' || id === 'cargo' || id.includes('job') || id.includes('cargo');
  }, [nodeId]);

  const isProcessModule = useMemo(() => {
    const id = String(nodeId ?? '').toLowerCase();
    return id === 'process' || id === 'processes' || id === 'proceso' || id === 'procesos' || id.includes('process') || id.includes('proceso');
  }, [nodeId]);

  const isSystemsModule = useMemo(() => {
    const id = String(nodeId ?? '').toLowerCase();
    return id === 'systems' || id === 'system' || id === 'sistemas' || id === 'sistema' || id.includes('system') || id.includes('sistema');
  }, [nodeId]);

  const isTechnologyModule = useMemo(() => {
    const id = String(nodeId ?? '').toLowerCase();
    return id === 'technology' || id === 'technologies' || id === 'tecnologia' || id === 'tecnologias' || id.includes('technolog') || id.includes('tecnolog');
  }, [nodeId]);

  const isIndicatorsModule = useMemo(() => {
    const id = String(nodeId ?? '').toLowerCase();
    return id === 'indicators' || id === 'indicator' || id === 'indicadores' || id === 'indicador' || id.includes('indicator') || id.includes('indicador');
  }, [nodeId]);

  const isDocumentsModule = useMemo(() => {
    const id = String(nodeId ?? '').toLowerCase();
    return id === 'documents' || id === 'document' || id === 'documentos' || id === 'documento' || id.includes('document');
  }, [nodeId]);

  const isAuditsModule = useMemo(() => {
    const id = String(nodeId ?? '').toLowerCase();
    return id === 'audits' || id === 'audit' || id === 'auditorias' || id === 'auditoria' || id.includes('audit') || id.includes('auditor');
  }, [nodeId]);

  const isRelationModule = useMemo(() =>
    isJobsModule || isProcessModule || isSystemsModule || isTechnologyModule || isIndicatorsModule || isDocumentsModule || isAuditsModule,
    [isJobsModule, isProcessModule, isSystemsModule, isTechnologyModule, isIndicatorsModule, isDocumentsModule, isAuditsModule]
  );

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
      const entityId = Number(dataId);

      if (isJobsModule) {
        const res = await GetJobDataRelationsService();
        const raw = (res as { data?: unknown })?.data;
        const list: JobDataRelation[] = Array.isArray(raw) ? raw : Array.isArray((raw as any)?.[0]) ? (raw as any)[0] : [];
        const filtered = list.filter((r) => Number(r?.data?.id) === entityId);
        setExistingEntityIds(filtered.map((r) => Number(r.job?.id)).filter((n) => Number.isFinite(n)));
        setMapData({ id: nodeId, label: nodeLabel, children: filtered.map((r) => ({ id: String(r.id), label: r.job?.name ?? `#${r.job?.id ?? r.id}` })) });
        return;
      }

      if (isProcessModule) {
        const res = await GetDataProcessRelationsService();
        const raw = (res as { data?: unknown })?.data;
        const list: DataProcessRelation[] = Array.isArray(raw) ? raw : Array.isArray((raw as any)?.[0]) ? (raw as any)[0] : [];
        const filtered = list.filter((r) => Number(r?.data?.id) === entityId);
        setExistingEntityIds(filtered.map((r) => Number(r.process?.id)).filter((n) => Number.isFinite(n)));
        setMapData({ id: nodeId, label: nodeLabel, children: filtered.map((r) => ({ id: String(r.id), label: r.process?.name ?? `#${r.process?.id ?? r.id}` })) });
        return;
      }

      if (isSystemsModule) {
        const res = await GetSystemDataRelationsService();
        const raw = (res as { data?: unknown })?.data;
        const list: SystemDataRelation[] = Array.isArray(raw) ? raw : Array.isArray((raw as any)?.[0]) ? (raw as any)[0] : [];
        const filtered = list.filter((r) => Number(r?.data?.id ?? (r as any)?.dataId ?? (r as any)?.data_id) === entityId);
        setExistingEntityIds(filtered.map((r) => Number(r.system?.id)).filter((n) => Number.isFinite(n)));
        setMapData({ id: nodeId, label: nodeLabel, children: filtered.map((r) => ({ id: String(r.id), label: r.system?.name ?? `#${r.system?.id ?? r.id}` })) });
        return;
      }

      if (isTechnologyModule) {
        const res = await GetTechnologyDataRelationsService();
        const raw = (res as { data?: unknown })?.data;
        const list: TechnologyDataRelation[] = Array.isArray(raw) ? raw : Array.isArray((raw as any)?.[0]) ? (raw as any)[0] : [];
        const filtered = list.filter((r) => Number(r?.data?.id ?? (r as any)?.dataId) === entityId);
        setExistingEntityIds(filtered.map((r) => Number(r.technology?.id)).filter((n) => Number.isFinite(n)));
        setMapData({ id: nodeId, label: nodeLabel, children: filtered.map((r) => ({ id: String(r.id), label: r.technology?.name ?? `#${r.technology?.id ?? r.id}` })) });
        return;
      }

      if (isIndicatorsModule) {
        const res = await GetDataIndicatorRelationsService();
        const raw = (res as { data?: unknown })?.data;
        const list: DataIndicatorRelation[] = Array.isArray(raw) ? raw : Array.isArray((raw as any)?.[0]) ? (raw as any)[0] : [];
        const filtered = list.filter((r) => Number(r?.data?.id) === entityId);
        setExistingEntityIds(filtered.map((r) => Number(r.indicator?.id)).filter((n) => Number.isFinite(n)));
        setMapData({ id: nodeId, label: nodeLabel, children: filtered.map((r) => ({ id: String(r.id), label: r.indicator?.indicatorName ?? r.indicator?.name ?? `#${r.indicator?.id ?? r.id}` })) });
        return;
      }

      if (isDocumentsModule) {
        const res = await GetDataDocumentRelationsService();
        const raw = (res as { data?: unknown })?.data;
        const list: DataDocumentRelation[] = Array.isArray(raw) ? raw : Array.isArray((raw as any)?.[0]) ? (raw as any)[0] : [];
        const filtered = list.filter((r) => Number(r?.data?.id) === entityId);
        setExistingEntityIds(filtered.map((r) => Number(r.document?.id)).filter((n) => Number.isFinite(n)));
        setMapData({ id: nodeId, label: nodeLabel, children: filtered.map((r) => ({ id: String(r.id), label: r.document?.name ?? `#${r.document?.id ?? r.id}` })) });
        return;
      }

      if (isAuditsModule) {
        const res = await axios.get(`/api/audits?dataId=${encodeURIComponent(String(entityId))}`);
        const raw = (res as { data?: unknown })?.data;
        const list: any[] = Array.isArray(raw) ? raw : Array.isArray((raw as any)?.data) ? (raw as any).data : Array.isArray((raw as any)?.[0]) ? (raw as any)[0] : [];
        setMapData({ id: nodeId, label: nodeLabel, children: list.map((r) => ({ id: String(r.id), label: r.type ? `${r.type}${r.date ? ` (${String(r.date).split('T')[0]})` : ''}` : `#${r.id}` })) });
        return;
      }

      const response = await GetDataTableMapByIdExpandService(dataId, nodeId);
      setMapData(response.data);
    } catch (error) {
      console.error('Error loading expanded data:', error);
      toast.error(t('data.map.messages.error.loadMapError'));
    } finally {
      setLoading(false);
    }
  }, [dataId, isJobsModule, isProcessModule, isSystemsModule, isTechnologyModule, isIndicatorsModule, isDocumentsModule, isAuditsModule, nodeId, nodeLabel, t]);

  const generateNodesAndEdges = useCallback((data: MapData) => {
    const radius = 400;
    const angleStep = (2 * Math.PI) / data.children.length;
    const centerX = 0;
    const centerY = 0;

    const centralNode: Node = {
      id: 'central',
      type: 'central',
      position: { x: centerX - 140, y: centerY - 80 },
      data: { label: data.label, appId: data.id },
      draggable: true,
    };

    const childNodes: Node[] = data.children.map((child: ChildNode, index: number) => {
      const rawChildId = String(child.id ?? '').trim();
      const safeChildId = rawChildId.length > 0 ? rawChildId : `child-${index}`;
      const angle = index * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius - 90;
      const y = centerY + Math.sin(angle) * radius - 90;
      const color = colors[index % colors.length];

      const handleEditRelation = () => {
        const relationId = Number(rawChildId);
        if (!Number.isFinite(relationId)) return;
        if (isJobsModule) { setJobDataRelationId(relationId); setJobDataOpen(true); return; }
        if (isProcessModule) { setProcessDataRelationId(relationId); setProcessDataOpen(true); return; }
        if (isSystemsModule) { setSystemDataRelationId(relationId); setSystemDataOpen(true); return; }
        if (isTechnologyModule) { setTechnologyDataRelationId(relationId); setTechnologyDataOpen(true); return; }
        if (isIndicatorsModule) { setIndicatorDataRelationId(relationId); setIndicatorDataOpen(true); return; }
        if (isDocumentsModule) { setDocumentsDataRelationId(relationId); setDocumentsDataOpen(true); return; }
        if (isAuditsModule) { setAuditId(relationId); setAuditOpen(true); }
      };

      return {
        id: safeChildId,
        type: 'child',
        position: { x, y },
        data: {
          label: child.label,
          id: rawChildId.length > 0 ? rawChildId : safeChildId,
          color,
          onClick: isRelationModule ? handleEditRelation : () => { if (rawChildId.length === 0) return; onNavigateToChild?.(child); },
          onEdit: isRelationModule ? handleEditRelation : undefined,
          onDelete: () => { if (rawChildId.length === 0) return; setDeleteDialog({ open: true, nodeId: rawChildId }); },
        },
        draggable: true,
      };
    });

    const newEdges: Edge[] = data.children.map((child: ChildNode, index: number) => {
      const rawChildId = String(child.id ?? '').trim();
      const safeChildId = rawChildId.length > 0 ? rawChildId : `child-${index}`;
      const color = colors[index % colors.length];
      return { id: `central-${safeChildId}`, source: 'central', target: safeChildId, type: 'straight', animated: true, style: { stroke: alpha(color, 0.5), strokeWidth: 3 }, markerEnd: { type: 'arrowclosed' as const, color: alpha(color, 0.5) } };
    });

    setNodes([centralNode, ...childNodes]);
    setEdges(newEdges);
  }, [colors, isJobsModule, isProcessModule, isSystemsModule, isTechnologyModule, isIndicatorsModule, isDocumentsModule, isAuditsModule, isRelationModule, onNavigateToChild, setEdges, setNodes]);

  const handleDeleteNode = async () => {
    if (!deleteDialog.nodeId) return;
    try {
      setDeleting(true);
      if (isJobsModule) { await DeleteJobDataRelationService(deleteDialog.nodeId); toast.success(t('data.map.jobData.messages.deleted')); }
      else if (isProcessModule) { await DeleteDataProcessRelationService(deleteDialog.nodeId); toast.success(t('data.map.processData.messages.deleted')); }
      else if (isSystemsModule) { await DeleteSystemDataRelationService(deleteDialog.nodeId); toast.success(t('data.map.systemData.messages.deleted')); }
      else if (isTechnologyModule) { await DeleteTechnologyDataRelationService(deleteDialog.nodeId); toast.success(t('data.map.technologyData.messages.deleted')); }
      else if (isIndicatorsModule) { await DeleteDataIndicatorRelationService(deleteDialog.nodeId); toast.success(t('data.map.indicatorData.messages.deleted')); }
      else if (isDocumentsModule) { await DeleteDataDocumentRelationService(deleteDialog.nodeId); toast.success(t('data.map.documentsData.messages.deleted')); }
      else if (isAuditsModule) { await axios.delete(`/api/audits/${encodeURIComponent(String(deleteDialog.nodeId))}`); toast.success(t('data.map.audits.messages.deleted')); }
      else { await DeleteDataTableMapNodeService(dataId, deleteDialog.nodeId); toast.success(t('data.table.messages.success.deleted')); }
      setDeleteDialog({ open: false, nodeId: null });
      await fetchExpandedData();
    } catch (error) {
      console.error('Error deleting node:', error);
      toast.error(t('data.table.messages.error.deleting'));
    } finally {
      setDeleting(false);
    }
  };

  const handleAddClick = () => {
    if (isJobsModule) { setJobDataRelationId(null); setJobDataOpen(true); return; }
    if (isProcessModule) { setProcessDataRelationId(null); setProcessDataOpen(true); return; }
    if (isSystemsModule) { setSystemDataRelationId(null); setSystemDataOpen(true); return; }
    if (isTechnologyModule) { setTechnologyDataRelationId(null); setTechnologyDataOpen(true); return; }
    if (isIndicatorsModule) { setIndicatorDataRelationId(null); setIndicatorDataOpen(true); return; }
    if (isDocumentsModule) { setDocumentsDataRelationId(null); setDocumentsDataOpen(true); return; }
    if (isAuditsModule) { setAuditId(null); setAuditOpen(true); return; }
    setOpenCreateModal(true);
  };

  useEffect(() => { fetchExpandedData(); }, [fetchExpandedData]);
  useEffect(() => { if (mapData) generateNodesAndEdges(mapData); }, [mapData, generateNodesAndEdges]);

  const breadcrumbNav = (
    <Paper elevation={4} sx={{ px: 2, py: 1, borderRadius: 2, bgcolor: alpha(theme.palette.background.paper, 0.95), backdropFilter: 'blur(10px)', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Tooltip title={t('data.map.diagram.subDiagram.buttonBack')}>
          <IconButton size="small" onClick={onBack} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.16) } }}>
            <Iconify icon="eva:arrow-ios-back-fill" width={18} />
          </IconButton>
        </Tooltip>
        {path && path.length > 0 ? (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>{t('data.map.diagram.subDiagram.home')}</Typography>
            {path.map((p, index, arr) => (
              <Fragment key={`${p.id}-${index}`}>
                <Iconify icon="eva:arrow-ios-forward-fill" width={16} sx={{ color: 'text.disabled' }} />
                {index < arr.length - 1 && onNavigateToPathIndex ? (
                  <Button variant="text" size="small" onClick={() => onNavigateToPathIndex(index)} sx={{ minWidth: 0, p: 0, lineHeight: 1, textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', '&:hover': { bgcolor: 'transparent', color: 'text.primary' } }}>
                    {p.label}
                  </Button>
                ) : (
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>{p.label}</Typography>
                )}
              </Fragment>
            ))}
          </Stack>
        ) : (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>{t('data.map.diagram.subDiagram.home')}</Typography>
            <Iconify icon="eva:arrow-ios-forward-fill" width={16} sx={{ color: 'text.disabled' }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>{nodeLabel}</Typography>
          </Stack>
        )}
      </Stack>
    </Paper>
  );

  const addButton = (
    <Button variant="contained" color="primary" startIcon={<Iconify icon="solar:add-circle-bold" />} onClick={handleAddClick} sx={{ borderRadius: 2, boxShadow: 4 }}>
      {t('data.table.actions.add')}
    </Button>
  );

  const drawers = (
    <>
      {!isRelationModule && (
        <DataTableNodeCreateModal open={openCreateModal} onClose={() => setOpenCreateModal(false)} onSuccess={fetchExpandedData} dataId={dataId} parentNodeId={nodeId} />
      )}
      <DataJobDataDrawer open={jobDataOpen} onClose={() => { setJobDataOpen(false); setJobDataRelationId(null); }} onSuccess={fetchExpandedData} dataId={Number(dataId)} dataLabel={dataLabel} relationId={jobDataRelationId} excludeIds={existingEntityIds} />
      <DataProcessDataDrawer open={processDataOpen} onClose={() => { setProcessDataOpen(false); setProcessDataRelationId(null); }} onSuccess={fetchExpandedData} dataId={Number(dataId)} dataLabel={dataLabel} relationId={processDataRelationId} excludeIds={existingEntityIds} />
      <DataSystemDataDrawer open={systemDataOpen} onClose={() => { setSystemDataOpen(false); setSystemDataRelationId(null); }} onSuccess={fetchExpandedData} dataId={Number(dataId)} dataLabel={dataLabel} relationId={systemDataRelationId} excludeIds={existingEntityIds} />
      <DataTechnologyDataDrawer open={technologyDataOpen} onClose={() => { setTechnologyDataOpen(false); setTechnologyDataRelationId(null); }} onSuccess={fetchExpandedData} dataId={Number(dataId)} dataLabel={dataLabel} relationId={technologyDataRelationId} excludeIds={existingEntityIds} />
      <DataIndicatorDataDrawer open={indicatorDataOpen} onClose={() => { setIndicatorDataOpen(false); setIndicatorDataRelationId(null); }} onSuccess={fetchExpandedData} dataId={Number(dataId)} dataLabel={dataLabel} relationId={indicatorDataRelationId} excludeIds={existingEntityIds} />
      <DataDocumentsDataDrawer open={documentsDataOpen} onClose={() => { setDocumentsDataOpen(false); setDocumentsDataRelationId(null); }} onSuccess={fetchExpandedData} dataId={Number(dataId)} dataLabel={dataLabel} relationId={documentsDataRelationId} excludeIds={existingEntityIds} />
      <DataAuditDrawer open={auditOpen} onClose={() => { setAuditOpen(false); setAuditId(null); }} onSuccess={fetchExpandedData} dataId={Number(dataId)} dataLabel={dataLabel} auditId={auditId} />
      <Dialog open={deleteDialog.open} onClose={() => !deleting && setDeleteDialog({ open: false, nodeId: null })} maxWidth="xs" fullWidth>
        <DialogTitle>{t('data.table.dialogs.delete.title')}</DialogTitle>
        <DialogContent><DialogContentText>{t('data.table.dialogs.delete.content')}</DialogContentText></DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="outlined" color="inherit" onClick={() => setDeleteDialog({ open: false, nodeId: null })} disabled={deleting}>{t('data.table.actions.cancel')}</Button>
          <Button variant="contained" color="error" onClick={handleDeleteNode} disabled={deleting} startIcon={deleting ? <CircularProgress size={20} color="inherit" /> : <Iconify icon="solar:trash-bin-trash-bold" />}>{t('data.table.dialogs.delete.confirm')}</Button>
        </DialogActions>
      </Dialog>
    </>
  );

  if (loading) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 600 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="body2" color="text.secondary">{t('data.map.diagram.loadingMap')}</Typography>
        </Stack>
      </Box>
    );
  }

  if (!mapData) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 600 }}>
        <Typography variant="body1" color="text.secondary">{t('data.map.diagram.noData')}</Typography>
      </Box>
    );
  }

  if (mapData.children.length === 0) {
    return (
      <Card sx={{ width: '100%', position: 'relative', overflow: 'hidden', bgcolor: 'background.neutral', ...sx }}>
        <Box sx={{ position: 'absolute', top: { xs: 12, sm: 16 }, left: { xs: 12, sm: 16 }, zIndex: 100 }}>{breadcrumbNav}</Box>
        <Box sx={{ position: 'absolute', top: { xs: 12, sm: 16 }, right: { xs: 12, sm: 16 }, zIndex: 100 }}>{addButton}</Box>
        <Box sx={{ width: '100%', height: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Stack alignItems="center" spacing={3}>
            <Box sx={{ width: 120, height: 120, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Iconify icon="solar:inbox-in-bold" width={60} sx={{ color: alpha(theme.palette.primary.main, 0.5) }} />
            </Box>
            <Stack spacing={1} alignItems="center">
              <Typography variant="h6" color="text.primary">{mapData.label}</Typography>
              <Typography variant="body2" color="text.secondary">{t('data.map.diagram.subDiagram.noRelations')}</Typography>
            </Stack>
          </Stack>
        </Box>
        {drawers}
      </Card>
    );
  }

  return (
    <Card sx={{ width: '100%', position: 'relative', overflow: 'hidden', bgcolor: 'background.neutral', ...sx }}>
      <Box sx={{ position: 'absolute', top: { xs: 12, sm: 16 }, left: { xs: 12, sm: 16 }, zIndex: 100 }}>{breadcrumbNav}</Box>
      <Box sx={{ position: 'absolute', top: { xs: 12, sm: 16 }, right: { xs: 12, sm: 16 }, zIndex: 100 }}>{addButton}</Box>

      <Box sx={{ width: '100%', height: 850, position: 'relative' }}>
        <Box sx={{ position: 'absolute', top: { xs: 60, sm: 68 }, left: { xs: 12, sm: 16 }, zIndex: 100, pointerEvents: 'none' }}>
          <Paper elevation={2} sx={{ px: { xs: 1.5, sm: 2 }, py: { xs: 1, sm: 1.25 }, borderRadius: 1.5, bgcolor: alpha(theme.palette.background.paper, 0.9), backdropFilter: 'blur(8px)', border: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: { xs: 6, sm: 8 }, height: { xs: 6, sm: 8 }, borderRadius: '50%', bgcolor: theme.palette.success.main, animation: 'blink 2s ease-in-out infinite', '@keyframes blink': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.3 } } }} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>{mapData.children.length} {t('data.map.diagram.conectedModules')}</Typography>
            </Stack>
          </Paper>
        </Box>

        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.3, maxZoom: 1, duration: 800 }} minZoom={0.3} maxZoom={1.2} panOnScroll={false} panOnDrag={[1, 2]} selectionOnDrag={false} panActivationKeyCode="Space" zoomOnScroll zoomOnPinch zoomOnDoubleClick={false} preventScrolling={false} defaultEdgeOptions={{ type: 'straight', animated: true }} proOptions={{ hideAttribution: true }}>
          <Background color={alpha(theme.palette.primary.main, 0.08)} gap={24} size={2} variant={BackgroundVariant.Dots} />
          <Controls showInteractive={false} />
          <MiniMap nodeColor={(node) => { if (node.type === 'central') return theme.palette.primary.main; if (node.data && typeof node.data === 'object' && 'color' in node.data) { const c = (node.data as { color?: unknown }).color; if (typeof c === 'string') return c; } return theme.palette.grey[400]; }} maskColor={alpha(theme.palette.background.paper, 0.8)} />
        </ReactFlow>
      </Box>

      {drawers}
    </Card>
  );
}
