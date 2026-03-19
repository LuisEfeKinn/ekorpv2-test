'use client';

import '@xyflow/react/dist/style.css';

import type { Edge, Node } from '@xyflow/react';
import type { Theme, SxProps } from '@mui/material/styles';

import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  MiniMap,
  Controls,
  ReactFlow,
  Background,
  useEdgesState,
  useNodesState,
  BackgroundVariant,
} from '@xyflow/react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { GetDocumentsListService } from 'src/services/architecture/process/processRelations.service';
import { DeleteFeedbackObjectService } from 'src/services/architecture/business/organizational-unit-feedbacks.service';
import {
  type OrganizationalUnitMapNode,
  type OrganizationalUnitRelation,
  SaveOrganizationalUnitDocumentService,
  SaveOrganizationalUnitRelationService,
  GetOrganizationalUnitPaginationService,
  type OrganizationalUnitDocumentRelation,
  UpdateOrganizationalUnitDocumentService,
  UpdateOrganizationalUnitRelationService,
  DeleteOrganizationalUnitDocumentService,
  DeleteOrganizationalUnitRelationService,
  normalizeOrganizationalUnitListResponse,
  GetOrganizationalUnitDocumentByIdService,
  GetOrganizationalUnitRelationByIdService,
  GetOrganizationalUnitMapExpandByIdService,
} from 'src/services/organization/organizationalUnit.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { OrganizationalUnitLessonsProposalsDrawer } from './feedbacks/organizational-unit-lessons-proposals-drawer';
import {
  type NodeDataChild,
  type NodeDataCentral,
  organizationalStructureNodeTypes,
} from './organizational-structure-node-types';

type Props = {
  organizationalUnitId: string;
  nodeId: string;
  sx?: SxProps<Theme>;
};

type Option = { value: number; label: string };

type FeedbackObjectChildNode = {
  id: string | number;
  label: string;
  relationId?: number;
  feedbackId?: number;
  data?: {
    feedback?: unknown;
  } & Record<string, unknown>;
  children?: FeedbackObjectChildNode[];
};

type OrgRelationChildNode = {
  id: string | number;
  label: string;
  data?: Record<string, unknown> | null;
};

type OrgDocumentChildNode = {
  id: string | number;
  label: string;
  data?: Record<string, unknown> | null;
};

