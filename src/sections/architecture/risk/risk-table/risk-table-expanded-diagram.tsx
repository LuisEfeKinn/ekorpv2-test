'use client';

import '@xyflow/react/dist/style.css';

import type { Node, Edge } from '@xyflow/react';
import type { Theme, SxProps } from '@mui/material/styles';

import { useMemo, useState, useEffect, useCallback } from 'react';
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
import {
  Box,
  Card,
  Paper,
  Stack,
  Dialog,
  Button,
  Tooltip,
  IconButton,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  CircularProgress,
} from '@mui/material';

import { useTranslate } from 'src/locales';
import { GetToolRisksService } from 'src/services/architecture/risk/riskTools.service';
import { GetRiskTableMapByIdExpandService } from 'src/services/architecture/risk/riskMap.service';
import { GetRiskActionMeasuresService } from 'src/services/architecture/risk/riskActionMeasures.service';
import {
  GetProcessRisksService,
  GetProcessesListService,
  DeleteProcessRiskRelationService,
} from 'src/services/architecture/risk/riskJobs.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { RiskTableToolCreateModal } from './risk-table-tool-create-modal';
import { RiskTableNodeCreateModal } from './risk-table-node-create-modal';
import { RiskTableMeasureCreateModal } from './risk-table-measure-create-modal';
import { RiskTableJobProcessLinkModal } from './risk-table-job-process-link-modal';

type ChildNode = {
  id: string | number;
  label: string;
  data?: string | number;
  children?: ChildNode[];
};

type MapData = {
  id: number | string;
  label: string;
  data?: string | number;
  children: ChildNode[];
};

type RiskTableExpandedDiagramProps = {
  riskId: string;
  nodeId: string;
  nodeLabel: string;
  parentLabel?: string;
  onBack: () => void;
  onNavigateToChild?: (child: ChildNode) => void;
  sx?: SxProps<Theme>;
};

function CentralNode({ data }: any) {
  const { t } = useTranslate('architecture');
  const theme = useTheme();
  return (
    <Paper elevation={16} sx={{ px: { xs: 3, sm: 4, md: 5 }, py: { xs: 3, sm: 3.5, md: 4 }, borderRadius: 3, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`, boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.5)}`, cursor: 'grab', minWidth: 280, position: 'relative', '&:active': { cursor: 'grabbing' } }}>
      <Handle type="source" position={Position.Top} style={{ opacity: 0, width: 0, height: 0, border: 'none', background: 'transparent', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
      <Stack spacing={1.5} alignItems="center">
        <Typography variant="h5" sx={{ color: 'common.white', fontWeight: 800, textAlign: 'center', textShadow: `0 3px 12px ${alpha(theme.palette.common.black, 0.4)}`, letterSpacing: '-0.5px', lineHeight: 1.3 }}>
          {data.label}
        </Typography>
        <Typography variant="caption" sx={{ color: alpha(theme.palette.common.white, 0.85), fontWeight: 600, fontSize: '0.7rem' }}>{t('data.map.diagram.systemTitle')}</Typography>
      </Stack>
    </Paper>
  );
}

function ChildNode({ data }: any) {
  const theme = useTheme();
  const { color, label, onClick, onLinkJob, onEditRelation, onDeleteRelation } = data;
  return (
    <Paper elevation={6} sx={{ px: { xs: 2, sm: 2.5 }, py: { xs: 2, sm: 2.5 }, borderRadius: 2.5, background: theme.palette.background.paper, border: `2px solid ${alpha(color, 0.3)}`, boxShadow: `0 4px 20px ${alpha(color, 0.2)}`, cursor: 'pointer', minWidth: 180, position: 'relative', overflow: 'hidden', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', '&:hover': { transform: 'translateY(-4px) scale(1.03)', boxShadow: `0 8px 32px ${alpha(color, 0.35)}`, borderColor: color }, '&:active': { transform: 'scale(0.98)' }, '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.6)})`, boxShadow: `0 2px 8px ${alpha(color, 0.3)}` } }}>
      <Handle type="target" position={Position.Top} style={{ opacity: 0, width: 0, height: 0, border: 'none', background: 'transparent', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
      <Box onClick={onClick}>
        <Stack spacing={1.5} alignItems="center">
          <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: alpha(color, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${alpha(color, 0.2)}` }}>
            <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: color, boxShadow: `0 3px 12px ${alpha(color, 0.5)}` }} />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, textAlign: 'center', color: 'text.primary', fontSize: '0.95rem', letterSpacing: '-0.2px', lineHeight: 1.2 }}>{label}</Typography>
        </Stack>
      </Box>
      {onLinkJob && (
        <Tooltip title="Vincular Cargo">
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onLinkJob(); }} sx={{ position: 'absolute', top: 6, right: 6 }}>
            <Iconify icon="solar:map-point-bold" width={18} />
          </IconButton>
        </Tooltip>
      )}
      {onEditRelation && (
        <Tooltip title="Editar Relación">
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEditRelation(); }} sx={{ position: 'absolute', top: 6, left: 6 }}>
            <Iconify icon="solar:pen-bold" width={18} />
          </IconButton>
        </Tooltip>
      )}
      {onDeleteRelation && (
        <Tooltip title="Eliminar Relación">
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDeleteRelation(); }} sx={{ position: 'absolute', top: 6, right: 36 }}>
            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
          </IconButton>
        </Tooltip>
      )}
    </Paper>
  );
}

