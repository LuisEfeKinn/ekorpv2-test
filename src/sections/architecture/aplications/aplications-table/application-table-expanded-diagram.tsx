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
  DeleteApplicationTableMapNodeService,
  GetApplicationTableMapByIdExpandService
} from 'src/services/architecture/applications/applicationMap.service';
import {
  type SystemDataRelation,
  GetSystemDataRelationsService,
  DeleteSystemDataRelationService,
} from 'src/services/architecture/data/systemData.service';
import {
  type JobSystemRelation,
  GetJobSystemRelationsService,
  DeleteJobSystemRelationService,
} from 'src/services/architecture/business/jobRelations.service';
import {
  type SystemProcessRelation,
  DeleteSystemProcessService,
  GetSystemProcessRelationsService,
} from 'src/services/architecture/process/processRelations.service';
import {
  type SystemDocumentRelation,
  GetSystemDocumentRelationsService,
  DeleteSystemDocumentRelationService,
} from 'src/services/architecture/documents/systemDocuments.service';
import {
  type SystemIndicatorRelation,
  GetSystemIndicatorRelationsService,
  DeleteSystemIndicatorRelationService,
} from 'src/services/architecture/indicators/systemIndicators.service';
import {
  type SystemTechnologyRelation,
  GetSystemTechnologyRelationsService,
  DeleteSystemTechnologyRelationService,
} from 'src/services/architecture/infrastructure/systemTechnologies.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { ApplicationJobSystemsDrawer } from './application-job-systems-drawer';
import { ApplicationSystemDataDrawer } from './application-system-data-drawer';
import { ApplicationSystemAuditsDrawer } from './application-system-audits-drawer';
import { ApplicationTableNodeCreateModal } from './application-table-node-create-modal';
import { ApplicationSystemProcessesDrawer } from './application-system-processes-drawer';
import { ApplicationSystemDocumentsDrawer } from './application-system-documents-drawer';
import { ApplicationSystemIndicatorsDrawer } from './application-system-indicators-drawer';
import { ApplicationSystemTechnologiesDrawer } from './application-system-technologies-drawer';

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
  applicationId: string;
  nodeId: string;
  nodeLabel: string;
  systemLabel?: string;
  onBack: () => void;
  onNavigateToChild?: (child: ChildNode) => void;
  path?: Array<{ id: string; label: string }>;
  onNavigateToPathIndex?: (index: number) => void;
  sx?: SxProps<Theme>;
};

// Custom Node Components
type CentralNodeData = { label: string; appId: number | string };

type ChildNodeData = {
  color: string;
  label: string;
  id: string;
  onClick?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  editButtonCorner?: 'top-left' | 'top-right';
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
        '&:active': {
          cursor: 'grabbing',
        },
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
          label={`ID: ${safeData.appId}`}
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
          {safeData.label}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: alpha(theme.palette.common.white, 0.85),
            fontWeight: 600,
            fontSize: '0.7rem',
          }}
        >
          {t('application.map.diagram.systemTitle')}
        </Typography>
      </Stack>
    </Paper>
  );
}

function ChildNodeWithDelete({ data }: NodeProps) {
  const theme = useTheme();
  const safeData: ChildNodeData = isChildNodeData(data)
    ? data
    : { color: theme.palette.grey[400], label: '-', id: '-' };
  const { color, label, id, onClick, onDelete, onEdit } = safeData;
  const editCorner = safeData.editButtonCorner ?? 'top-left';
  const editButtonPlacement =
    editCorner === 'top-left'
      ? ({ left: 8, right: 'auto' } as const)
      : ({ right: 44, left: 'auto' } as const);

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
          '& .edit-button': {
            opacity: 1,
            transform: 'scale(1)',
          },
          '& .delete-button': {
            opacity: 1,
            transform: 'scale(1)',
          },
        },
        '&:active': {
          transform: 'scale(0.98)',
        },
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

      {onEdit ? (
        <IconButton
          className="edit-button"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          sx={{
            position: 'absolute',
            top: 8,
            ...editButtonPlacement,
            opacity: 0,
            transform: 'scale(0.8)',
            transition: 'all 0.2s ease',
            bgcolor: alpha(theme.palette.primary.main, 0.9),
            color: 'white',
            width: 28,
            height: 28,
            '&:hover': {
              bgcolor: theme.palette.primary.main,
              transform: 'scale(1.1)',
            },
            zIndex: 10,
          }}
        >
          <Iconify icon="solar:pen-bold" width={16} />
        </IconButton>
      ) : null}

      {/* Botón de eliminar */}
      <IconButton
        className="delete-button"
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.();
        }}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          opacity: 0,
          transform: 'scale(0.8)',
          transition: 'all 0.2s ease',
          bgcolor: alpha(theme.palette.error.main, 0.9),
          color: 'white',
          width: 28,
          height: 28,
          '&:hover': {
            bgcolor: theme.palette.error.main,
            transform: 'scale(1.1)',
          },
          zIndex: 10,
        }}
      >
        <Iconify icon="solar:trash-bin-trash-bold" width={16} />
      </IconButton>

      <Box onClick={onClick}>
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
          <Chip
            label={id}
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
      </Box>
    </Paper>
  );
}

const nodeTypes = {
  central: CentralNode,
  child: ChildNodeWithDelete,
};

// ----------------------------------------------------------------------

