'use client';

import type { Theme, SxProps } from '@mui/material/styles';

import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { GetDocumentByIdService } from 'src/services/documents/documents.service';
import {
  type DocumentFeedback,
} from 'src/services/documents/feedbacks.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { DocumentMapFeedbacksDiagram } from './document-map-feedbacks-diagram';
import { DocumentLessonsProposalsDrawer } from './document-lessons-proposals-drawer';

type DocumentDetail = {
  id: string | number;
  code?: string;
  name: string;
  feedbacks?: DocumentFeedback[];
};

type FeedbackNode = {
  id: string | number;
  label: string;
  description: string;
  isLesson: boolean;
  data?: unknown;
};

type Props = {
  documentId: string;
  height?: number;
  sx?: SxProps<Theme>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const normalizeDocumentDetail = (value: unknown, fallbackId: string): DocumentDetail => {
  if (!isRecord(value)) return { id: fallbackId, name: `Documento ${fallbackId}` };
  const id = 'id' in value ? (value.id as string | number) : fallbackId;
  const name = typeof value.name === 'string' ? value.name : `Documento ${fallbackId}`;
  const code = typeof value.code === 'string' ? value.code : undefined;
  const feedbacks = Array.isArray(value.feedbacks) ? (value.feedbacks as DocumentFeedback[]) : [];
  return { id, name, code, feedbacks };
};

export function DocumentMapFeedbacksDiagramContainer({ documentId, height, sx }: Props) {
  const { t } = useTranslate('documents');
  const [loading, setLoading] = useState(true);
  const [documentDetail, setDocumentDetail] = useState<DocumentDetail | null>(null);
  const [feedbackDrawerOpen, setFeedbackDrawerOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isLessonLearned, setIsLessonLearned] = useState(false);
  const [editFeedbackId, setEditFeedbackId] = useState<string | number | null>(null);
  const [editData, setEditData] = useState<unknown>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!documentId) {
      setLoading(false);
      setDocumentDetail(null);
      return;
    }

    const fetchDocument = async () => {
      try {
        setLoading(true);
        const response = await GetDocumentByIdService(documentId);
        const normalized = normalizeDocumentDetail(response.data as unknown, documentId);
        setDocumentDetail(normalized);
      } catch {
        setDocumentDetail(null);
        toast.error(t('documentManagement.messages.error.loading'));
      } finally {
        setLoading(false);
      }
    };

    void fetchDocument();
  }, [documentId, reloadKey, t]);

  const lessons = useMemo<FeedbackNode[]>(() => (documentDetail?.feedbacks ?? [])
      .filter((f) => f.improvementLesson)
      .map((f) => ({
        id: f.id,
        label: f.description,
        description: f.description,
        isLesson: true,
        data: f,
      })), [documentDetail?.feedbacks]);

  const proposals = useMemo<FeedbackNode[]>(() => (documentDetail?.feedbacks ?? [])
      .filter((f) => !f.improvementLesson)
      .map((f) => ({
        id: f.id,
        label: f.description,
        description: f.problem || f.description,
        isLesson: false,
        data: f,
      })), [documentDetail?.feedbacks]);

  const handleAddLesson = useCallback(() => {
    setEditMode(false);
    setEditFeedbackId(null);
    setEditData(null);
    setIsLessonLearned(true);
    setFeedbackDrawerOpen(true);
  }, []);

  const handleAddProposal = useCallback(() => {
    setEditMode(false);
    setEditFeedbackId(null);
    setEditData(null);
    setIsLessonLearned(false);
    setFeedbackDrawerOpen(true);
  }, []);

  const handleEditLesson = useCallback((id: string | number, data: unknown) => {
    setEditMode(true);
    setEditFeedbackId(id);
    setEditData(data);
    setIsLessonLearned(true);
    setFeedbackDrawerOpen(true);
  }, []);

  const handleEditProposal = useCallback((id: string | number, data: unknown) => {
    setEditMode(true);
    setEditFeedbackId(id);
    setEditData(data);
    setIsLessonLearned(false);
    setFeedbackDrawerOpen(true);
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          width: '100%',
          minHeight: height || 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...sx,
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="body2" color="text.secondary">
            Cargando feedbacks...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (!documentDetail) {
    return (
      <Box
        sx={{
          width: '100%',
          minHeight: height || 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...sx,
        }}
      >
        <Typography variant="body1" color="text.secondary">
          No fue posible cargar el documento
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ mb: 3, display: 'flex', gap: 1.5 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Iconify icon="solar:inbox-in-bold" />}
          onClick={handleAddLesson}
        >
          + Lección Aprendida
        </Button>
        <Button
          variant="contained"
          color="info"
          startIcon={<Iconify icon="solar:flag-bold" />}
          onClick={handleAddProposal}
        >
          + Propuesta de Mejora
        </Button>
      </Box>

      <DocumentMapFeedbacksDiagram
        lessons={lessons}
        proposals={proposals}
        onEditLesson={handleEditLesson}
        onEditProposal={handleEditProposal}
        sx={{ ...sx }}
      />

      <DocumentLessonsProposalsDrawer
        open={feedbackDrawerOpen}
        onClose={() => {
          setFeedbackDrawerOpen(false);
          setEditMode(false);
          setEditData(null);
          setEditFeedbackId(null);
        }}
        onSuccess={() => setReloadKey((k) => k + 1)}
        documentId={Number(documentId)}
        isLessonLearned={isLessonLearned}
        editMode={editMode}
        initialData={editData}
        feedbackId={editFeedbackId ? String(editFeedbackId) : undefined}
      />
    </>
  );
}
