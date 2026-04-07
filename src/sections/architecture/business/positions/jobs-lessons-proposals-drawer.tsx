'use client';

import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Box,
  Stack,
  Drawer,
  Button,
  Typography,
  CircularProgress,
} from '@mui/material';

import { useTranslate } from 'src/locales';
import {
  type Feedback,
  GetFeedbackByIdService,
  SaveJobFeedbackService,
  UpdateJobFeedbackService,
} from 'src/services/architecture/business/job-feedbacks.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { SharedFeedbackCreateDrawer } from 'src/sections/architecture/common/feedback-create-drawer';

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  jobId: string;
  isLessonLearned: boolean;
  editMode?: boolean;
  initialData?: unknown;
  feedbackId?: string;
};

const getLessonProposalSchema = (t: (key: string) => string) => zod.object({
  description: zod.string().min(1, { message: 'La descripción es obligatoria' }),
  problem: zod.string().optional(),
  rootCause: zod.string().optional(),
  proposedStrategy: zod.string().optional(),
  estimatedResourceCosts: zod.string().optional(),
  expectedResults: zod.string().optional(),
  effectivenessIndicators: zod.string().optional(),
  proposedWorkTeam: zod.string().optional(),
  link: zod.string().url({ message: 'URL inválida' }).optional().or(zod.literal('')),
});

