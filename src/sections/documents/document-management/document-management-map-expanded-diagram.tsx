'use client';

import type { Theme, SxProps } from '@mui/material/styles';
import type { DocumentMapNode, DocumentMapResponse } from 'src/services/documents/documents.service';

import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import {
  DeleteDocumentFeedbackService,
} from 'src/services/documents/feedbacks.service';
import { DeleteProcessDocumentService } from 'src/services/architecture/process/processRelations.service';
import { DeleteJobDocumentRelationService } from 'src/services/architecture/business/jobRelations.service';
import { DeleteToolDocumentRelationService } from 'src/services/architecture/tools/toolsRelations.service';
import { DeleteOrganizationalUnitDocumentService } from 'src/services/organization/organizationalUnit.service';
import { DeleteDocumentObjectiveRelationService } from 'src/services/architecture/business/objectiveRelations.service';
import {
  GetDocumentMapByIdService,
  GetDocumentMapExpandService,
  DeleteDocumentExamRelationService,
  DeleteDocumentUserRelationService,
  DeleteDocumentTopicRelationService,
  DeleteDocumentCompetencyRelationService,
} from 'src/services/documents/documents.service';

import { toast } from 'src/components/snackbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import {
  type ExpandibleMapNode,
  NodesExpandibleMapExpanded,
} from 'src/components/expandible-map';

import { DocumentLessonsProposalsDrawer } from './document-lessons-proposals-drawer';
import { DocumentMapNodeCrudDrawer, type DocumentMapRelationKind } from './document-map-node-crud-drawers';

type Props = {
  documentId: string;
  nodeId: string;
  height?: number;
  sx?: SxProps<Theme>;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const normalizeMapResponse = (value: unknown, fallbackId: string): DocumentMapResponse => {
  if (!isRecord(value)) return { id: fallbackId, label: `Nodo ${fallbackId}`, children: [] };
  const id = 'id' in value ? (value.id as string | number) : fallbackId;
  const label = typeof value.label === 'string' ? value.label : `Nodo ${fallbackId}`;
  const children = Array.isArray(value.children) ? (value.children as DocumentMapNode[]) : [];
  return { id, label, children, data: value.data };
};

const coerceId = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
};

const normalizeText = (value: unknown): string => String(value ?? '').trim().toLowerCase();

const detectKind = (nodeIdValue: string): DocumentMapRelationKind => {
  const idLower = nodeIdValue.toLowerCase();

  if (idLower === 'pro') return 'process';
  if (idLower === 'job') return 'job';
  if (idLower === 'obj') return 'objective';
  if (idLower === 'ou') return 'organizationalUnit';
  if (idLower === 'tool') return 'tool';
  if (idLower === 'top') return 'topic';
  if (idLower === 'usr') return 'subscriber';
  if (idLower === 'cmp') return 'competency';
  if (idLower === 'exm') return 'exam';
  
  return 'process';
};

const isLessonContextNode = (nodeIdValue: unknown, labelValue: unknown): boolean => {
  const nodeLower = normalizeText(nodeIdValue);
  const labelLower = normalizeText(labelValue);
  return (
    nodeLower === 'lec' ||
    nodeLower.includes('lec') ||
    labelLower.includes('lección') ||
    labelLower.includes('leccion') ||
    labelLower.includes('lecciones') ||
    labelLower.includes('lesson') ||
    labelLower.includes('lessons')
  );
};

const isProposalContextNode = (nodeIdValue: unknown, labelValue: unknown): boolean => {
  const nodeLower = normalizeText(nodeIdValue);
  const labelLower = normalizeText(labelValue);
  return (
    nodeLower === 'prm' ||
    nodeLower === 'prp' ||
    nodeLower.includes('prm') ||
    nodeLower.includes('prp') ||
    labelLower.includes('propuesta') ||
    labelLower.includes('propuestas') ||
    labelLower.includes('mejora') ||
    labelLower.includes('proposal') ||
    labelLower.includes('proposals')
  );
};

const isFeedbackPayload = (payload: unknown): boolean => {
  if (!isRecord(payload)) return false;
  if ('improvementLesson' in payload) return true;
  if ('feedbackId' in payload) return true;
  if ('feedback' in payload && isRecord(payload.feedback)) return true;
  return false;
};