export function ApplicationTableExpandedDiagram({
  applicationId,
  nodeId,
  nodeLabel,
  systemLabel,
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
  const [jobSystemsOpen, setJobSystemsOpen] = useState(false);
  const [jobSystemsRelationId, setJobSystemsRelationId] = useState<number | null>(null);
  const [systemProcessesOpen, setSystemProcessesOpen] = useState(false);
  const [systemProcessesRelationId, setSystemProcessesRelationId] = useState<number | null>(null);
  const [systemTechnologiesOpen, setSystemTechnologiesOpen] = useState(false);
  const [systemTechnologiesRelationId, setSystemTechnologiesRelationId] = useState<number | null>(null);
  const [systemDataOpen, setSystemDataOpen] = useState(false);
  const [systemDataRelationId, setSystemDataRelationId] = useState<number | null>(null);
  const [systemDocumentsOpen, setSystemDocumentsOpen] = useState(false);
  const [systemDocumentsRelationId, setSystemDocumentsRelationId] = useState<number | null>(null);
  const [systemIndicatorsOpen, setSystemIndicatorsOpen] = useState(false);
  const [systemIndicatorsRelationId, setSystemIndicatorsRelationId] = useState<number | null>(null);
  const [systemAuditsOpen, setSystemAuditsOpen] = useState(false);
  const [systemAuditId, setSystemAuditId] = useState<number | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; nodeId: string | null }>({
    open: false,
    nodeId: null,
  });
  const [deleting, setDeleting] = useState(false);

  const isJobSystemsModule = useMemo(() => {
    const id = String(nodeId ?? '').toLowerCase();
    const label = String(nodeLabel ?? '').toLowerCase();
    return (
      id === 'job' ||
      id === 'jobs' ||
      id === 'cargo' ||
      id === 'cargos' ||
      id.includes('job') ||
      id.includes('cargo') ||
      label.includes('cargo') ||
      label.includes('cargos') ||
      label.includes('job') ||
      label.includes('jobs')
    );
  }, [nodeId, nodeLabel]);

  const isSystemProcessesModule = useMemo(() => {
    const id = String(nodeId ?? '').toLowerCase();
    const label = String(nodeLabel ?? '').toLowerCase();
    return (
      id === 'process' ||
      id === 'processes' ||
      id === 'proceso' ||
      id === 'procesos' ||
      id.includes('process') ||
      id.includes('proceso') ||
      label.includes('process') ||
      label.includes('processes') ||
      label.includes('proceso') ||
      label.includes('procesos')
    );
  }, [nodeId, nodeLabel]);

  const isSystemTechnologiesModule = useMemo(() => {
    const id = String(nodeId ?? '').toLowerCase();
    const label = String(nodeLabel ?? '').toLowerCase();
    return (
      id === 'technology' ||
      id === 'technologies' ||
      id === 'tecnologia' ||
      id === 'tecnologias' ||
      id.includes('technolog') ||
      id.includes('tecnolog') ||
      label.includes('technolog') ||
      label.includes('tecnolog')
    );
  }, [nodeId, nodeLabel]);

  const isSystemDataModule = useMemo(() => {
    const id = String(nodeId ?? '').toLowerCase();
    const label = String(nodeLabel ?? '').toLowerCase();
    return (
      id === 'data' ||
      id === 'datos' ||
      id.includes('data') ||
      id.includes('dato') ||
      label.includes('data') ||
      label.includes('dato') ||
      label.includes('datos')
    );
  }, [nodeId, nodeLabel]);

  const isSystemIndicatorsModule = useMemo(() => {
    const id = String(nodeId ?? '').toLowerCase();
    const label = String(nodeLabel ?? '').toLowerCase();
    return (
      id === 'indicator' ||
      id === 'indicators' ||
      id === 'indicador' ||
      id === 'indicadores' ||
      id.includes('indicator') ||
      id.includes('indicador') ||
      label.includes('indicator') ||
      label.includes('indicador') ||
      label.includes('kpi')
    );
  }, [nodeId, nodeLabel]);

  const isSystemDocumentsModule = useMemo(() => {
    const id = String(nodeId ?? '').toLowerCase();
    const label = String(nodeLabel ?? '').toLowerCase();
    return (
      id === 'document' ||
      id === 'documents' ||
      id === 'documento' ||
      id === 'documentos' ||
      id.includes('document') ||
      label.includes('document')
    );
  }, [nodeId, nodeLabel]);

  const isSystemAuditsModule = useMemo(() => {
    const id = String(nodeId ?? '').toLowerCase();
    const label = String(nodeLabel ?? '').toLowerCase();
    return (
      id === 'audit' ||
      id === 'audits' ||
      id === 'auditoria' ||
      id === 'auditorias' ||
      id.includes('audit') ||
      id.includes('auditor') ||
      label.includes('audit') ||
      label.includes('auditor')
    );
  }, [nodeId, nodeLabel]);

  const normalizeJobSystemRelations = useCallback((raw: unknown): JobSystemRelation[] => {
    if (!Array.isArray(raw)) return [];
    return raw.filter((it): it is JobSystemRelation => {
      if (!it || typeof it !== 'object') return false;
      const rec = it as Record<string, unknown>;
      return typeof rec.id === 'number';
    });
  }, []);

  const normalizeSystemProcessRelations = useCallback((raw: unknown): SystemProcessRelation[] => {
    if (!Array.isArray(raw)) return [];
    return raw.filter((it): it is SystemProcessRelation => {
      if (!it || typeof it !== 'object') return false;
      const rec = it as Record<string, unknown>;
      return typeof rec.id === 'number';
    });
  }, []);

  const normalizeSystemTechnologyRelations = useCallback((raw: unknown): SystemTechnologyRelation[] => {
    if (!Array.isArray(raw)) return [];
    return raw.filter((it): it is SystemTechnologyRelation => {
      if (!it || typeof it !== 'object') return false;
      const rec = it as Record<string, unknown>;
      return typeof rec.id === 'number';
    });
  }, []);

  const normalizeSystemDataRelations = useCallback((raw: unknown): SystemDataRelation[] => {
    if (!Array.isArray(raw)) return [];
    return raw.filter((it): it is SystemDataRelation => {
      if (!it || typeof it !== 'object') return false;
      const rec = it as Record<string, unknown>;
      return typeof rec.id === 'number';
    });
  }, []);

  const normalizeSystemDocumentRelations = useCallback((raw: unknown): SystemDocumentRelation[] => {
    if (!Array.isArray(raw)) return [];
    return raw.filter((it): it is SystemDocumentRelation => {
      if (!it || typeof it !== 'object') return false;
      const rec = it as Record<string, unknown>;
      return typeof rec.id === 'number';
    });
  }, []);

  const normalizeSystemIndicatorRelations = useCallback((raw: unknown): SystemIndicatorRelation[] => {
    if (!Array.isArray(raw)) return [];
    return raw.filter((it): it is SystemIndicatorRelation => {
      if (!it || typeof it !== 'object') return false;
      const rec = it as Record<string, unknown>;
      return typeof rec.id === 'number';
    });
  }, []);

  type SystemAuditRecord = {
    id: number;
    date: string | null;
    type: string | null;
  };

  const normalizeSystemAudits = useCallback((raw: unknown): SystemAuditRecord[] => {
    const list: unknown[] = Array.isArray(raw)
      ? raw
      : raw && typeof raw === 'object'
        ? Array.isArray((raw as Record<string, unknown>).data)
          ? ((raw as Record<string, unknown>).data as unknown[])
          : []
        : [];

    return list
      .map((it) => {
        if (!it || typeof it !== 'object') return null;
        const rec = it as Record<string, unknown>;
        const id = Number(rec.id);
        if (!Number.isFinite(id)) return null;
        const date = typeof rec.date === 'string' ? rec.date : null;
        const type = typeof rec.type === 'string' ? rec.type : null;
        return { id, date, type };
      })
      .filter((it): it is SystemAuditRecord => it !== null);
  }, []);

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

  const fetchExpandedData = useCallback(async () => {
    try {
      setLoading(true);
      if (isJobSystemsModule) {
        const systemId = Number(applicationId);
        const res = await GetJobSystemRelationsService();
        const list = normalizeJobSystemRelations((res as { data?: unknown })?.data);

        const systemRelations = list.filter((r) => Number(r?.system?.id) === systemId);

        const data: MapData = {
          id: nodeId,
          label: nodeLabel,
          children: systemRelations.map((r) => {
            const jobId = Number(r?.job?.id);
            const jobName = r?.job?.name;
            const label = jobName && String(jobName).trim().length > 0
              ? String(jobName)
              : `${t('application.map.jobSystems.form.fields.job')} #${jobId}`;
            return { id: String(r.id), label, data: { jobId } };
          }),
        };

        setMapData(data);
        return;
      }

      if (isSystemProcessesModule) {
        const systemId = Number(applicationId);
        const res = await GetSystemProcessRelationsService();
        const list = normalizeSystemProcessRelations((res as { data?: unknown })?.data);

        const systemRelations = list.filter((r) => Number(r?.system?.id) === systemId);

        const data: MapData = {
          id: nodeId,
          label: nodeLabel,
          children: systemRelations.map((r) => {
            const processId = Number(r?.process?.id);
            const processName = r?.process?.name;
            const label = processName && String(processName).trim().length > 0
              ? String(processName)
              : `${t('application.map.systemProcesses.form.fields.process')} #${processId}`;
            return { id: String(r.id), label, data: { processId } };
          }),
        };

        setMapData(data);
        return;
      }

      if (isSystemTechnologiesModule) {
        const systemId = Number(applicationId);
        const res = await GetSystemTechnologyRelationsService();
        const list = normalizeSystemTechnologyRelations((res as { data?: unknown })?.data);

        const systemRelations = list.filter((r) => {
          const sysId = Number(r?.system?.id ?? (r as { systemId?: unknown } | undefined)?.systemId);
          return sysId === systemId;
        });

        const data: MapData = {
          id: nodeId,
          label: nodeLabel,
          children: systemRelations.map((r) => {
            const techId = Number(
              r?.technology?.id ??
                (r as { technologyId?: unknown; technology_id?: unknown } | undefined)?.technologyId ??
                (r as { technology_id?: unknown } | undefined)?.technology_id
            );
            const techName = r?.technology?.name;
            const label = techName && String(techName).trim().length > 0
              ? String(techName)
              : `${t('application.map.systemTechnologies.form.fields.technology')} #${Number.isFinite(techId) ? techId : '-'}`;
            return { id: String(r.id), label, data: { technologyId: techId } };
          }),
        };

        setMapData(data);
        return;
      }

      if (isSystemDataModule) {
        const systemId = Number(applicationId);
        const res = await GetSystemDataRelationsService();
        const list = normalizeSystemDataRelations((res as { data?: unknown })?.data);

        const systemRelations = list.filter((r) => {
          const sysId = Number(r?.system?.id ?? (r as { systemId?: unknown } | undefined)?.systemId);
          return sysId === systemId;
        });

        const data: MapData = {
          id: nodeId,
          label: nodeLabel,
          children: systemRelations.map((r) => {
            const dataId = Number(
              r?.data?.id ??
                (r as { dataId?: unknown; data_id?: unknown } | undefined)?.dataId ??
                (r as { data_id?: unknown } | undefined)?.data_id
            );
            const dataName = r?.data?.name;
            const label = dataName && String(dataName).trim().length > 0
              ? String(dataName)
              : `${t('application.map.systemData.form.fields.data')} #${Number.isFinite(dataId) ? dataId : '-'}`;
            return { id: String(r.id), label, data: { dataId } };
          }),
        };

        setMapData(data);
        return;
      }

      if (isSystemDocumentsModule) {
        const systemId = Number(applicationId);
        const res = await GetSystemDocumentRelationsService();
        const list = normalizeSystemDocumentRelations((res as { data?: unknown })?.data);

        const systemRelations = list.filter((r) => {
          const sysId = Number(r?.system?.id ?? (r as { systemId?: unknown } | undefined)?.systemId);
          return sysId === systemId;
        });

        const data: MapData = {
          id: nodeId,
          label: nodeLabel,
          children: systemRelations.map((r) => {
            const documentId = Number(
              r?.document?.id ??
                (r as { documentId?: unknown; document_id?: unknown } | undefined)?.documentId ??
                (r as { document_id?: unknown } | undefined)?.document_id
            );
            const documentName = r?.document?.name;
            const label = documentName && String(documentName).trim().length > 0
              ? String(documentName)
              : `${t('application.map.systemDocuments.form.fields.document')} #${Number.isFinite(documentId) ? documentId : '-'}`;
            return { id: String(r.id), label, data: { documentId } };
          }),
        };

        setMapData(data);
        return;
      }

      if (isSystemIndicatorsModule) {
        const systemId = Number(applicationId);
        const res = await GetSystemIndicatorRelationsService();
        const list = normalizeSystemIndicatorRelations((res as { data?: unknown })?.data);

        const systemRelations = list.filter((r) => {
          const sysId = Number(r?.system?.id ?? (r as { systemId?: unknown } | undefined)?.systemId);
          return sysId === systemId;
        });

        const data: MapData = {
          id: nodeId,
          label: nodeLabel,
          children: systemRelations.map((r) => {
            const indicatorId = Number(
              r?.indicator?.id ??
                (r as { indicatorId?: unknown; indicator_id?: unknown } | undefined)?.indicatorId ??
                (r as { indicator_id?: unknown } | undefined)?.indicator_id
            );
            const indicatorName = r?.indicator?.indicatorName ?? r?.indicator?.name;
            const label = indicatorName && String(indicatorName).trim().length > 0
              ? String(indicatorName)
              : `${t('application.map.systemIndicators.form.fields.indicator')} #${Number.isFinite(indicatorId) ? indicatorId : '-'}`;
            return { id: String(r.id), label, data: { indicatorId } };
          }),
        };

        setMapData(data);
        return;
      }

      if (isSystemAuditsModule) {
        const systemId = Number(applicationId);
        try {
          const res = await axios.get(`/api/audits/system/${encodeURIComponent(String(systemId))}`);
          const list = normalizeSystemAudits((res as { data?: unknown })?.data);

          const data: MapData = {
            id: nodeId,
            label: nodeLabel,
            children: list.map((r) => {
              const dateLabel = r.date && String(r.date).includes('T') ? String(r.date).split('T')[0] : r.date;
              const label = r.type && String(r.type).trim().length > 0
                ? dateLabel
                  ? `${String(r.type)} (${dateLabel})`
                  : String(r.type)
                : `#${r.id}`;

              return { id: String(r.id), label, data: { auditId: r.id } };
            }),
          };

          setMapData(data);
          return;
        } catch (error) {
          console.error('Error loading audits list:', error);
        }
      }

      const response = await GetApplicationTableMapByIdExpandService(applicationId, nodeId);
      setMapData(response.data);
    } catch (error) {
      console.error('Error al cargar el mapa expandido:', error);
      toast.error(
        isJobSystemsModule
          ? t('application.map.jobSystems.messages.loadError')
          : isSystemProcessesModule
            ? t('application.map.systemProcesses.messages.loadError')
            : isSystemTechnologiesModule
              ? t('application.map.systemTechnologies.messages.loadError')
              : isSystemDataModule
                ? t('application.map.systemData.messages.loadError')
                : isSystemDocumentsModule
                  ? t('application.map.systemDocuments.messages.loadError')
                  : isSystemIndicatorsModule
                    ? t('application.map.systemIndicators.messages.loadError')
                    : isSystemAuditsModule
                      ? t('application.table.messages.loadError')
          : t('application.map.messages.error.loadMapError')
      );
    } finally {
      setLoading(false);
    }
  }, [
    applicationId,
    isJobSystemsModule,
    isSystemProcessesModule,
    isSystemTechnologiesModule,
    isSystemDataModule,
    isSystemDocumentsModule,
    isSystemIndicatorsModule,
    isSystemAuditsModule,
    nodeId,
    nodeLabel,
    normalizeJobSystemRelations,
    normalizeSystemProcessRelations,
    normalizeSystemTechnologyRelations,
    normalizeSystemDataRelations,
    normalizeSystemDocumentRelations,
    normalizeSystemIndicatorRelations,
    normalizeSystemAudits,
    t,
  ]);

  const generateNodesAndEdges = useCallback(
    (data: MapData) => {
      const radius = 400;
      const angleStep = (2 * Math.PI) / data.children.length;
      const centerX = 0;
      const centerY = 0;

      const centralNode: Node = {
        id: 'central',
        type: 'central',
        position: { x: centerX - 140, y: centerY - 80 },
        data: {
          label: data.label,
          appId: data.id,
        },
        draggable: true,
      };

      const childNodes: Node[] = data.children.map((child: ChildNode, index: number) => {
        const rawChildId = String(child.id ?? '').trim();
        const safeChildId = rawChildId.length > 0 ? rawChildId : `child-${index}`;
        const angle = index * angleStep - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius - 90;
        const y = centerY + Math.sin(angle) * radius - 90;
        const color = colors[index % colors.length];
        const isRelationModule =
          isJobSystemsModule ||
          isSystemProcessesModule ||
          isSystemTechnologiesModule ||
          isSystemDataModule ||
          isSystemDocumentsModule ||
          isSystemIndicatorsModule ||
          isSystemAuditsModule;

        const handleEditRelation = () => {
          const relationId = Number(rawChildId);
          if (!Number.isFinite(relationId)) return;

          if (isJobSystemsModule) {
            setJobSystemsRelationId(relationId);
            setJobSystemsOpen(true);
            return;
          }

          if (isSystemProcessesModule) {
            setSystemProcessesRelationId(relationId);
            setSystemProcessesOpen(true);
            return;
          }

          if (isSystemTechnologiesModule) {
            setSystemTechnologiesRelationId(relationId);
            setSystemTechnologiesOpen(true);
            return;
          }

          if (isSystemDataModule) {
            setSystemDataRelationId(relationId);
            setSystemDataOpen(true);
            return;
          }

          if (isSystemDocumentsModule) {
            setSystemDocumentsRelationId(relationId);
            setSystemDocumentsOpen(true);
            return;
          }

          if (isSystemIndicatorsModule) {
            setSystemIndicatorsRelationId(relationId);
            setSystemIndicatorsOpen(true);
            return;
          }

          if (isSystemAuditsModule) {
            setSystemAuditId(relationId);
            setSystemAuditsOpen(true);
          }
        };

        return {
          id: safeChildId,
          type: 'child',
          position: { x, y },
          data: {
            label: child.label,
            id: rawChildId.length > 0 ? rawChildId : safeChildId,
            color,
            onClick: isRelationModule
              ? handleEditRelation
              : () => {
                  if (rawChildId.length === 0) return;
                  onNavigateToChild?.(child);
                },
            onEdit: isRelationModule ? handleEditRelation : undefined,
            onDelete: () => {
              if (rawChildId.length === 0) return;
              setDeleteDialog({ open: true, nodeId: rawChildId });
            },
          },
          draggable: true,
        };
      });

      const newEdges: Edge[] = data.children.map((child: ChildNode, index: number) => {
        const rawChildId = String(child.id ?? '').trim();
        const safeChildId = rawChildId.length > 0 ? rawChildId : `child-${index}`;
        const color = colors[index % colors.length];
        return {
          id: `central-${safeChildId}`,
          source: 'central',
          target: safeChildId,
          type: 'straight',
          animated: true,
          style: {
            stroke: alpha(color, 0.5),
            strokeWidth: 3,
          },
          markerEnd: {
            type: 'arrowclosed' as const,
            color: alpha(color, 0.5),
          },
        };
      });

      setNodes([centralNode, ...childNodes]);
      setEdges(newEdges);
    },
    [
      colors,
      isJobSystemsModule,
      isSystemProcessesModule,
      isSystemTechnologiesModule,
      isSystemDataModule,
      isSystemDocumentsModule,
      isSystemIndicatorsModule,
      isSystemAuditsModule,
      onNavigateToChild,
      setEdges,
      setNodes,
    ]
  );

  const handleDeleteNode = async () => {
    if (!deleteDialog.nodeId) return;

    try {
      setDeleting(true);
      if (isJobSystemsModule) {
        await DeleteJobSystemRelationService(deleteDialog.nodeId);
        toast.success(t('application.map.jobSystems.messages.deleted'));
      } else if (isSystemProcessesModule) {
        await DeleteSystemProcessService(deleteDialog.nodeId);
        toast.success(t('application.map.systemProcesses.messages.deleted'));
      } else if (isSystemTechnologiesModule) {
        await DeleteSystemTechnologyRelationService(deleteDialog.nodeId);
        toast.success(t('application.map.systemTechnologies.messages.deleted'));
      } else if (isSystemDataModule) {
        await DeleteSystemDataRelationService(deleteDialog.nodeId);
        toast.success(t('application.map.systemData.messages.deleted'));
      } else if (isSystemDocumentsModule) {
        await DeleteSystemDocumentRelationService(deleteDialog.nodeId);
        toast.success(t('application.map.systemDocuments.messages.deleted'));
      } else if (isSystemIndicatorsModule) {
        await DeleteSystemIndicatorRelationService(deleteDialog.nodeId);
        toast.success(t('application.map.systemIndicators.messages.deleted'));
      } else if (isSystemAuditsModule) {
        const systemId = Number(applicationId);
        await axios.delete(
          `/api/audits/system/${encodeURIComponent(String(systemId))}/${encodeURIComponent(String(deleteDialog.nodeId))}`
        );
        toast.success(t('application.table.messages.success.deleted'));
      } else {
        await DeleteApplicationTableMapNodeService(applicationId, deleteDialog.nodeId);
        toast.success(t('application.table.messages.success.deleted'));
      }
      setDeleteDialog({ open: false, nodeId: null });
      await fetchExpandedData();
    } catch (error) {
      console.error('Error al eliminar el nodo:', error);
      toast.error(
        isJobSystemsModule
          ? t('application.map.jobSystems.messages.deleteError')
          : isSystemProcessesModule
            ? t('application.map.systemProcesses.messages.deleteError')
            : isSystemTechnologiesModule
              ? t('application.map.systemTechnologies.messages.deleteError')
              : isSystemDataModule
                ? t('application.map.systemData.messages.deleteError')
                : isSystemDocumentsModule
                  ? t('application.map.systemDocuments.messages.deleteError')
                  : isSystemIndicatorsModule
                    ? t('application.map.systemIndicators.messages.deleteError')
                    : isSystemAuditsModule
                      ? t('application.table.messages.error.deleting')
          : t('application.table.messages.error.deleting')
      );
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchExpandedData();
  }, [fetchExpandedData]);

  useEffect(() => {
    if (mapData) {
      generateNodesAndEdges(mapData);
    }
  }, [mapData, generateNodesAndEdges]);

  if (loading) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 600,
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="body2" color="text.secondary">
            {t('application.map.diagram.loadingMap')}
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (!mapData) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 600,
        }}
      >
        <Typography variant="body1" color="text.secondary">
          {t('application.map.diagram.noData')}
        </Typography>
      </Box>
    );
  }

  if (mapData.children.length === 0) {
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
        {/* Breadcrumb para volver */}
        <Box
          sx={{
            position: 'absolute',
            top: { xs: 12, sm: 16 },
            left: { xs: 12, sm: 16 },
            zIndex: 100,
          }}
        >
          <Paper
            elevation={4}
            sx={{
              px: 2,
              py: 1,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.background.paper, 0.95),
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Tooltip title={t('application.map.diagram.subDiagram.buttonBack')}>
              <IconButton
                size="small"
                onClick={onBack}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.16),
                  },
                }}
              >
                <Iconify icon="eva:arrow-ios-back-fill" width={18} />
              </IconButton>
            </Tooltip>
          </Paper>
        </Box>

        {/* Botón de agregar proceso */}
        <Box
          sx={{
            position: 'absolute',
            top: { xs: 12, sm: 16 },
            right: { xs: 12, sm: 16 },
            zIndex: 100,
          }}
        >
          <Button
            variant="contained"
            color="primary"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => {
              if (isJobSystemsModule) {
                setJobSystemsRelationId(null);
                setJobSystemsOpen(true);
                return;
              }
              if (isSystemProcessesModule) {
                setSystemProcessesRelationId(null);
                setSystemProcessesOpen(true);
                return;
              }
              if (isSystemTechnologiesModule) {
                setSystemTechnologiesRelationId(null);
                setSystemTechnologiesOpen(true);
                return;
              }
              if (isSystemDataModule) {
                setSystemDataRelationId(null);
                setSystemDataOpen(true);
                return;
              }
              if (isSystemDocumentsModule) {
                setSystemDocumentsRelationId(null);
                setSystemDocumentsOpen(true);
                return;
              }
              if (isSystemIndicatorsModule) {
                setSystemIndicatorsRelationId(null);
                setSystemIndicatorsOpen(true);
                return;
              }
              if (isSystemAuditsModule) {
                setSystemAuditId(null);
                setSystemAuditsOpen(true);
                return;
              }
              setOpenCreateModal(true);
            }}
            sx={{
              borderRadius: 2,
              boxShadow: 4,
            }}
          >
            {t('application.table.actions.addChild')}
          </Button>
        </Box>

        <Box
          sx={{
            width: '100%',
            height: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
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
              <Iconify
                icon="solar:inbox-in-bold"
                width={60}
                sx={{ color: alpha(theme.palette.primary.main, 0.5) }}
              />
            </Box>
            <Stack spacing={1} alignItems="center">
              <Typography variant="h6" color="text.primary">
                {mapData.label}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('application.map.diagram.subDiagram.noRelations')}
              </Typography>
            </Stack>
          </Stack>
        </Box>

        {/* Modal de creación */}
        {!isJobSystemsModule &&
          !isSystemProcessesModule &&
          !isSystemTechnologiesModule &&
          !isSystemDataModule &&
          !isSystemDocumentsModule &&
          !isSystemIndicatorsModule &&
          !isSystemAuditsModule && (
          <ApplicationTableNodeCreateModal
            open={openCreateModal}
            onClose={() => setOpenCreateModal(false)}
            onSuccess={fetchExpandedData}
            applicationId={applicationId}
            parentNodeId={nodeId}
          />
        )}

        <ApplicationJobSystemsDrawer
          open={jobSystemsOpen}
          onClose={() => {
            setJobSystemsOpen(false);
            setJobSystemsRelationId(null);
          }}
          onSuccess={fetchExpandedData}
          systemId={Number(applicationId)}
          systemLabel={systemLabel}
          relationId={jobSystemsRelationId}
        />

        <ApplicationSystemProcessesDrawer
          open={systemProcessesOpen}
          onClose={() => {
            setSystemProcessesOpen(false);
            setSystemProcessesRelationId(null);
          }}
          onSuccess={fetchExpandedData}
          systemId={Number(applicationId)}
          systemLabel={systemLabel}
          relationId={systemProcessesRelationId}
        />

        <ApplicationSystemTechnologiesDrawer
          open={systemTechnologiesOpen}
          onClose={() => {
            setSystemTechnologiesOpen(false);
            setSystemTechnologiesRelationId(null);
          }}
          onSuccess={fetchExpandedData}
          systemId={Number(applicationId)}
          systemLabel={systemLabel}
          relationId={systemTechnologiesRelationId}
        />

        <ApplicationSystemDataDrawer
          open={systemDataOpen}
          onClose={() => {
            setSystemDataOpen(false);
            setSystemDataRelationId(null);
          }}
          onSuccess={fetchExpandedData}
          systemId={Number(applicationId)}
          systemLabel={systemLabel}
          relationId={systemDataRelationId}
        />

        <ApplicationSystemDocumentsDrawer
          open={systemDocumentsOpen}
          onClose={() => {
            setSystemDocumentsOpen(false);
            setSystemDocumentsRelationId(null);
          }}
          onSuccess={fetchExpandedData}
          systemId={Number(applicationId)}
          systemLabel={systemLabel}
          relationId={systemDocumentsRelationId}
        />

        <ApplicationSystemIndicatorsDrawer
          open={systemIndicatorsOpen}
          onClose={() => {
            setSystemIndicatorsOpen(false);
            setSystemIndicatorsRelationId(null);
          }}
          onSuccess={fetchExpandedData}
          systemId={Number(applicationId)}
          systemLabel={systemLabel}
          relationId={systemIndicatorsRelationId}
        />

        <ApplicationSystemAuditsDrawer
          open={systemAuditsOpen}
          onClose={() => {
            setSystemAuditsOpen(false);
            setSystemAuditId(null);
          }}
          onSuccess={fetchExpandedData}
          systemId={Number(applicationId)}
          systemLabel={systemLabel}
          auditId={systemAuditId}
        />
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
      {/* Breadcrumb de navegación */}
      <Box
        sx={{
          position: 'absolute',
          top: { xs: 12, sm: 16 },
          left: { xs: 12, sm: 16 },
          zIndex: 100,
        }}
      >
        <Paper
          elevation={4}
          sx={{
            px: 2,
            py: 1,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title={t('application.map.diagram.subDiagram.buttonBack')}>
              <IconButton
                size="small"
                onClick={onBack}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.16),
                  },
                }}
              >
                <Iconify icon="eva:arrow-ios-back-fill" width={18} />
              </IconButton>
            </Tooltip>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                {t('application.map.diagram.subDiagram.home')}
              </Typography>
              {(path && path.length > 0 ? path : [{ id: nodeId, label: nodeLabel }]).map((p, index, arr) => (
                <Fragment key={`${p.id}-${index}`}>
                  <Iconify icon="eva:arrow-ios-forward-fill" width={16} sx={{ color: 'text.disabled' }} />
                  {index < arr.length - 1 && onNavigateToPathIndex ? (
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => onNavigateToPathIndex(index)}
                      sx={{
                        minWidth: 0,
                        p: 0,
                        lineHeight: 1,
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        color: 'text.secondary',
                        '&:hover': { bgcolor: 'transparent', color: 'text.primary' },
                      }}
                    >
                      {p.label}
                    </Button>
                  ) : (
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {p.label}
                    </Typography>
                  )}
                </Fragment>
              ))}
            </Stack>
          </Stack>
        </Paper>
      </Box>

      {/* Botón de agregar proceso */}
      <Box
        sx={{
          position: 'absolute',
          top: { xs: 12, sm: 16 },
          right: { xs: 12, sm: 16 },
          zIndex: 100,
        }}
      >
        <Button
          variant="contained"
          color="primary"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={() => {
            if (isJobSystemsModule) {
              setJobSystemsRelationId(null);
              setJobSystemsOpen(true);
              return;
            }
            if (isSystemProcessesModule) {
              setSystemProcessesRelationId(null);
              setSystemProcessesOpen(true);
              return;
            }
            if (isSystemTechnologiesModule) {
              setSystemTechnologiesRelationId(null);
              setSystemTechnologiesOpen(true);
              return;
            }
            if (isSystemDataModule) {
              setSystemDataRelationId(null);
              setSystemDataOpen(true);
              return;
            }
            if (isSystemDocumentsModule) {
              setSystemDocumentsRelationId(null);
              setSystemDocumentsOpen(true);
              return;
            }
            if (isSystemIndicatorsModule) {
              setSystemIndicatorsRelationId(null);
              setSystemIndicatorsOpen(true);
              return;
            }
            if (isSystemAuditsModule) {
              setSystemAuditId(null);
              setSystemAuditsOpen(true);
              return;
            }
            setOpenCreateModal(true);
          }}
          sx={{
            borderRadius: 2,
            boxShadow: 4,
          }}
        >
          {t('application.table.actions.addChild')}
        </Button>
      </Box>

      <Box
        sx={{
          width: '100%',
          height: 850,
          position: 'relative',
        }}
      >
        {/* Indicador de nodos */}
        <Box
          sx={{
            position: 'absolute',
            top: { xs: 60, sm: 68 },
            left: { xs: 12, sm: 16 },
            zIndex: 100,
            pointerEvents: 'none',
          }}
        >
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
                  '@keyframes blink': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.3 },
                  },
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: 'text.secondary',
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                }}
              >
                {mapData.children.length} {t('application.map.diagram.conectedModules')}
              </Typography>
            </Stack>
          </Paper>
        </Box>

        {/* Ayuda de controles */}
        <Box
          sx={{
            position: 'absolute',
            top: { xs: 60, sm: 68 },
            right: { xs: 12, sm: 16 },
            zIndex: 100,
            pointerEvents: 'none',
          }}
        >
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
                  <Iconify
                    icon="solar:magnifer-zoom-in-bold"
                    width={10}
                    sx={{ color: 'text.secondary' }}
                  />
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: 'text.secondary',
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  }}
                >
                  {t('application.map.diagram.controls.zoom')}
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
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: 'text.secondary',
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  }}
                >
                  {t('application.map.diagram.controls.move')}
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
          defaultEdgeOptions={{
            type: 'straight',
            animated: true,
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            color={alpha(theme.palette.primary.main, 0.08)}
            gap={24}
            size={2}
            variant={BackgroundVariant.Dots}
          />
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={(node) => {
              if (node.type === 'central') return theme.palette.primary.main;
              if (node.data && typeof node.data === 'object' && 'color' in node.data) {
                const c = (node.data as { color?: unknown }).color;
                if (typeof c === 'string') return c;
              }
              return theme.palette.grey[400];
            }}
            maskColor={alpha(theme.palette.background.paper, 0.8)}
          />
        </ReactFlow>
      </Box>

      {/* Modal de creación */}
      {!isJobSystemsModule &&
        !isSystemProcessesModule &&
        !isSystemTechnologiesModule &&
        !isSystemDataModule &&
        !isSystemDocumentsModule &&
        !isSystemIndicatorsModule &&
        !isSystemAuditsModule && (
        <ApplicationTableNodeCreateModal
          open={openCreateModal}
          onClose={() => setOpenCreateModal(false)}
          onSuccess={fetchExpandedData}
          applicationId={applicationId}
          parentNodeId={nodeId}
        />
      )}

      <ApplicationJobSystemsDrawer
        open={jobSystemsOpen}
        onClose={() => {
          setJobSystemsOpen(false);
          setJobSystemsRelationId(null);
        }}
        onSuccess={fetchExpandedData}
        systemId={Number(applicationId)}
        systemLabel={systemLabel}
        relationId={jobSystemsRelationId}
      />

      <ApplicationSystemProcessesDrawer
        open={systemProcessesOpen}
        onClose={() => {
          setSystemProcessesOpen(false);
          setSystemProcessesRelationId(null);
        }}
        onSuccess={fetchExpandedData}
        systemId={Number(applicationId)}
        systemLabel={systemLabel}
        relationId={systemProcessesRelationId}
      />

      <ApplicationSystemTechnologiesDrawer
        open={systemTechnologiesOpen}
        onClose={() => {
          setSystemTechnologiesOpen(false);
          setSystemTechnologiesRelationId(null);
        }}
        onSuccess={fetchExpandedData}
        systemId={Number(applicationId)}
        systemLabel={systemLabel}
        relationId={systemTechnologiesRelationId}
      />

      <ApplicationSystemDataDrawer
        open={systemDataOpen}
        onClose={() => {
          setSystemDataOpen(false);
          setSystemDataRelationId(null);
        }}
        onSuccess={fetchExpandedData}
        systemId={Number(applicationId)}
        systemLabel={systemLabel}
        relationId={systemDataRelationId}
      />

      <ApplicationSystemDocumentsDrawer
        open={systemDocumentsOpen}
        onClose={() => {
          setSystemDocumentsOpen(false);
          setSystemDocumentsRelationId(null);
        }}
        onSuccess={fetchExpandedData}
        systemId={Number(applicationId)}
        systemLabel={systemLabel}
        relationId={systemDocumentsRelationId}
      />

      <ApplicationSystemIndicatorsDrawer
        open={systemIndicatorsOpen}
        onClose={() => {
          setSystemIndicatorsOpen(false);
          setSystemIndicatorsRelationId(null);
        }}
        onSuccess={fetchExpandedData}
        systemId={Number(applicationId)}
        systemLabel={systemLabel}
        relationId={systemIndicatorsRelationId}
      />

      <ApplicationSystemAuditsDrawer
        open={systemAuditsOpen}
        onClose={() => {
          setSystemAuditsOpen(false);
          setSystemAuditId(null);
        }}
        onSuccess={fetchExpandedData}
        systemId={Number(applicationId)}
        systemLabel={systemLabel}
        auditId={systemAuditId}
      />

      {/* Dialog de confirmación de eliminación */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => !deleting && setDeleteDialog({ open: false, nodeId: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {isJobSystemsModule
            ? t('application.map.jobSystems.deleteDialog.title')
            : isSystemProcessesModule
              ? t('application.map.systemProcesses.deleteDialog.title')
              : isSystemTechnologiesModule
                ? t('application.map.systemTechnologies.deleteDialog.title')
                : isSystemDataModule
                  ? t('application.map.systemData.deleteDialog.title')
                  : isSystemDocumentsModule
                    ? t('application.map.systemDocuments.deleteDialog.title')
                    : isSystemIndicatorsModule
                      ? t('application.map.systemIndicators.deleteDialog.title')
              : t('application.table.dialogs.delete.title')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {isJobSystemsModule
              ? t('application.map.jobSystems.deleteDialog.content')
              : isSystemProcessesModule
                ? t('application.map.systemProcesses.deleteDialog.content')
                : isSystemTechnologiesModule
                  ? t('application.map.systemTechnologies.deleteDialog.content')
                  : isSystemDataModule
                    ? t('application.map.systemData.deleteDialog.content')
                    : isSystemDocumentsModule
                      ? t('application.map.systemDocuments.deleteDialog.content')
                      : isSystemIndicatorsModule
                        ? t('application.map.systemIndicators.deleteDialog.content')
                : t('application.table.dialogs.delete.content')}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setDeleteDialog({ open: false, nodeId: null })}
            disabled={deleting}
          >
            {isJobSystemsModule
              ? t('application.map.jobSystems.actions.cancel')
              : isSystemProcessesModule
                ? t('application.map.systemProcesses.actions.cancel')
                : isSystemTechnologiesModule
                  ? t('application.map.systemTechnologies.actions.cancel')
                  : isSystemDataModule
                    ? t('application.map.systemData.actions.cancel')
                    : isSystemDocumentsModule
                      ? t('application.map.systemDocuments.actions.cancel')
                      : isSystemIndicatorsModule
                        ? t('application.map.systemIndicators.actions.cancel')
                : t('application.table.actions.cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteNode}
            disabled={deleting}
            startIcon={
              deleting ? <CircularProgress size={20} color="inherit" /> : <Iconify icon="solar:trash-bin-trash-bold" />
            }
          >
            {isJobSystemsModule
              ? t('application.map.jobSystems.actions.delete')
              : isSystemProcessesModule
                ? t('application.map.systemProcesses.actions.delete')
                : isSystemTechnologiesModule
                  ? t('application.map.systemTechnologies.actions.delete')
                  : isSystemDataModule
                    ? t('application.map.systemData.actions.delete')
                    : isSystemDocumentsModule
                      ? t('application.map.systemDocuments.actions.delete')
                      : isSystemIndicatorsModule
                        ? t('application.map.systemIndicators.actions.delete')
                : t('application.table.dialogs.delete.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