export function OrganizationalStructureExpandedDiagram({ organizationalUnitId, nodeId, sx }: Props) {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslate('organization');

  const primaryMain = theme.palette?.primary?.main || '#000000';
  const primaryDark = theme.palette?.primary?.dark || '#000000';
  const secondaryMain = theme.palette?.secondary?.main || '#000000';
  const infoMain = theme.palette?.info?.main || '#000000';
  const successMain = theme.palette?.success?.main || '#000000';
  const warningMain = theme.palette?.warning?.main || '#000000';
  const errorMain = theme.palette?.error?.main || '#000000';
  const backgroundPaper = theme.palette?.background?.paper || '#FFFFFF';
  const divider = theme.palette?.divider || '#000000';

  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState<OrganizationalUnitMapNode | null>(null);
  const [parentLabel, setParentLabel] = useState('');
  const [parentNodeId, setParentNodeId] = useState<string | null>(null);

  const [lessonProposalOpen, setLessonProposalOpen] = useState(false);
  const [isLessonLearned, setIsLessonLearned] = useState(true);
  const [relationDrawerOpen, setRelationDrawerOpen] = useState(false);
  const [documentDrawerOpen, setDocumentDrawerOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<unknown>(null);
  const [editFeedbackId, setEditFeedbackId] = useState<number | null>(null);

  const [relationEditMode, setRelationEditMode] = useState(false);
  const [relationEditData, setRelationEditData] = useState<unknown>(null);
  const [relationEditId, setRelationEditId] = useState<number | null>(null);

  const [documentEditMode, setDocumentEditMode] = useState(false);
  const [documentEditData, setDocumentEditData] = useState<unknown>(null);
  const [documentEditId, setDocumentEditId] = useState<number | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteKind, setDeleteKind] = useState<'feedback' | 'relation' | 'document' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FeedbackObjectChildNode | OrgRelationChildNode | OrgDocumentChildNode | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const isRelationsNodeKey = nodeId === 'rel';
  const isDocumentsNodeKey = nodeId === 'doc';

  const getRelationId = useCallback((child: OrgRelationChildNode) => {
    const asNumber = Number(child.id);
    if (Number.isFinite(asNumber)) return asNumber;
    const raw = child.data;
    const id = raw && typeof raw === 'object' && 'id' in raw ? Number(raw.id) : NaN;
    return Number.isFinite(id) ? id : null;
  }, []);

  const getRelationUnit2Id = useCallback((child: OrgRelationChildNode) => {
    const data = child.data;
    if (!data || typeof data !== 'object') return null;
    const value = (data.organizationalUnit2Id ??
      (data.organizationalUnit2 as { id?: unknown } | undefined)?.id ??
      (data.organizationalUnit as { id?: unknown } | undefined)?.id) as unknown;
    const id = Number(value);
    return Number.isFinite(id) ? id : null;
  }, []);

  const getDocumentRelationId = useCallback((child: OrgDocumentChildNode) => {
    const asNumber = Number(child.id);
    if (Number.isFinite(asNumber)) return asNumber;
    const raw = child.data;
    const id = raw && typeof raw === 'object' && 'id' in raw ? Number(raw.id) : NaN;
    return Number.isFinite(id) ? id : null;
  }, []);

  const existingRelationUnit2Ids = useMemo(() => {
    if (!isRelationsNodeKey) return [];
    const children = mapData?.children;
    if (!Array.isArray(children)) return [];
    const ids = new Set<number>();
    children.forEach((c) => {
      const child = c as unknown as OrgRelationChildNode;
      const id = getRelationUnit2Id(child);
      if (id != null) ids.add(id);
    });
    return Array.from(ids);
  }, [getRelationUnit2Id, isRelationsNodeKey, mapData?.children]);

  const existingDocumentRelationIds = useMemo(() => {
    if (!isDocumentsNodeKey) return [];
    const children = mapData?.children;
    if (!Array.isArray(children)) return [];
    const ids = new Set<number>();
    children.forEach((c) => {
      const child = c as unknown as OrgDocumentChildNode;
      const id = getDocumentRelationId(child);
      if (id != null) ids.add(id);
    });
    return Array.from(ids);
  }, [getDocumentRelationId, isDocumentsNodeKey, mapData?.children]);

  const getFeedbackId = useCallback((child: FeedbackObjectChildNode) => {
    if (typeof child.feedbackId === 'number' && Number.isFinite(child.feedbackId)) return child.feedbackId;
    const nested = child.data?.feedback;
    if (nested && typeof nested === 'object' && 'id' in (nested as Record<string, unknown>)) {
      const nestedId = Number((nested as Record<string, unknown>).id);
      if (Number.isFinite(nestedId)) return nestedId;
    }
    return null;
  }, []);

  const getFeedbackObjectRelationId = useCallback((child: FeedbackObjectChildNode) => {
    if (typeof child.relationId === 'number' && Number.isFinite(child.relationId)) return child.relationId;
    const asNumber = Number(child.id);
    if (Number.isFinite(asNumber)) return asNumber;
    return null;
  }, []);

  const getFeedbackInitialData = useCallback((child: FeedbackObjectChildNode) => child.data && typeof child.data === 'object' && 'feedback' in child.data ? child.data.feedback : child.data, []);

  const handleEditFeedback = useCallback(
    (child: FeedbackObjectChildNode, type: 'lesson' | 'proposal') => {
      setEditMode(true);
      setEditData(getFeedbackInitialData(child));
      setEditFeedbackId(getFeedbackId(child));
      setIsLessonLearned(type === 'lesson');
      setLessonProposalOpen(true);
    },
    [getFeedbackId, getFeedbackInitialData]
  );

  const handleEditRelation = useCallback(
    (child: OrgRelationChildNode) => {
      setRelationEditMode(true);
      setRelationEditData(child.data ?? child);
      setRelationEditId(getRelationId(child));
      setRelationDrawerOpen(true);
    },
    [getRelationId]
  );

  const handleEditDocument = useCallback(
    (child: OrgDocumentChildNode) => {
      setDocumentEditMode(true);
      setDocumentEditData(child.data ?? child);
      setDocumentEditId(getDocumentRelationId(child));
      setDocumentDrawerOpen(true);
    },
    [getDocumentRelationId]
  );

  const confirmDelete = useCallback((child: FeedbackObjectChildNode, _type: 'lesson' | 'proposal') => {
    setDeleteKind('feedback');
    setDeleteTarget(child);
    setConfirmOpen(true);
  }, []);

  const confirmDeleteRelation = useCallback((child: OrgRelationChildNode) => {
    setDeleteKind('relation');
    setDeleteTarget(child);
    setConfirmOpen(true);
  }, []);

  const confirmDeleteDocument = useCallback((child: OrgDocumentChildNode) => {
    setDeleteKind('document');
    setDeleteTarget(child);
    setConfirmOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteKind || !deleteTarget) return;
    try {
      if (deleteKind === 'feedback') {
        const relationId = getFeedbackObjectRelationId(deleteTarget as FeedbackObjectChildNode);
        if (relationId === null) throw new Error('Invalid feedback relation id');
        await DeleteFeedbackObjectService(relationId);
      } else if (deleteKind === 'relation') {
        const id = getRelationId(deleteTarget as OrgRelationChildNode);
        if (id === null) throw new Error('Invalid relation id');
        await DeleteOrganizationalUnitRelationService(id);
      } else if (deleteKind === 'document') {
        const id = getDocumentRelationId(deleteTarget as OrgDocumentChildNode);
        if (id === null) throw new Error('Invalid document relation id');
        await DeleteOrganizationalUnitDocumentService(id);
      }

      toast.success(t('organization.feedbacks.deleted', { defaultValue: 'Eliminado correctamente' }));
      setReloadKey((k) => k + 1);
    } catch {
      toast.error(t('organization.feedbacks.deleteError', { defaultValue: 'Error al eliminar' }));
    } finally {
      setConfirmOpen(false);
      setDeleteKind(null);
      setDeleteTarget(null);
    }
  }, [
    deleteKind,
    deleteTarget,
    getDocumentRelationId,
    getFeedbackObjectRelationId,
    getRelationId,
    t,
  ]);

  const colors = useMemo(
    () => [
      primaryMain,
      secondaryMain,
      infoMain,
      successMain,
      warningMain,
      errorMain,
      primaryDark,
    ],
    [primaryMain, secondaryMain, infoMain, successMain, warningMain, errorMain, primaryDark]
  );

  const handleOpenRelationDrawer = useCallback(() => {
    setRelationEditMode(false);
    setRelationEditData(null);
    setRelationEditId(null);
    setRelationDrawerOpen(true);
  }, []);

  const handleCloseRelationDrawer = useCallback(() => {
    setRelationDrawerOpen(false);
  }, []);

  const handleOpenDocumentDrawer = useCallback(() => {
    setDocumentEditMode(false);
    setDocumentEditData(null);
    setDocumentEditId(null);
    setDocumentDrawerOpen(true);
  }, []);

  const handleCloseDocumentDrawer = useCallback(() => {
    setDocumentDrawerOpen(false);
  }, []);

  const buildGraph = useCallback(
    (data: OrganizationalUnitMapNode) => {
      const count = data.children?.length || 0;
      const centerX = 0;
      const centerY = 0;
      const centralWidth = 320;
      const centralHeight = 200;
      const childWidth = 220;
      const childHeight = 180;
      const maxPerRing = 8;
      const baseRadius = 320;
      const ringSpacing = 220;

      const numericNodeId = Number(nodeId);
      const isNumericNodeId = Number.isFinite(numericNodeId) && String(numericNodeId) === nodeId;
      const currentLabelLower = String(data.label ?? '').toLowerCase();
      const isLessonsLeaf =
        nodeId === 'lec' ||
        (!isNumericNodeId && (currentLabelLower.includes('lecciones') || currentLabelLower.includes('lessons')));
      const isProposalsLeaf =
        nodeId === 'prp' ||
        (!isNumericNodeId &&
          (currentLabelLower.includes('propuestas') ||
            currentLabelLower.includes('mejora') ||
            currentLabelLower.includes('proposals')));
      const feedbackType: 'lesson' | 'proposal' | null = isLessonsLeaf ? 'lesson' : isProposalsLeaf ? 'proposal' : null;
      const isFeedbackLeafNode = feedbackType !== null;

      const centralNode: Node = {
        id: 'central',
        type: 'central',
        position: { x: centerX - centralWidth / 2, y: centerY - centralHeight / 2 },
        data: { id: String(data.id), label: String(data.label || t('organization.map.unnamed')) } satisfies NodeDataCentral,
        draggable: true,
      };

      const childNodes: Node[] = (data.children || []).map((child, index) => {
        const ringIndex = Math.floor(index / maxPerRing);
        const ringCount = Math.min(maxPerRing, count - ringIndex * maxPerRing);
        const angleStep = (2 * Math.PI) / Math.max(ringCount, 1);
        const angle = (index % maxPerRing) * angleStep - Math.PI / 2;
        const radius = baseRadius + ringIndex * ringSpacing;
        const x = centerX + Math.cos(angle) * radius - childWidth / 2;
        const y = centerY + Math.sin(angle) * radius - childHeight / 2;
        const color = colors[index % colors.length];
        const typedChild = child as unknown as FeedbackObjectChildNode;
        const childLabelLower = String(typedChild.label || '').toLowerCase();
        const isRelationsChild = childLabelLower.includes('relacion') || childLabelLower.includes('relationship');
        const isDocumentsChild =
          childLabelLower.includes('document') || childLabelLower.includes('documento') || childLabelLower.includes('doc');
        const asRelationChild = child as unknown as OrgRelationChildNode;
        const asDocumentChild = child as unknown as OrgDocumentChildNode;

        return {
          id: String(typedChild.id),
          type: 'child',
          position: { x, y },
          data: {
            id: String(typedChild.id),
            label: String(typedChild.label || t('organization.map.unnamed')),
            color,
            onClick: () => {
              if (isFeedbackLeafNode) {
                handleEditFeedback(typedChild, feedbackType);
                return;
              }
              if (isRelationsNodeKey) {
                handleEditRelation(asRelationChild);
                return;
              }
              if (isDocumentsNodeKey) {
                handleEditDocument(asDocumentChild);
                return;
              }
              if (isRelationsChild) {
                handleOpenRelationDrawer();
                return;
              }
              if (isDocumentsChild) {
                handleOpenDocumentDrawer();
                return;
              }
              router.push(
                paths.dashboard.architecture.organizationalStructureTableMapExpand(
                  String(organizationalUnitId),
                  String(typedChild.id)
                )
              );
            },
            onEdit: isFeedbackLeafNode
              ? () => handleEditFeedback(typedChild, feedbackType)
              : isRelationsNodeKey
                ? () => handleEditRelation(asRelationChild)
                : isDocumentsNodeKey
                  ? () => handleEditDocument(asDocumentChild)
                  : undefined,
            onDelete: isFeedbackLeafNode
              ? () => confirmDelete(typedChild, feedbackType)
              : isRelationsNodeKey
                ? () => confirmDeleteRelation(asRelationChild)
                : isDocumentsNodeKey
                  ? () => confirmDeleteDocument(asDocumentChild)
                  : undefined,
          } satisfies NodeDataChild,
          draggable: true,
        };
      });

      const newEdges: Edge[] = (data.children || []).map((child, index) => {
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
      confirmDeleteDocument,
      confirmDeleteRelation,
      handleEditFeedback,
      handleEditDocument,
      handleEditRelation,
      handleOpenDocumentDrawer,
      handleOpenRelationDrawer,
      isDocumentsNodeKey,
      isRelationsNodeKey,
      nodeId,
      organizationalUnitId,
      router,
      setEdges,
      setNodes,
      t,
    ]
  );

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      try {
        const response = await GetOrganizationalUnitMapExpandByIdService(String(organizationalUnitId), nodeId);
        if (!active) return;

        const data = response.data;
        setMapData(data);

        // Aquí asumimos que el padre se puede inferir o que no es crítico para este requerimiento inmediato,
        // o que el backend podría devolver info del padre.
        // Por ahora, para simplificar y cumplir con el requerimiento de usar la ruta,
        // usaremos el label del nodo actual si no hay info del padre, o lo dejaremos vacío.
        // Si se necesita el label del padre, habría que ver si el endpoint lo devuelve.
        // Basado en el json del usuario, no viene info del padre en la respuesta directa del nodo.
        // Pero podríamos mantener la lógica de navegación "Atrás" basada en historial o simplemente volver al root.

        // NOTA: Para mantener la funcionalidad de "Atrás" correctamente, lo ideal sería que el backend devolviera el parentId.
        // Si no, la navegación "Atrás" podría ser solo al nivel superior (root) si no tenemos el parentId.
        // En el código original se calculaba `parent` usando `findPath` desde el root.
        // Al usar el endpoint directo, perdemos el contexto del árbol completo a menos que lo pidamos.
        // Sin embargo, el usuario pidió explícitamente "usa la ruta sobre la ruta de mapa como en el resto de /expand/{nodeId}".

        // Ajuste: Si el nodo es hijo directo del root, el parentId sería el organizationalUnitId (pero ese es el ID de la unidad, no necesariamente el nodo padre en el grafo si es profundo).
        // Por ahora dejaremos parentNodeId como null para que el botón "Atrás" lleve al mapa principal,
        // o implementaremos una lógica simple si el usuario navega en profundidad (que parece ser lo que hace el router).

        setParentLabel(data?.label || '');
        setParentNodeId(null);

        buildGraph(data);
      } catch {
        if (active) {
          toast.error(t('organization.map.loadError'));
          setMapData(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    if (organizationalUnitId && nodeId) run();
    return () => {
      active = false;
    };
  }, [buildGraph, nodeId, organizationalUnitId, reloadKey, t]);

  const labelLower = String(mapData?.label ?? '').toLowerCase();
  const isLessonsLearnedNode = nodeId === 'lec' || labelLower.includes('lecciones') || labelLower.includes('lessons');
  const isProposalsNode = nodeId === 'prp' || labelLower.includes('propuestas') || labelLower.includes('mejora') || labelLower.includes('proposals');
  const isRelationsNode = nodeId === 'rel' || labelLower.includes('relacion') || labelLower.includes('relationship');
  const isDocumentsNode =
    nodeId === 'doc' || labelLower.includes('document') || labelLower.includes('documento') || labelLower.includes('documents');

  const showRelate = isLessonsLearnedNode || isProposalsNode;
  const relateLabel = isLessonsLearnedNode
    ? t('organization.expanded.addLesson')
    : isProposalsNode
      ? t('organization.expanded.addProposal')
      : t('organization.expanded.relate');
  const showRelationAction = isRelationsNode;
  const relationActionLabel = t('organization.relations.buttonLabel');
  const showDocumentAction = isDocumentsNode;
  const documentActionLabel = t('organization.documents.buttonLabel');

  if (loading) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 600 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="body2" color="text.secondary">{t('organization.map.loading')}</Typography>
        </Stack>
      </Box>
    );
  }

  if (!mapData) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 600 }}>
        <Typography variant="body1" color="text.secondary">{t('organization.map.noData')}</Typography>
      </Box>
    );
  }

  return (
    <Card sx={{ width: '100%', position: 'relative', overflow: 'hidden', bgcolor: 'background.neutral', ...sx }}>
      <Box sx={{ position: 'absolute', top: { xs: 12, sm: 16 }, left: { xs: 12, sm: 16 }, zIndex: 100 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Paper elevation={4} sx={{ px: 2, py: 1, borderRadius: 2, bgcolor: alpha(backgroundPaper, 0.95), backdropFilter: 'blur(10px)', border: `1px solid ${alpha(divider, 0.1)}` }}>
            <Tooltip title="Volver">
              <IconButton
                size="small"
                onClick={() => {
                  if (!parentNodeId) {
                    router.push(paths.dashboard.architecture.organizationalStructureTableMap(String(organizationalUnitId)));
                    return;
                  }
                  router.push(
                    paths.dashboard.architecture.organizationalStructureTableMapExpand(
                      String(organizationalUnitId),
                      String(parentNodeId)
                    )
                  );
                }}
                sx={{ bgcolor: alpha(primaryMain, 0.08), '&:hover': { bgcolor: alpha(primaryMain, 0.16) } }}
              >
                <Iconify icon="eva:arrow-ios-back-fill" width={18} />
              </IconButton>
            </Tooltip>
          </Paper>

          {parentLabel && (
            <Paper elevation={2} sx={{ px: 2, py: 1, borderRadius: 2, bgcolor: alpha(backgroundPaper, 0.92), backdropFilter: 'blur(8px)', border: `1px solid ${alpha(divider, 0.12)}` }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>{parentLabel}</Typography>
            </Paper>
          )}
        </Stack>
      </Box>

      {(showRelate || showRelationAction || showDocumentAction) && (
        <Box sx={{ position: 'absolute', top: { xs: 12, sm: 16 }, right: { xs: 12, sm: 16 }, zIndex: 100 }}>
          <Stack spacing={1} alignItems="flex-end">
            {showRelate && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={() => {
                  if (isLessonsLearnedNode || isProposalsNode) {
                    setIsLessonLearned(isLessonsLearnedNode);
                    setEditMode(false);
                    setEditData(null);
                    setEditFeedbackId(null);
                    setLessonProposalOpen(true);
                  }
                }}
                sx={{ borderRadius: 2, boxShadow: 4 }}
              >
                {relateLabel}
              </Button>
            )}
            {showRelationAction && (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={handleOpenRelationDrawer}
                sx={{ borderRadius: 2, boxShadow: 4 }}
              >
                {relationActionLabel}
              </Button>
            )}
            {showDocumentAction && (
              <Button
                variant="contained"
                color="info"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={handleOpenDocumentDrawer}
                sx={{ borderRadius: 2, boxShadow: 4 }}
              >
                {documentActionLabel}
              </Button>
            )}
          </Stack>
        </Box>
      )}

      <Box sx={{ position: 'absolute', bottom: { xs: 12, sm: 16 }, left: { xs: 12, sm: 16 }, zIndex: 100 }}>
        <Paper elevation={4} sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(backgroundPaper, 0.95), backdropFilter: 'blur(10px)', border: `1px solid ${alpha(divider, 0.1)}` }}>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: alpha(theme.palette.text.secondary, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Iconify icon="solar:magnifer-zoom-in-bold" width={10} sx={{ color: 'text.secondary' }} />
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                {t('organization.map.zoom')}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: alpha(theme.palette.text.secondary, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Iconify icon="eva:move-fill" width={10} sx={{ color: 'text.secondary' }} />
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                {t('organization.map.move')}
              </Typography>
            </Stack>
          </Stack>
        </Paper>
      </Box>

      <Box sx={{ width: '100%', height: 850, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={organizationalStructureNodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.1, duration: 800 }}
          minZoom={0.1}
          maxZoom={1.5}
          nodesDraggable={false}
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
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable maskColor={alpha(backgroundPaper, 0.8)} />
          <Background color={alpha(primaryMain, 0.08)} gap={24} size={2} variant={BackgroundVariant.Dots} />
        </ReactFlow>
      </Box>

      <OrganizationalUnitLessonsProposalsDrawer
        open={lessonProposalOpen}
        onClose={() => {
          setLessonProposalOpen(false);
          setEditMode(false);
          setEditData(null);
          setEditFeedbackId(null);
        }}
        onSuccess={() => setReloadKey((k) => k + 1)}
        orgUnitId={organizationalUnitId}
        isLessonLearned={isLessonLearned}
        editMode={editMode}
        initialData={editData}
        feedbackId={editFeedbackId ? String(editFeedbackId) : undefined}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t('organization.feedbacks.deleteTitle', { defaultValue: 'Confirmar eliminación' })}
        content={t('organization.feedbacks.deleteConfirm', {
          defaultValue: '¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.',
        })}
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            {t('organization.feedbacks.deleteAction', { defaultValue: 'Eliminar' })}
          </Button>
        }
      />

      <OrganizationalUnitRelationsDrawer
        open={relationDrawerOpen}
        onClose={() => {
          handleCloseRelationDrawer();
          setRelationEditMode(false);
          setRelationEditData(null);
          setRelationEditId(null);
        }}
        onSuccess={() => {
          handleCloseRelationDrawer();
          setReloadKey((k) => k + 1);
        }}
        defaultOrganizationalUnitId={Number(organizationalUnitId)}
        editMode={relationEditMode}
        initialData={relationEditData}
        relationId={relationEditId ?? undefined}
        existingUnitIds={existingRelationUnit2Ids}
      />

      <OrganizationalUnitDocumentsDrawer
        open={documentDrawerOpen}
        onClose={() => {
          handleCloseDocumentDrawer();
          setDocumentEditMode(false);
          setDocumentEditData(null);
          setDocumentEditId(null);
        }}
        onSuccess={() => {
          handleCloseDocumentDrawer();
          setReloadKey((k) => k + 1);
        }}
        organizationalUnitId={Number(organizationalUnitId)}
        editMode={documentEditMode}
        initialData={documentEditData}
        relationId={documentEditId ?? undefined}
        existingDocumentRelationIds={existingDocumentRelationIds}
      />
    </Card>
  );
}

type RelationsDrawerProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultOrganizationalUnitId: number;
  editMode?: boolean;
  initialData?: unknown;
  relationId?: number;
  existingUnitIds?: number[];
};

type RelationFormValues = {
  nombre: string;
  nombreReversa: string;
  organizationalUnit1Id: number;
  organizationalUnit2Id: number;
};

type DocumentFormValues = {
  documentId: number;
  observations: string;
};

function normalizeList(raw: any): any[] {
  if (Array.isArray(raw)) {
    if (Array.isArray(raw[0])) return raw[0];
    return raw;
  }
  if (raw && typeof raw === 'object') {
    if (Array.isArray(raw.data)) return raw.data;
    if (raw.data && typeof raw.data === 'object') {
      if (Array.isArray((raw.data as any).data)) return (raw.data as any).data;
      if (Array.isArray((raw.data as any).items)) return (raw.data as any).items;
    }
    if (Array.isArray((raw as any).items)) return (raw as any).items;
    if (typeof (raw as any).statusCode === 'number' && (raw as any).data) {
      const inner = (raw as any).data;
      if (Array.isArray(inner)) return inner;
      if (inner && typeof inner === 'object') {
        if (Array.isArray(inner.data)) return inner.data;
        if (Array.isArray(inner.items)) return inner.items;
      }
    }
  }
  return [];
}