export function JobsLessonsProposalsDrawer({
  open,
  onClose,
  onSuccess,
  jobId,
  isLessonLearned,
  editMode,
  initialData,
  feedbackId,
}: Props) {
  const { t } = useTranslate('business');
  const [loading, setLoading] = useState(false);
  const [prefillFeedback, setPrefillFeedback] = useState<Feedback | null>(null);

  const extractFeedbackId = (raw: unknown) => {
    if (!raw) return null;
    if (typeof raw === 'object') {
      const obj = raw as Record<string, unknown>;
      const direct = obj.id;
      if (typeof direct === 'number' || typeof direct === 'string') return String(direct);

      const nestedData = obj.data;
      if (nestedData && typeof nestedData === 'object') {
        const nestedId = (nestedData as Record<string, unknown>).id;
        if (typeof nestedId === 'number' || typeof nestedId === 'string') return String(nestedId);
      }
    }
    return null;
  };

  const LessonProposalSchema = getLessonProposalSchema(t);
  type LessonProposalSchemaType = zod.infer<typeof LessonProposalSchema>;

  const methods = useForm<LessonProposalSchemaType>({
    resolver: zodResolver(LessonProposalSchema),
    defaultValues: {
      description: '',
      problem: '',
      rootCause: '',
      proposedStrategy: '',
      estimatedResourceCosts: '',
      expectedResults: '',
      effectivenessIndicators: '',
      proposedWorkTeam: '',
      link: '',
    },
  });

  const { reset, handleSubmit, setValue } = methods;

  useEffect(() => {
    let active = true;

    if (!open) {
      reset();
      setPrefillFeedback(null);
      return () => {
        active = false;
      };
    }

    const applyFeedbackToForm = (fb: Partial<Feedback>) => {
      setValue('description', fb.description ?? '');
      setValue('problem', fb.problem ?? '');
      setValue('rootCause', fb.rootCause ?? '');
      setValue('proposedStrategy', fb.proposedStrategy ?? '');
      setValue('estimatedResourceCosts', fb.estimatedResourceCosts ?? '');
      setValue('expectedResults', fb.expectedResults ?? '');
      setValue('effectivenessIndicators', fb.effectivenessIndicators ?? '');
      setValue('proposedWorkTeam', fb.proposedWorkTeam ?? '');
      setValue('link', fb.link ?? '');
    };

    const applyInitialDataFallback = () => {
      if (!editMode || !initialData) return;
      if (typeof initialData !== 'object') return;
      const raw = initialData as Record<string, unknown>;
      const data =
        raw.data && typeof raw.data === 'object' ? (raw.data as Record<string, unknown>) : raw;
      applyFeedbackToForm({
        description: typeof data.description === 'string' ? data.description : '',
        problem: typeof data.problem === 'string' ? data.problem : '',
        rootCause: typeof data.rootCause === 'string' ? data.rootCause : '',
        proposedStrategy: typeof data.proposedStrategy === 'string' ? data.proposedStrategy : '',
        estimatedResourceCosts:
          typeof data.estimatedResourceCosts === 'string' ? data.estimatedResourceCosts : '',
        expectedResults: typeof data.expectedResults === 'string' ? data.expectedResults : '',
        effectivenessIndicators:
          typeof data.effectivenessIndicators === 'string' ? data.effectivenessIndicators : '',
        proposedWorkTeam: typeof data.proposedWorkTeam === 'string' ? data.proposedWorkTeam : '',
        link: typeof data.link === 'string' ? data.link : '',
      });
    };

    const prefill = async () => {
      if (!editMode) {
        setPrefillFeedback(null);
        return;
      }

      if (!feedbackId) {
        setPrefillFeedback(null);
        applyInitialDataFallback();
        return;
      }

      try {
        const res = await GetFeedbackByIdService(feedbackId);
        if (!active) return;

        const fb = res.data;
        setPrefillFeedback(fb);

        if (!isLessonLearned) {
          applyFeedbackToForm(fb);
        }
      } catch {
        if (!active) return;
        setPrefillFeedback(null);
        applyInitialDataFallback();
      }
    };

    prefill();

    return () => {
      active = false;
    };
  }, [editMode, feedbackId, initialData, isLessonLearned, open, reset, setValue]);

  const handleSaveLesson = async (description: string) => {
    if (!jobId) {
      toast.error(t('positions.errors.invalidJobId'));
      return;
    }

    try {
      if (editMode && feedbackId) {
        await UpdateJobFeedbackService(feedbackId, {
          description,
          improvementLesson: true,
          statusDate: new Date().toISOString(),
        });
        toast.success(t('positions.relations.lessonLearned.success'));
      } else {
        const payload = {
          date: new Date().toISOString(),
          improvementLesson: true,
          description,
          problem: '',
          rootCause: '',
          proposedStrategy: '',
          estimatedResourceCosts: '',
          expectedResults: '',
          effectivenessIndicators: '',
          proposedWorkTeam: '',
          statusDate: new Date().toISOString(),
          link: '',
          file: '',
          type: '',
          originalFile: '',
          rejectionReason: '',
          reportReceiver: 0,
        };

        await SaveJobFeedbackService(jobId, payload);
        toast.success(t('positions.relations.lessonLearned.success'));
      }

      onSuccess();
      onClose();
    } catch (error) {
      toast.error(t('positions.relations.lessonLearned.error'));
      throw error;
    }
  };

  const onSubmitProposal = handleSubmit(async (data) => {
    if (!jobId) {
      toast.error(t('positions.errors.invalidJobId'));
      return;
    }

    try {
      setLoading(true);

      const payload = {
        date: new Date().toISOString(),
        improvementLesson: false,
        description: data.description,
        problem: data.problem || '',
        rootCause: data.rootCause || '',
        proposedStrategy: data.proposedStrategy || '',
        estimatedResourceCosts: data.estimatedResourceCosts || '',
        expectedResults: data.expectedResults || '',
        effectivenessIndicators: data.effectivenessIndicators || '',
        proposedWorkTeam: data.proposedWorkTeam || '',
        statusDate: new Date().toISOString(),
        link: data.link || '',
        file: '',
        type: '',
        originalFile: '',
        rejectionReason: '',
        reportReceiver: 0,
      };

      if (editMode && feedbackId) {
        await UpdateJobFeedbackService(feedbackId, payload);
      } else {
        const res = await SaveJobFeedbackService(jobId, payload);
        const createdId = extractFeedbackId(res?.data);
        if (createdId) {
          await UpdateJobFeedbackService(createdId, payload);
        }
      }

      toast.success(t('positions.relations.proposal.success'));
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(t('positions.relations.proposal.error'));
    } finally {
      setLoading(false);
    }
  });

  if (isLessonLearned) {
    const fallbackDescription =
      initialData && typeof initialData === 'object'
        ? String(
            ('data' in (initialData as Record<string, unknown>) &&
            typeof (initialData as Record<string, unknown>).data === 'object' &&
            (initialData as { data?: Record<string, unknown> }).data?.description != null
              ? (initialData as { data: Record<string, unknown> }).data.description
              : (initialData as Record<string, unknown>).description) ?? ''
          )
        : '';

    return (
      <SharedFeedbackCreateDrawer
        open={open}
        onClose={onClose}
        onSuccess={onSuccess}
        title={editMode ? "Editar Lección Aprendida" : (t('positions.relations.lessonLearned.title') || "Nueva Lección Aprendida")}
        onSubmit={handleSaveLesson}
        descriptionLabel={t('positions.relations.lessonLearned.description') || "Descripción"}
        descriptionPlaceholder={t('positions.relations.lessonLearned.placeholder') || "Describa el detalle..."}
        initialDescription={editMode ? (prefillFeedback?.description ?? fallbackDescription) : ''}
        feedbackId={feedbackId}
      />
    );
  }

  const title = editMode ? 'Editar Propuesta de Mejora' : (t('positions.relations.proposal.title') || "Nueva Propuesta de Mejora");

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 520 } }}>
      <Box sx={{ px: 3, py: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          {title}
        </Typography>

        <Form methods={methods} onSubmit={onSubmitProposal}>
          <Stack spacing={2.5}>
            <Field.Text
              name="description"
              label="Descripción *"
              multiline
              minRows={3}
              placeholder="Describa el detalle..."
            />

            <Field.Text
              name="problem"
              label="Problema Identificado"
              multiline
              minRows={2}
              placeholder="Describa el problema..."
            />

            <Field.Text
              name="rootCause"
              label="Causa Raíz"
              multiline
              minRows={2}
              placeholder="Describa la causa raíz..."
            />

            <Field.Text
              name="proposedStrategy"
              label="Estrategia Propuesta"
              multiline
              minRows={2}
              placeholder="Describa la estrategia..."
            />

            <Field.Text
              name="estimatedResourceCosts"
              label="Recursos y Costos Estimados"
              placeholder="Ej: 5000 USD, 2 Ingenieros..."
            />

            <Field.Text
              name="expectedResults"
              label="Resultados Esperados"
              multiline
              minRows={2}
              placeholder="Describa los resultados..."
            />

            <Field.Text
              name="effectivenessIndicators"
              label="Indicadores de Efectividad"
              multiline
              minRows={2}
              placeholder="KPIs, métricas..."
            />

            <Field.Text
              name="proposedWorkTeam"
              label="Equipo de Trabajo Propuesto"
              multiline
              minRows={2}
              placeholder="Roles o personas..."
            />

            <Field.Text
              name="link"
              label="Enlace de Referencia"
              placeholder="https://..."
            />

            <Stack direction="row" spacing={1.5} sx={{ pt: 2 }}>
              <Button
                variant="outlined"
                onClick={onClose}
                disabled={loading}
                fullWidth
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                fullWidth
                startIcon={
                  loading ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <Iconify icon="mingcute:add-line" />
                  )
                }
              >
                Guardar Propuesta
              </Button>
            </Stack>
          </Stack>
        </Form>
      </Box>
    </Drawer>
  );
}