const getFeedbackIdFromPayload = (payload: unknown): number | null => {
  if (!isRecord(payload)) return null;

  const directFeedbackId = coerceId(payload.feedbackId);
  if (directFeedbackId != null) return directFeedbackId;

  if ('feedback' in payload && isRecord(payload.feedback)) {
    const nestedId = coerceId((payload.feedback as Record<string, unknown>).id);
    if (nestedId != null) return nestedId;
  }

  if ('data' in payload && isRecord(payload.data) && 'feedback' in payload.data && isRecord(payload.data.feedback)) {
    const nestedId = coerceId((payload.data.feedback as Record<string, unknown>).id);
    if (nestedId != null) return nestedId;
  }

  const directId = coerceId(payload.id);
  if (directId != null) return directId;

  const relationId = coerceId(payload.relationId);
  if (relationId != null) return relationId;

  return null;
};

const getFeedbackInitialDataFromPayload = (payload: unknown): unknown => {
  if (!isRecord(payload)) return payload;
  if ('feedback' in payload) return payload.feedback;
  if ('data' in payload && isRecord(payload.data) && 'feedback' in payload.data) return payload.data.feedback;
  return payload;
};

const getFeedbackIsLessonFromPayload = (payload: unknown): boolean | null => {
  if (!isRecord(payload)) return null;
  if (typeof payload.improvementLesson === 'boolean') return payload.improvementLesson;
  if ('feedback' in payload && isRecord(payload.feedback) && typeof payload.feedback.improvementLesson === 'boolean') {
    return payload.feedback.improvementLesson;
  }
  if (
    'data' in payload &&
    isRecord(payload.data) &&
    'feedback' in payload.data &&
    isRecord(payload.data.feedback) &&
    typeof payload.data.feedback.improvementLesson === 'boolean'
  ) {
    return payload.data.feedback.improvementLesson;
  }
  return null;
};

type DeleteTarget = {
  id: number;
  label: string;
  kind: 'feedback' | 'relation';
};

const extractRelationId = (payload: unknown): number | null => {
  if (!isRecord(payload)) return null;
  const id = coerceId(payload.relationId) ?? coerceId(payload.id);
  return id;
};

