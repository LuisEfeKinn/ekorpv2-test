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
import {
  type OrganizationalUnitMapNode,
  SaveOrganizationalUnitDocumentService,
  SaveOrganizationalUnitRelationService,
  GetOrganizationalUnitPaginationService,
  normalizeOrganizationalUnitListResponse,
  GetOrganizationalUnitMapExpandByIdService,
} from 'src/services/organization/organizationalUnit.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

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

export function OrganizationalStructureExpandedDiagram({ organizationalUnitId, nodeId, sx }: Props) {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslate('business');

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

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

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
    setRelationDrawerOpen(true);
  }, []);

  const handleCloseRelationDrawer = useCallback(() => {
    setRelationDrawerOpen(false);
  }, []);

  const handleOpenDocumentDrawer = useCallback(() => {
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

      const centralNode: Node = {
        id: 'central',
        type: 'central',
        position: { x: centerX - centralWidth / 2, y: centerY - centralHeight / 2 },
        data: { id: String(data.id), label: String(data.label || 'Sin nombre') } satisfies NodeDataCentral,
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
        const childLabelLower = String(child.label || '').toLowerCase();
        const isRelationsChild = childLabelLower.includes('relacion') || childLabelLower.includes('relationship');
        const isDocumentsChild =
          childLabelLower.includes('document') || childLabelLower.includes('documento') || childLabelLower.includes('doc');

        return {
          id: String(child.id),
          type: 'child',
          position: { x, y },
          data: {
            id: String(child.id),
            label: String(child.label || 'Sin nombre'),
            color,
            onClick: () => {
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
                  String(child.id)
                )
              );
            },
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
    [colors, handleOpenDocumentDrawer, handleOpenRelationDrawer, organizationalUnitId, router, setEdges, setNodes]
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
        
        setParentLabel(''); 
        setParentNodeId(null); 

        buildGraph(data);
      } catch {
        if (active) {
          toast.error('No se pudo cargar el mapa de estructura organizacional');
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
  }, [buildGraph, nodeId, organizationalUnitId, reloadKey]);

  const labelLower = String(mapData?.label ?? '').toLowerCase();
  const isLessonsLearnedNode = nodeId === 'lec' || labelLower.includes('lecciones') || labelLower.includes('lessons');
  const isProposalsNode = nodeId === 'prp' || labelLower.includes('propuestas') || labelLower.includes('mejora') || labelLower.includes('proposals');
  const isRelationsNode = nodeId === 'rel' || labelLower.includes('relacion') || labelLower.includes('relationship');
  const isDocumentsNode =
    nodeId === 'doc' || labelLower.includes('document') || labelLower.includes('documento') || labelLower.includes('documents');

  const showRelate = isLessonsLearnedNode || isProposalsNode;
  const relateLabel = isLessonsLearnedNode
    ? 'Agregar Lección Aprendida'
    : isProposalsNode
      ? 'Agregar Propuesta de Mejora'
      : 'Relacionar';
  const showRelationAction = isRelationsNode;
  const relationActionLabel = t('organizationalStructure.relations.buttonLabel');
  const showDocumentAction = isDocumentsNode;
  const documentActionLabel = t('organizationalStructure.documents.buttonLabel');

  if (loading) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 600 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="body2" color="text.secondary">Cargando mapa…</Typography>
        </Stack>
      </Box>
    );
  }

  if (!mapData) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 600 }}>
        <Typography variant="body1" color="text.secondary">No hay datos para mostrar</Typography>
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

      <Box sx={{ width: '100%', height: 850, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={organizationalStructureNodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
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
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable maskColor={alpha(backgroundPaper, 0.8)} />
          <Background color={alpha(primaryMain, 0.08)} gap={24} size={2} variant={BackgroundVariant.Dots} />
        </ReactFlow>
      </Box>

      <OrganizationalUnitLessonsProposalsDrawer
        open={lessonProposalOpen}
        onClose={() => setLessonProposalOpen(false)}
        onSuccess={() => setReloadKey((k) => k + 1)}
        orgUnitId={organizationalUnitId}
        isLessonLearned={isLessonLearned}
      />

      <OrganizationalUnitRelationsDrawer
        open={relationDrawerOpen}
        onClose={handleCloseRelationDrawer}
        onSuccess={() => {
          handleCloseRelationDrawer();
          setReloadKey((k) => k + 1);
        }}
        defaultOrganizationalUnitId={Number(organizationalUnitId)}
      />

      <OrganizationalUnitDocumentsDrawer
        open={documentDrawerOpen}
        onClose={handleCloseDocumentDrawer}
        onSuccess={() => {
          handleCloseDocumentDrawer();
          setReloadKey((k) => k + 1);
        }}
        organizationalUnitId={Number(organizationalUnitId)}
      />
    </Card>
  );
}

type RelationsDrawerProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultOrganizationalUnitId: number;
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
}: RelationsDrawerProps) {
  const { t } = useTranslate('business');
  const [unitOptions, setUnitOptions] = useState<Option[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

  const schema = useMemo(
    () =>
      zod.object({
        nombre: zod.string().min(1, { message: t('organizationalStructure.relations.requiredName') }),
        nombreReversa: zod.string().min(1, { message: t('organizationalStructure.relations.requiredReverseName') }),
        organizationalUnit1Id: zod
          .number()
          .min(1, { message: t('organizationalStructure.relations.requiredUnit1') }),
        organizationalUnit2Id: zod
          .number()
          .min(1, { message: t('organizationalStructure.relations.requiredUnit2') }),
      }),
    [t]
  );

  const normalizedDefaultId = Number.isFinite(defaultOrganizationalUnitId) ? defaultOrganizationalUnitId : 0;

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
  }, [defaultValues, open, reset]);

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

        setUnitOptions(options);
      } catch {
        setUnitOptions([]);
      } finally {
        setLoadingUnits(false);
      }
    };

    loadUnits();
  }, [normalizedDefaultId, open]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await SaveOrganizationalUnitRelationService({
        nombre: data.nombre,
        nombreReversa: data.nombreReversa,
        organizationalUnit1: { id: Number(data.organizationalUnit1Id) },
        organizationalUnit2: { id: Number(data.organizationalUnit2Id) },
      });
      toast.success(t('organizationalStructure.relations.success'));
      onSuccess();
    } catch {
      toast.error(t('organizationalStructure.relations.error'));
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
          {t('organizationalStructure.relations.title')}
        </Typography>

        <Form methods={methods} onSubmit={onSubmit}>
          <Stack spacing={2.5}>
            <Field.Text name="nombre" label={t('organizationalStructure.relations.name')} />
            <Field.Text name="nombreReversa" label={t('organizationalStructure.relations.reverseName')} />

            <Field.Select
              name="organizationalUnit1Id"
              label={t('organizationalStructure.relations.unit1')}
              onChange={(event) => {
                const value = Number(event.target.value);
                setValue('organizationalUnit1Id', value || 0, { shouldValidate: true });
              }}
            >
              <MenuItem value={0} disabled>
                {loadingUnits
                  ? t('organizationalStructure.relations.loading')
                  : t('organizationalStructure.relations.select')}
              </MenuItem>
              {unitOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Field.Select>

            <Field.Select
              name="organizationalUnit2Id"
              label={t('organizationalStructure.relations.unit2')}
              onChange={(event) => {
                const value = Number(event.target.value);
                setValue('organizationalUnit2Id', value || 0, { shouldValidate: true });
              }}
            >
              <MenuItem value={0} disabled>
                {loadingUnits
                  ? t('organizationalStructure.relations.loading')
                  : t('organizationalStructure.relations.select')}
              </MenuItem>
              {unitOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Field.Select>

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button variant="outlined" color="inherit" onClick={onClose} disabled={isSubmitting}>
                {t('organizationalStructure.relations.cancel')}
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                startIcon={
                  isSubmitting ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <Iconify icon="mingcute:add-line" />
                  )
                }
              >
                {t('organizationalStructure.relations.save')}
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
};

function OrganizationalUnitDocumentsDrawer({
  open,
  onClose,
  onSuccess,
  organizationalUnitId,
}: DocumentsDrawerProps) {
  const { t } = useTranslate('business');
  const [documentOptions, setDocumentOptions] = useState<Option[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  const schema = useMemo(
    () =>
      zod.object({
        documentId: zod.number().min(1, { message: t('organizationalStructure.documents.requiredDocument') }),
        observations: zod.string().min(1, { message: t('organizationalStructure.documents.requiredObservations') }),
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
  }, [defaultValues, open, reset]);

  useEffect(() => {
    if (!open) return;

    const loadDocuments = async () => {
      try {
        setLoadingDocuments(true);
        const response = await GetDocumentsListService({ page: 1, perPage: 1000 });
        const list = normalizeList(response?.data || []);
        const options = list
          .map((item: any) => ({
            value: Number(item?.id),
            label: String(item?.name || item?.label || item?.code || `#${item?.id}`),
          }))
          .filter((opt: Option) => Number.isFinite(opt.value) && opt.value > 0);
        setDocumentOptions(options);
      } catch {
        setDocumentOptions([]);
      } finally {
        setLoadingDocuments(false);
      }
    };

    loadDocuments();
  }, [open]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await SaveOrganizationalUnitDocumentService({
        observations: data.observations,
        organizationalUnit: { id: Number(organizationalUnitId) },
        document: { id: Number(data.documentId) },
      });
      toast.success(t('organizationalStructure.documents.success'));
      onSuccess();
    } catch {
      toast.error(t('organizationalStructure.documents.error'));
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
          {t('organizationalStructure.documents.title')}
        </Typography>

        <Form methods={methods} onSubmit={onSubmit}>
          <Stack spacing={2.5}>
            <Field.Select
              name="documentId"
              label={t('organizationalStructure.documents.select')}
              onChange={(event) => {
                const value = Number(event.target.value);
                setValue('documentId', value || 0, { shouldValidate: true });
              }}
            >
              <MenuItem value={0} disabled>
                {loadingDocuments
                  ? t('organizationalStructure.documents.loading')
                  : t('organizationalStructure.documents.selectPlaceholder')}
              </MenuItem>
              {documentOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Field.Select>

            <Field.Text
              name="observations"
              label={t('organizationalStructure.documents.observations')}
              multiline
              minRows={3}
            />

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button variant="outlined" color="inherit" onClick={onClose} disabled={isSubmitting}>
                {t('organizationalStructure.documents.cancel')}
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                startIcon={
                  isSubmitting ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <Iconify icon="mingcute:add-line" />
                  )
                }
              >
                {t('organizationalStructure.documents.save')}
              </Button>
            </Stack>
          </Stack>
        </Form>
      </Box>
    </Drawer>
  );
}