const nodeTypes = { central: CentralNode, child: ChildNode };

export function RiskTableExpandedDiagram({ riskId, nodeId, nodeLabel, parentLabel, onBack, onNavigateToChild, sx }: RiskTableExpandedDiagramProps) {
  const { t } = useTranslate('architecture');
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openToolCreateModal, setOpenToolCreateModal] = useState(false);
  const [openMeasureCreateModal, setOpenMeasureCreateModal] = useState(false);
  const [openJobLinkModal, setOpenJobLinkModal] = useState(false);
  const [selectedProcessId, setSelectedProcessId] = useState<number | null>(null);
  const [editingRelation, setEditingRelation] = useState<{ id: number | null; data: any } | null>(null);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [deletingRelationId, setDeletingRelationId] = useState<number | null>(null);
  const [deletingProcessId, setDeletingProcessId] = useState<number | null>(null);
  const [processDict, setProcessDict] = useState<Record<string | number, string>>({});
  const [toolDict, setToolDict] = useState<Record<string | number, string>>({});

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
      let data: MapData | null = null;
      try {
        const response = await GetRiskTableMapByIdExpandService(riskId, nodeId);
        data = response.data;
      } catch {
        data = null;
      }
      // Override children for specific node types from dedicated endpoints
      const idLower = String(nodeId).toLowerCase();
      const labelLower = String(nodeLabel || '').toLowerCase();
      const isToolNode = idLower.includes('tool') || labelLower.includes('herramient');
      const isProcessNode = idLower.includes('process') || labelLower.includes('proce');
      const isMeasureNode = idLower.includes('measure') || labelLower.includes('medid');
      if (isToolNode) {
        try {
          const res = await GetToolRisksService();
          const raw = res?.data;
          const list: any[] = Array.isArray(raw)
            ? (Array.isArray(raw[0]) ? raw[0] : raw.filter((it) => typeof it === 'object' && it))
            : Array.isArray((raw as any)?.data)
              ? (raw as any).data
              : [];
          const filtered = list.filter((it: any) => String(it?.risk?.id ?? '') === String(riskId));
          const children: ChildNode[] = filtered.map((it: any) => ({
            id: it?.tool?.id ?? it?.id,
            label: String(it?.tool?.name ?? 'Herramienta'),
            data: it?.tool?.id ?? it?.id,
          }));
          data = { id: riskId, label: nodeLabel || 'Herramientas', data: riskId, children };
        } catch {
          // keep existing data
        }
      }
      if (isProcessNode) {
        try {
          const res = await GetProcessRisksService();
          const raw = res?.data;
          const list: any[] = Array.isArray(raw)
            ? (Array.isArray(raw[0]) ? raw[0] : raw.filter((it: any) => typeof it === 'object' && it))
            : Array.isArray((raw as any)?.data)
              ? (raw as any).data
              : [];
          const filtered = list.filter((it: any) => String(it?.risk?.id ?? '') === String(riskId));
          const children: ChildNode[] = filtered.map((it: any) => ({
            id: it?.id ?? it?.process?.id ?? it?.processId,
            label: String(it?.process?.name ?? 'Proceso'),
            data: it,
          }));
          data = { id: riskId, label: nodeLabel || 'Procesos', data: riskId, children };
        } catch {
          // keep existing data
        }
      }
      if (isMeasureNode) {
        try {
          const res = await GetRiskActionMeasuresService();
          const raw = res?.data;
          const list: any[] = Array.isArray(raw)
            ? (Array.isArray(raw[0]) ? raw[0] : raw.filter((it) => typeof it === 'object' && it))
            : Array.isArray((raw as any)?.data)
              ? (raw as any).data
              : [];
          const filtered = list.filter((it: any) => String(it?.risk?.id ?? '') === String(riskId));
          const children: ChildNode[] = filtered.map((it: any) => ({
            id: it?.actionMeasure?.id ?? it?.id,
            label: String(it?.actionMeasure?.name ?? 'Medida'),
            data: it?.actionMeasure?.id ?? it?.id,
          }));
          data = { id: riskId, label: nodeLabel || 'Medidas', data: riskId, children };
        } catch {
          // keep existing data
        }
      }
      if (!data && (isToolNode || isProcessNode || isMeasureNode)) {
        const defaultLabel = isProcessNode ? 'Procesos' : isToolNode ? 'Herramientas' : isMeasureNode ? 'Medidas' : 'Nodo';
        data = { id: riskId, label: nodeLabel || defaultLabel, data: riskId, children: [] };
      }
      setMapData(data);
      if (nodeId === 'process') {
        try {
          const res = await GetProcessesListService();
          const raw = res?.data?.data ?? res?.data ?? [];
          const list: any[] = Array.isArray(raw) ? (Array.isArray(raw[0]) ? raw[0] : raw) : [];
          const dict: Record<string | number, string> = {};
          list.forEach((p: any) => {
            const pid = p?.id;
            const pname = p?.name ?? p?.label ?? '';
            if (pid != null && pname) dict[String(pid)] = String(pname);
          });
          setProcessDict(dict);
        } catch {
          setProcessDict({});
        }
      } else if (nodeId === 'tool') {
        try {
          const res = await (await import('src/services/architecture/risk/riskTools.service')).GetToolsListService();
          const raw = res?.data?.data ?? res?.data ?? [];
          const list: any[] = Array.isArray(raw) ? (Array.isArray(raw[0]) ? raw[0] : raw) : [];
          const dict: Record<string | number, string> = {};
          list.forEach((p: any) => {
            const pid = p?.id;
            const pname = p?.name ?? p?.label ?? '';
            if (pid != null && pname) dict[String(pid)] = String(pname);
          });
          setToolDict(dict);
        } catch {
          setToolDict({});
        }
      } else {
        setProcessDict({});
        setToolDict({});
      }
    } catch (error) {
      console.error('Error al cargar el mapa expandido de riesgos:', error);
      toast.error(t('data.map.messages.error.loadMapError'));
    } finally {
      setLoading(false);
    }
  }, [riskId, nodeId, t, nodeLabel]);

  const generateNodesAndEdges = useCallback((data: MapData) => {
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
      const rawId = child?.data ?? child?.id;
      const fromDataName = typeof child?.data === 'object' && child?.data
        ? String((child?.data as any)?.actionMeasure?.name || (child?.data as any)?.tool?.name || '')
        : '';
      const computedLabel = nodeId === 'process'
        ? (processDict[String(rawId)] || child.label || 'Proceso')
        : nodeId === 'tool'
          ? (fromDataName || toolDict[String(rawId)] || child.label || 'Herramienta')
          : nodeId === 'measure'
            ? (fromDataName || child.label || 'Medida')
            : (child.label || String(rawId ?? ''));
      const relationData = typeof child?.data === 'object' && child?.data ? child?.data : null;
      const relationIdCandidate = Number(child?.id);
      const relationId = (relationData && Number((relationData as any)?.id)) || (Number.isFinite(relationIdCandidate) ? relationIdCandidate : null);
      const processIdForNode = typeof rawId === 'number'
        ? rawId
        : typeof rawId === 'string'
          ? Number(rawId)
          : typeof (child as any)?.data === 'object' && (child as any)?.data
            ? Number(((child as any).data as any)?.process?.id ?? ((child as any).data as any)?.id ?? ((child as any).data as any)?.processId)
            : Number(child.id);
      return {
        id: String(child.id),
        type: 'child',
        position: { x, y },
        data: {
          label: computedLabel,
          id: String(child.id),
          color,
          onClick: () => {
            if (onNavigateToChild) onNavigateToChild(child);
          },
          onLinkJob: nodeId === 'process' ? () => {
            const procId = typeof rawId === 'number'
              ? rawId
              : typeof rawId === 'string'
                ? Number(rawId)
                : typeof (child as any)?.data === 'object' && (child as any)?.data
                  ? Number(((child as any).data as any)?.process?.id ?? ((child as any).data as any)?.id ?? ((child as any).data as any)?.processId)
                  : Number(child.id);
            if (!Number.isFinite(procId) || procId <= 0) {
              toast.error('No se pudo identificar el proceso');
              return;
            }
            setSelectedProcessId(procId);
            setOpenJobLinkModal(true);
          } : undefined,
          onEditRelation: nodeId === 'process' ? () => {
            const rid = Number.isFinite(relationId as any) ? (relationId as number) : null;
            setEditingRelation({ id: rid, data: relationData });
            setOpenEditModal(true);
          } : undefined,
          onDeleteRelation: nodeId === 'process' ? () => {
            const rid = Number.isFinite(relationId as any) ? (relationId as number) : null;
            setDeletingRelationId(rid);
            setDeletingProcessId(Number.isFinite(processIdForNode) ? processIdForNode : null);
            setOpenDeleteConfirm(true);
          } : undefined,
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
  }, [colors, onNavigateToChild, setNodes, setEdges, nodeId, processDict, toolDict]);

  useEffect(() => { fetchExpandedData(); }, [fetchExpandedData]);

  useEffect(() => { if (mapData) generateNodesAndEdges(mapData); }, [mapData, generateNodesAndEdges]);

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

  return (
    <Card sx={{ width: '100%', position: 'relative', overflow: 'hidden', bgcolor: 'background.neutral', ...sx }}>
      <Box sx={{ position: 'absolute', top: { xs: 12, sm: 16 }, left: { xs: 12, sm: 16 }, zIndex: 100 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Paper elevation={4} sx={{ px: 2, py: 1, borderRadius: 2, bgcolor: alpha(theme.palette.background.paper, 0.95), backdropFilter: 'blur(10px)', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <Tooltip title={t('data.map.diagram.subDiagram.buttonBack')}>
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

      {(nodeId === 'process' || nodeId === 'tool' || nodeId === 'measure') && (
        <Box sx={{ position: 'absolute', top: { xs: 12, sm: 16 }, right: { xs: 12, sm: 16 }, zIndex: 100 }}>
          <Stack direction="row" spacing={1}>
            {nodeId === 'process' && (
              <Button variant="contained" color="primary" startIcon={<Iconify icon="solar:add-circle-bold" />} onClick={() => setOpenCreateModal(true)} sx={{ borderRadius: 2, boxShadow: 4 }}>
                {t('process.table.actions.add')}
              </Button>
            )}
            {nodeId === 'tool' && (
              <Button variant="contained" color="primary" startIcon={<Iconify icon="solar:add-circle-bold" />} onClick={() => setOpenToolCreateModal(true)} sx={{ borderRadius: 2, boxShadow: 4 }}>
                {t('tools.table.actions.add')}
              </Button>
            )}
            {nodeId === 'measure' && (
              <Button variant="contained" color="primary" startIcon={<Iconify icon="solar:add-circle-bold" />} onClick={() => setOpenMeasureCreateModal(true)} sx={{ borderRadius: 2, boxShadow: 4 }}>
                {t('riskMap.form.actions.addMeasure')}
              </Button>
            )}
          </Stack>
        </Box>
      )}

      <Box sx={{ width: '100%', height: 850, position: 'relative' }}>
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

      {nodeId === 'process' && (
        <RiskTableNodeCreateModal
          open={openCreateModal}
          onClose={() => setOpenCreateModal(false)}
          onSuccess={fetchExpandedData}
          riskId={riskId}
          parentNodeId={nodeId}
        />
      )}
      {nodeId === 'process' && (
        <RiskTableNodeCreateModal
          open={openEditModal}
          onClose={() => setOpenEditModal(false)}
          onSuccess={fetchExpandedData}
          riskId={riskId}
          parentNodeId={nodeId}
          relationId={editingRelation?.id ?? undefined}
          initialData={editingRelation?.data}
        />
      )}
      <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>¿Deseas eliminar la relación proceso–riesgo?</DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setOpenDeleteConfirm(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              try {
                let rid = deletingRelationId;
                if (!rid) {
                  const res = await GetProcessRisksService();
                  const raw = res?.data;
                  const list: any[] = Array.isArray(raw)
                    ? (Array.isArray(raw[0]) ? raw[0] : raw.filter((it: any) => typeof it === 'object' && it))
                    : Array.isArray((raw as any)?.data)
                      ? (raw as any).data
                      : [];
                  const found = list.find((it: any) => String(it?.risk?.id ?? '') === String(riskId) && String(it?.process?.id ?? '') === String(deletingProcessId ?? ''));
                  rid = Number(found?.id);
                  if (!rid || !Number.isFinite(rid)) throw new Error('No se pudo identificar la relación');
                }
                await DeleteProcessRiskRelationService(rid as number);
                toast.success('Relación eliminada');
                setOpenDeleteConfirm(false);
                setDeletingRelationId(null);
                setDeletingProcessId(null);
                await fetchExpandedData();
              } catch (e) {
                console.error(e);
                toast.error('Error al eliminar la relación');
              }
            }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
      {nodeId === 'process' && (
        <RiskTableJobProcessLinkModal
          open={openJobLinkModal}
          onClose={() => setOpenJobLinkModal(false)}
          onSuccess={fetchExpandedData}
          processId={selectedProcessId}
        />
      )}
      {nodeId === 'tool' && (
        <RiskTableToolCreateModal
          open={openToolCreateModal}
          onClose={() => setOpenToolCreateModal(false)}
          onSuccess={fetchExpandedData}
          riskId={riskId}
          parentNodeId={nodeId}
        />
      )}
      {nodeId === 'measure' && (
        <RiskTableMeasureCreateModal
          open={openMeasureCreateModal}
          onClose={() => setOpenMeasureCreateModal(false)}
          onSuccess={fetchExpandedData}
          riskId={riskId}
          parentNodeId={nodeId}
        />
      )}
    </Card>
  );
}