export function DocumentManagementMapExpandedDiagram({ documentId, nodeId, height, sx }: Props) {
  const router = useRouter();
  const { t } = useTranslate('documents');

  const [loading, setLoading] = useState(true);
  const [documentLabel, setDocumentLabel] = useState('');
  const [expandedData, setExpandedData] = useState<DocumentMapResponse | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [drawerTarget, setDrawerTarget] = useState<ExpandibleMapNode | null>(null);
  const [feedbackDrawerOpen, setFeedbackDrawerOpen] = useState(false);
  const [feedbackEditMode, setFeedbackEditMode] = useState(false);
  const [feedbackIsLesson, setFeedbackIsLesson] = useState(false);
  const [feedbackId, setFeedbackId] = useState<string | number | null>(null);
  const [feedbackEditData, setFeedbackEditData] = useState<unknown>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!documentId || !nodeId) {
      setLoading(false);
      setDocumentLabel('');
      setExpandedData(null);
      return;
    }

    const fetchExpanded = async () => {
      try {
        setLoading(true);

        try {
          const root = await GetDocumentMapByIdService(documentId);
          const normalizedRoot = normalizeMapResponse(root.data as unknown, documentId);
          setDocumentLabel(normalizedRoot.label);
        } catch {
          setDocumentLabel('');
        }

        const expanded = await GetDocumentMapExpandService(documentId, nodeId);
        const normalizedExpanded = normalizeMapResponse(expanded.data as unknown, nodeId);
        setExpandedData(normalizedExpanded);
      } catch {
        toast.error(t('documentManagement.map.messages.expandNotAvailable'));
        setExpandedData({ id: nodeId, label: `Nodo ${nodeId}`, children: [] });
      } finally {
        setLoading(false);
      }
    };

    void fetchExpanded();
  }, [documentId, nodeId, reloadKey, t]);

  const items = useMemo<ExpandibleMapNode[]>(
    () =>
      (expandedData?.children ?? []).map((child) => {
        const basePayload = isRecord(child.data) ? child.data : {};
        return {
          id: child.id,
          label: child.label,
          payload: {
            ...basePayload,
            relationId: coerceId(child.relationId) ?? coerceId((basePayload as Record<string, unknown>).relationId) ?? null,
          },
        };
      }),
    [expandedData?.children]
  );

  const headerTitle = documentLabel || t('documentManagement.map.title');
  const expandedLabel = expandedData?.label ?? '';
  const isLessonContext = useMemo(() => isLessonContextNode(nodeId, expandedLabel), [expandedLabel, nodeId]);
  const isProposalContext = useMemo(() => isProposalContextNode(nodeId, expandedLabel), [expandedLabel, nodeId]);
  const isFeedbackContext = isLessonContext || isProposalContext;
  const currentKind = useMemo(
     () => detectKind(String(nodeId ?? '')),
     [nodeId]
  );

  const existingRelatedIds = useMemo(() => {
    const fromNode = (payload: unknown, fallback: unknown): number | null => {
      if (currentKind === 'process') {
        if (isRecord(payload)) return coerceId(payload.processId) ?? coerceId((payload.process as { id?: unknown } | undefined)?.id);
        return coerceId(fallback);
      }
      if (currentKind === 'job') {
        if (isRecord(payload)) return coerceId(payload.jobId) ?? coerceId((payload.job as { id?: unknown } | undefined)?.id);
        return coerceId(fallback);
      }
      if (currentKind === 'objective') {
        if (isRecord(payload)) return coerceId(payload.objectiveId) ?? coerceId((payload.objective as { id?: unknown } | undefined)?.id);
        return coerceId(fallback);
      }
      if (currentKind === 'organizationalUnit') {
        if (isRecord(payload))
          return (
            coerceId(payload.organizationalUnitId) ??
            coerceId((payload.organizationalUnit as { id?: unknown } | undefined)?.id)
          );
        return coerceId(fallback);
      }
      if (currentKind === 'tool') {
        if (isRecord(payload)) return coerceId(payload.toolId) ?? coerceId((payload.tool as { id?: unknown } | undefined)?.id);
        return coerceId(fallback);
      }
      if (currentKind === 'topic') {
        if (isRecord(payload)) return coerceId(payload.topicId) ?? coerceId((payload.topic as { id?: unknown } | undefined)?.id);
        return coerceId(fallback);
      }
      if (currentKind === 'subscriber') {
        if (isRecord(payload)) return coerceId(payload.userId) ?? coerceId((payload.user as { id?: unknown } | undefined)?.id);
        return coerceId(fallback);
      }
      if (currentKind === 'competency') {
        if (isRecord(payload))
          return coerceId(payload.competencyId) ?? coerceId((payload.competency as { id?: unknown } | undefined)?.id);
        return coerceId(fallback);
      }
      if (isRecord(payload)) {
        const evaluation = payload.evaluation as { evaluationId?: unknown } | undefined;
        return coerceId(payload.evaluationId) ?? coerceId(evaluation?.evaluationId);
      }
      return coerceId(fallback);
    };

    return items
      .map((it) => fromNode(it.payload, it.id))
      .filter((id): id is number => typeof id === 'number' && Number.isFinite(id) && id > 0);
  }, [currentKind, items]);

  const handleBackToMap = useCallback(() => {
    router.push(paths.dashboard.documents.documentManagementMap(String(documentId)));
  }, [documentId, router]);

  const handleBackToTable = useCallback(() => {
    router.push(paths.dashboard.documents.documentManagement);
  }, [router]);

  const handleOpenDrawer = useCallback(
    (mode: 'create' | 'edit', target: ExpandibleMapNode | null) => {
      const targetIsFeedback = target ? isFeedbackPayload(target.payload) : false;
      const openFeedback = isFeedbackContext || targetIsFeedback;

      if (openFeedback) {
        const payload = target?.payload ?? null;
        const inferredIsLesson = getFeedbackIsLessonFromPayload(payload);
        const isLesson = inferredIsLesson ?? isLessonContext;

        setFeedbackEditMode(mode === 'edit');
        setFeedbackIsLesson(isLesson);
        setFeedbackId(mode === 'edit' && target ? getFeedbackIdFromPayload(target.payload) : null);
        setFeedbackEditData(target ? getFeedbackInitialDataFromPayload(target.payload) : null);
        setFeedbackDrawerOpen(true);
        return;
      }

      setDrawerMode(mode);
      setDrawerTarget(target);
      setDrawerOpen(true);
    },
    [isFeedbackContext, isLessonContext]
  );

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setDrawerTarget(null);
  }, []);

  const handleDrawerSuccess = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const id = deleteTarget.id;
      
      if (deleteTarget.kind === 'feedback') {
        await DeleteDocumentFeedbackService(id);
      } else if (currentKind === 'process') {
        await DeleteProcessDocumentService(id);
      } else if (currentKind === 'job') {
        await DeleteJobDocumentRelationService(id);
      } else if (currentKind === 'objective') {
        await DeleteDocumentObjectiveRelationService(id);
      } else if (currentKind === 'organizationalUnit') {
        await DeleteOrganizationalUnitDocumentService(id);
      } else if (currentKind === 'tool') {
        await DeleteToolDocumentRelationService(id);
      } else if (currentKind === 'topic') {
        await DeleteDocumentTopicRelationService(id);
      } else if (currentKind === 'subscriber') {
        await DeleteDocumentUserRelationService(id);
      } else if (currentKind === 'competency') {
        await DeleteDocumentCompetencyRelationService(id);
      } else {
        await DeleteDocumentExamRelationService(id);
      }
      toast.success(t('documentManagement.map.relations.messages.deleted'));
      handleDrawerSuccess();
      setDeleteTarget(null);
    } catch {
      toast.error(t('documentManagement.map.relations.messages.deleteError'));
    } finally {
      setDeleting(false);
    }
  }, [currentKind, deleteTarget, handleDrawerSuccess, t]);

  if (loading) {
    return (
      <Box
        sx={{
          width: '100%',
          minHeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...sx,
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="body2" color="text.secondary">
            {t('documentManagement.map.messages.loading')}
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (!expandedData) {
    return (
      <Box
        sx={{
          width: '100%',
          minHeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...sx,
        }}
      >
        <Typography variant="body1" color="text.secondary">
          {t('documentManagement.map.messages.empty')}
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <NodesExpandibleMapExpanded
        headerTitle={headerTitle}
        centerSubtitle={expandedData.label}
        center={{ id: expandedData.id, label: expandedData.label }}
        items={items}
        onBackToMap={handleBackToMap}
        onBackToTable={handleBackToTable}
        onOpenFormDrawer={() => handleOpenDrawer('create', null)}
        onItemClick={(item) => handleOpenDrawer('edit', item)}
        onItemEdit={(item) => handleOpenDrawer('edit', item)}
        onItemDelete={(item) => {
          const isFeedbackItem = isFeedbackContext || isFeedbackPayload(item.payload);
          const id = isFeedbackItem ? getFeedbackIdFromPayload(item.payload) : extractRelationId(item.payload);
          if (id == null) {
            toast.error(t('documentManagement.map.relations.messages.deleteMissingId'));
            return;
          }
          setDeleteTarget({ id, label: item.label, kind: isFeedbackItem ? 'feedback' : 'relation' });
        }}
        height={height}
        sx={sx}
      />

      <DocumentMapNodeCrudDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        onSuccess={handleDrawerSuccess}
        mode={drawerMode}
        kind={currentKind}
        documentId={Number(documentId)}
        existingRelatedIds={existingRelatedIds}
        target={
          drawerTarget
            ? {
                label: drawerTarget.label,
                relationId: extractRelationId(drawerTarget.payload),
                payload: drawerTarget.payload,
              }
            : null
        }
      />

      <DocumentLessonsProposalsDrawer
        open={feedbackDrawerOpen}
        onClose={() => {
          setFeedbackDrawerOpen(false);
          setFeedbackEditMode(false);
          setFeedbackEditData(null);
          setFeedbackId(null);
        }}
        onSuccess={handleDrawerSuccess}
        documentId={Number(documentId)}
        isLessonLearned={feedbackIsLesson}
        editMode={feedbackEditMode}
        initialData={feedbackEditData}
        feedbackId={feedbackId ? String(feedbackId) : undefined}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={t('documentManagement.map.relations.dialogs.delete.title')}
        content={t('documentManagement.map.relations.dialogs.delete.content', { name: deleteTarget?.label ?? '' })}
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" color="inherit" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              {t('documentManagement.map.relations.actions.cancel')}
            </Button>
            <Button variant="contained" color="error" onClick={handleConfirmDelete} disabled={deleting}>
              {t('documentManagement.map.relations.actions.delete')}
            </Button>
          </Stack>
        }
      />
    </>
  );
}