function OrganizationalUnitRelationsDrawer({
  open,
  onClose,
  onSuccess,
  defaultOrganizationalUnitId,
  editMode,
  initialData,
  relationId,
  existingUnitIds,
}: RelationsDrawerProps) {
  const { t } = useTranslate('organization');
  const [unitOptions, setUnitOptions] = useState<Option[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [editingRelation, setEditingRelation] = useState<OrganizationalUnitRelation | null>(null);

  const schema = useMemo(
    () =>
      zod.object({
        nombre: zod.string().min(1, { message: t('organization.relations.requiredName') }),
        nombreReversa: zod.string().min(1, { message: t('organization.relations.requiredReverseName') }),
        organizationalUnit1Id: zod
          .number()
          .min(1, { message: t('organization.relations.requiredUnit1') }),
        organizationalUnit2Id: zod
          .number()
          .min(1, { message: t('organization.relations.requiredUnit2') }),
      }),
    [t]
  );

  const normalizedDefaultId = Number.isFinite(defaultOrganizationalUnitId) ? defaultOrganizationalUnitId : 0;
  const excludedUnitIds = useMemo(() => new Set(existingUnitIds ?? []), [existingUnitIds]);

  const defaultValues = useMemo<RelationFormValues>(
    () => ({
      nombre: '',
      nombreReversa: '',
      organizationalUnit1Id: normalizedDefaultId,
      organizationalUnit2Id: 0,
    }),
    [normalizedDefaultId]
  );

  const methods = useForm<RelationFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const {
    setValue,
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (!open) return;
    reset(defaultValues);
    setEditingRelation(null);
  }, [defaultValues, editMode, initialData, normalizedDefaultId, open, reset, setValue]);

  useEffect(() => {
    let active = true;
    if (!open) return () => {
      active = false;
    };

    const prefillFromObject = (obj: Record<string, unknown>) => {
      setValue('nombre', typeof obj.nombre === 'string' ? obj.nombre : '');
      setValue('nombreReversa', typeof obj.nombreReversa === 'string' ? obj.nombreReversa : '');

      const unit1 = Number(
        (obj.organizationalUnit1Id ??
          (obj.organizationalUnit1 as { id?: unknown } | undefined)?.id ??
          normalizedDefaultId) as unknown
      );
      const unit2 = Number((obj.organizationalUnit2Id ?? (obj.organizationalUnit2 as { id?: unknown } | undefined)?.id) as unknown);

      setValue('organizationalUnit1Id', Number.isFinite(unit1) ? unit1 : normalizedDefaultId);
      setValue('organizationalUnit2Id', Number.isFinite(unit2) ? unit2 : 0);
    };

    const normalizeRelationResponse = (raw: unknown): OrganizationalUnitRelation | null => {
      if (!raw || typeof raw !== 'object') return null;
      const obj = raw as Record<string, unknown>;
      const maybe = obj.data && typeof obj.data === 'object' ? (obj.data as Record<string, unknown>) : obj;
      const id = Number((maybe as Record<string, unknown>).id);
      if (!Number.isFinite(id)) return null;
      return maybe as unknown as OrganizationalUnitRelation;
    };

    const run = async () => {
      if (!editMode || !relationId) {
        if (editMode && initialData && typeof initialData === 'object') {
          const raw = initialData as Record<string, unknown>;
          const data = (raw.data && typeof raw.data === 'object' ? (raw.data as Record<string, unknown>) : raw) as Record<
            string,
            unknown
          >;
          prefillFromObject(data);
        }
        return;
      }

      try {
        const res = await GetOrganizationalUnitRelationByIdService(relationId);
        if (!active) return;
        const relation = normalizeRelationResponse(res.data);
        setEditingRelation(relation);

        if (relation) {
          prefillFromObject(relation as unknown as Record<string, unknown>);
        }
      } catch {
        if (!active) return;
        setEditingRelation(null);
        if (initialData && typeof initialData === 'object') {
          const raw = initialData as Record<string, unknown>;
          const data = (raw.data && typeof raw.data === 'object' ? (raw.data as Record<string, unknown>) : raw) as Record<
            string,
            unknown
          >;
          prefillFromObject(data);
        }
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [editMode, initialData, normalizedDefaultId, onClose, open, relationId, setValue]);

  useEffect(() => {
    if (!open) return;

    const loadUnits = async () => {
      try {
        setLoadingUnits(true);
        const response = await GetOrganizationalUnitPaginationService({ page: 1, perPage: 1000 });
        const list = normalizeOrganizationalUnitListResponse(response?.data || []);

        const options = list
          .map((item) => ({
            value: Number(item.id),
            label: String(item.name || item.code || `#${item.id}`),
          }))
          .filter((opt) => Number.isFinite(opt.value) && opt.value > 0);

        if (normalizedDefaultId > 0 && !options.some((opt) => opt.value === normalizedDefaultId)) {
          options.unshift({ value: normalizedDefaultId, label: `#${normalizedDefaultId}` });
        }

        const unit2IdFromRelation =
          editingRelation && editingRelation.organizationalUnit2
            ? Number(editingRelation.organizationalUnit2.id)
            : null;
        const unit2LabelFromRelation =
          editingRelation && editingRelation.organizationalUnit2
            ? String(editingRelation.organizationalUnit2.name || editingRelation.organizationalUnit2.code || `#${editingRelation.organizationalUnit2.id}`)
            : null;
        if (unit2IdFromRelation && Number.isFinite(unit2IdFromRelation) && unit2LabelFromRelation) {
          if (!options.some((opt) => opt.value === unit2IdFromRelation)) {
            options.unshift({ value: unit2IdFromRelation, label: unit2LabelFromRelation });
          }
        }

        setUnitOptions(options);
      } catch {
        setUnitOptions([]);
      } finally {
        setLoadingUnits(false);
      }
    };

    loadUnits();
  }, [editingRelation, normalizedDefaultId, open]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload = {
        nombre: data.nombre,
        nombreReversa: data.nombreReversa,
        organizationalUnit1: { id: Number(normalizedDefaultId) },
        organizationalUnit2: { id: Number(data.organizationalUnit2Id) },
      };

      if (editMode && relationId) {
        await UpdateOrganizationalUnitRelationService(relationId, payload);
        toast.success(t('organization.relations.updated', { defaultValue: 'Relación actualizada' }));
      } else {
        await SaveOrganizationalUnitRelationService(payload);
        toast.success(t('organization.relations.success'));
      }
      onSuccess();
      onClose();
    } catch {
      toast.error(
        editMode
          ? t('organization.relations.updateError', { defaultValue: 'Error al actualizar la relación' })
          : t('organization.relations.error')
      );
    }
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="right"
      PaperProps={{ sx: { width: { xs: 1, sm: 420, md: 520 } } }}
    >
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          {editMode
            ? t('organization.relations.editTitle', { defaultValue: 'Editar Relación' })
            : t('organization.relations.title')}
        </Typography>

        <Form methods={methods} onSubmit={onSubmit}>
          <Stack spacing={2.5}>
            <Field.Text name="nombre" label={t('organization.relations.name')} />
            <Field.Text name="nombreReversa" label={t('organization.relations.reverseName')} />

            <Field.Select
              name="organizationalUnit1Id"
              label={t('organization.relations.unit1')}
              onChange={(event) => {
                const value = Number(event.target.value);
                setValue('organizationalUnit1Id', value || 0, { shouldValidate: true });
              }}
              disabled
            >
              <MenuItem value={normalizedDefaultId}>
                {(unitOptions.find((o) => o.value === normalizedDefaultId)?.label ?? `#${normalizedDefaultId}`) as string}
              </MenuItem>
            </Field.Select>

            <Field.Select
              name="organizationalUnit2Id"
              label={t('organization.relations.unit2')}
              onChange={(event) => {
                const value = Number(event.target.value);
                setValue('organizationalUnit2Id', value || 0, { shouldValidate: true });
              }}
              disabled={Boolean(editMode)}
            >
              <MenuItem value={0} disabled>
                {loadingUnits
                  ? t('organization.relations.loading')
                  : t('organization.relations.select')}
              </MenuItem>
              {unitOptions
                .filter((opt) => opt.value !== normalizedDefaultId)
                .filter((opt) => (editMode ? true : !excludedUnitIds.has(opt.value)))
                .map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
            </Field.Select>

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button variant="outlined" color="inherit" onClick={onClose} disabled={isSubmitting}>
                {t('organization.relations.cancel')}
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                startIcon={
                  isSubmitting ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <Iconify icon={editMode ? 'solar:pen-bold' : 'mingcute:add-line'} />
                  )
                }
              >
                {editMode
                  ? t('organization.relations.saveChanges', { defaultValue: 'Guardar Cambios' })
                  : t('organization.relations.save')}
              </Button>
            </Stack>
          </Stack>
        </Form>
      </Box>
    </Drawer>
  );
}

type DocumentsDrawerProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organizationalUnitId: number;
  editMode?: boolean;
  initialData?: unknown;
  relationId?: number;
  existingDocumentRelationIds?: number[];
};

function OrganizationalUnitDocumentsDrawer({
  open,
  onClose,
  onSuccess,
  organizationalUnitId,
  editMode,
  initialData,
  relationId,
  existingDocumentRelationIds,
}: DocumentsDrawerProps) {
  const { t } = useTranslate('organization');
  const [documentOptions, setDocumentOptions] = useState<Option[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [excludedDocumentIds, setExcludedDocumentIds] = useState<Set<number>>(new Set());
  const [editingDocumentRelation, setEditingDocumentRelation] = useState<OrganizationalUnitDocumentRelation | null>(null);

  const schema = useMemo(
    () =>
      zod.object({
        documentId: zod.number().min(1, { message: t('organization.documents.requiredDocument') }),
        observations: zod.string().min(1, { message: t('organization.documents.requiredObservations') }),
      }),
    [t]
  );

  const defaultValues = useMemo<DocumentFormValues>(
    () => ({
      documentId: 0,
      observations: '',
    }),
    []
  );

  const methods = useForm<DocumentFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const {
    setValue,
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (!open) return;
    reset(defaultValues);
    setEditingDocumentRelation(null);
    setExcludedDocumentIds(new Set());
  }, [defaultValues, editMode, initialData, open, reset, setValue]);

  useEffect(() => {
    let active = true;
    if (!open) return () => {
      active = false;
    };

    const run = async () => {
      if (editMode) {
        setExcludedDocumentIds(new Set());
        return;
      }

      const relationIds = (existingDocumentRelationIds ?? []).filter((n) => Number.isFinite(n) && n > 0);
      if (relationIds.length === 0) {
        setExcludedDocumentIds(new Set());
        return;
      }

      try {
        const results = await Promise.allSettled(
          relationIds.map(async (rid) => {
            const res = await GetOrganizationalUnitDocumentByIdService(rid);
            const raw = res.data as unknown;
            if (!raw || typeof raw !== 'object') return null;
            const obj = raw as Record<string, unknown>;
            const data = obj.data && typeof obj.data === 'object' ? (obj.data as Record<string, unknown>) : obj;
            const doc = data.document;
            if (!doc || typeof doc !== 'object') return null;
            const docId = Number((doc as Record<string, unknown>).id);
            return Number.isFinite(docId) ? docId : null;
          })
        );

        if (!active) return;
        const set = new Set<number>();
        results.forEach((r) => {
          if (r.status !== 'fulfilled') return;
          if (typeof r.value === 'number' && Number.isFinite(r.value)) set.add(r.value);
        });
        setExcludedDocumentIds(set);
      } catch {
        if (!active) return;
        setExcludedDocumentIds(new Set());
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [editMode, existingDocumentRelationIds, open]);

  useEffect(() => {
    let active = true;

    if (!open) {
      return () => {
        active = false;
      };
    }

    const prefillFromObject = (obj: Record<string, unknown>) => {
      const docId = Number((obj.documentId ?? (obj.document as { id?: unknown } | undefined)?.id) as unknown);
      setValue('documentId', Number.isFinite(docId) ? docId : 0);
      setValue('observations', typeof obj.observations === 'string' ? obj.observations : '');
    };

    const normalizeDocResponse = (raw: unknown): OrganizationalUnitDocumentRelation | null => {
      if (!raw || typeof raw !== 'object') return null;
      const obj = raw as Record<string, unknown>;
      const maybe = obj.data && typeof obj.data === 'object' ? (obj.data as Record<string, unknown>) : obj;
      const id = Number((maybe as Record<string, unknown>).id);
      if (!Number.isFinite(id)) return null;
      return maybe as unknown as OrganizationalUnitDocumentRelation;
    };

    const run = async () => {
      if (!editMode || !relationId) {
        if (editMode && initialData && typeof initialData === 'object') {
          const raw = initialData as Record<string, unknown>;
          const data = (raw.data && typeof raw.data === 'object' ? (raw.data as Record<string, unknown>) : raw) as Record<
            string,
            unknown
          >;
          prefillFromObject(data);
        }
        return;
      }

      try {
        const res = await GetOrganizationalUnitDocumentByIdService(relationId);
        if (!active) return;
        const rel = normalizeDocResponse(res.data);
        setEditingDocumentRelation(rel);
        if (rel) {
          prefillFromObject(rel as unknown as Record<string, unknown>);
        }
      } catch {
        if (!active) return;
        setEditingDocumentRelation(null);
        if (initialData && typeof initialData === 'object') {
          const raw = initialData as Record<string, unknown>;
          const data = (raw.data && typeof raw.data === 'object' ? (raw.data as Record<string, unknown>) : raw) as Record<
            string,
            unknown
          >;
          prefillFromObject(data);
        }
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [editMode, initialData, open, relationId, setValue]);

  useEffect(() => {
    if (!open) return;

    const loadDocuments = async () => {
      try {
        setLoadingDocuments(true);
        const response = await GetDocumentsListService({ page: 1, perPage: 1000 });
        const list = normalizeList(response?.data || []);
        const mapped = list
          .map((item: any) => ({
            value: Number(item?.id),
            label: String(item?.name || item?.label || item?.code || `#${item?.id}`),
          }))
          .filter((opt: Option) => Number.isFinite(opt.value) && opt.value > 0);
        const options = Array.from(new Map(mapped.map((o) => [o.value, o])).values());
        const currentDocId = editingDocumentRelation?.document ? Number(editingDocumentRelation.document.id) : null;
        const currentDocLabel =
          editingDocumentRelation?.document
            ? String(editingDocumentRelation.document.name || editingDocumentRelation.document.code || `#${editingDocumentRelation.document.id}`)
            : null;
        if (currentDocId && Number.isFinite(currentDocId) && currentDocLabel) {
          if (!options.some((o) => o.value === currentDocId)) {
            options.unshift({ value: currentDocId, label: currentDocLabel });
          }
        }

        const filtered =
          !editMode && excludedDocumentIds.size > 0 ? options.filter((o) => !excludedDocumentIds.has(o.value)) : options;
        setDocumentOptions(filtered);
      } catch {
        setDocumentOptions([]);
      } finally {
        setLoadingDocuments(false);
      }
    };

    loadDocuments();
  }, [editMode, editingDocumentRelation, excludedDocumentIds, open]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload = {
        observations: data.observations,
        organizationalUnit: { id: Number(organizationalUnitId) },
        document: { id: Number(data.documentId) },
      };
      if (editMode && relationId) {
        await UpdateOrganizationalUnitDocumentService(relationId, payload);
        toast.success(t('organization.documents.updated', { defaultValue: 'Documento actualizado' }));
      } else {
        await SaveOrganizationalUnitDocumentService(payload);
        toast.success(t('organization.documents.success'));
      }
      onSuccess();
      onClose();
    } catch {
      toast.error(
        editMode
          ? t('organization.documents.updateError', { defaultValue: 'Error al actualizar documento' })
          : t('organization.documents.error')
      );
    }
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="right"
      PaperProps={{ sx: { width: { xs: 1, sm: 420, md: 520 } } }}
    >
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          {editMode
            ? `${t('organization.documents.editTitle', { defaultValue: 'Editar Documento' })}${
                editingDocumentRelation?.document?.name
                  ? `: ${String(editingDocumentRelation.document.name)}`
                  : relationId
                    ? ` #${relationId}`
                    : ''
              }`
            : t('organization.documents.title')}
        </Typography>

        <Form methods={methods} onSubmit={onSubmit}>
          <Stack spacing={2.5}>
            <Field.Select
              name="documentId"
              label={t('organization.documents.select')}
              onChange={(event) => {
                const value = Number(event.target.value);
                setValue('documentId', value || 0, { shouldValidate: true });
              }}
              disabled={Boolean(editMode)}
            >
              <MenuItem value={0} disabled>
                {loadingDocuments
                  ? t('organization.documents.loading')
                  : t('organization.documents.selectPlaceholder')}
              </MenuItem>
              {documentOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Field.Select>

            <Field.Text
              name="observations"
              label={t('organization.documents.observations')}
              multiline
              minRows={3}
            />

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button variant="outlined" color="inherit" onClick={onClose} disabled={isSubmitting}>
                {t('organization.documents.cancel')}
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                startIcon={
                  isSubmitting ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <Iconify icon={editMode ? 'solar:pen-bold' : 'mingcute:add-line'} />
                  )
                }
              >
                {editMode
                  ? t('organization.documents.saveChanges', { defaultValue: 'Guardar Cambios' })
                  : t('organization.documents.save')}
              </Button>
            </Stack>
          </Stack>
        </Form>
      </Box>
    </Drawer>
  );
}
