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
  SaveOrganizationalUnitFeedbackService,
  UpdateOrganizationalUnitFeedbackService,
} from 'src/services/architecture/business/organizational-unit-feedbacks.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { SharedFeedbackCreateDrawer } from 'src/sections/architecture/common/feedback-create-drawer';

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orgUnitId: string;
  isLessonLearned: boolean;
  editMode?: boolean;
  initialData?: unknown;
  feedbackId?: string;
};

const getLessonProposalSchema = (t: (key: string) => string) => zod.object({
  description: zod.string().min(1, { message: t('organization.feedbacks.validation.descriptionRequired') }),
  problem: zod.string().optional(),
  rootCause: zod.string().optional(),
  proposedStrategy: zod.string().optional(),
  estimatedResourceCosts: zod.string().optional(),
  expectedResults: zod.string().optional(),
  effectivenessIndicators: zod.string().optional(),
  proposedWorkTeam: zod.string().optional(),
  link: zod.string().url({ message: t('organization.feedbacks.validation.invalidUrl') }).optional().or(zod.literal('')),
});

export function OrganizationalUnitLessonsProposalsDrawer({
  open,
  onClose,
  onSuccess,
  orgUnitId,
  isLessonLearned,
  editMode,
  initialData,
  feedbackId,
}: Props) {
  const { t } = useTranslate('organization');
  const [loading, setLoading] = useState(false);
  const [prefillFeedback, setPrefillFeedback] = useState<Feedback | null>(null);

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
      if (typeof initialData !== 'object' || !initialData) return;
      const raw = initialData as Record<string, unknown>;
      const data = (raw.data && typeof raw.data === 'object' ? (raw.data as Record<string, unknown>) : raw) as Record<
        string,
        unknown
      >;

      applyFeedbackToForm({
        description: typeof data.description === 'string' ? data.description : '',
        problem: typeof data.problem === 'string' ? data.problem : '',
        rootCause: typeof data.rootCause === 'string' ? data.rootCause : '',
        proposedStrategy: typeof data.proposedStrategy === 'string' ? data.proposedStrategy : '',
        estimatedResourceCosts: typeof data.estimatedResourceCosts === 'string' ? data.estimatedResourceCosts : '',
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

        setPrefillFeedback(res.data);
        if (!isLessonLearned) {
          applyFeedbackToForm(res.data);
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
    if (!orgUnitId) {
      toast.error(t('organization.feedbacks.invalidUnitId'));
      return;
    }

    try {
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

      if (editMode && feedbackId) {
        await UpdateOrganizationalUnitFeedbackService(feedbackId, {
          description,
          improvementLesson: true,
          statusDate: new Date().toISOString(),
        });
        toast.success(t('organization.feedbacks.lessonUpdated', { defaultValue: 'Lección aprendida actualizada' }));
      } else {
        await SaveOrganizationalUnitFeedbackService(orgUnitId, payload);
        toast.success(t('organization.feedbacks.lessonSaved'));
      }

      onSuccess();
      onClose();
    } catch (error) {
      toast.error(
        editMode
          ? t('organization.feedbacks.lessonUpdateError', { defaultValue: 'Error al actualizar la lección' })
          : t('organization.feedbacks.lessonError')
      );
      throw error;
    }
  };

  const onSubmitProposal = handleSubmit(async (data) => {
    if (!orgUnitId) {
      toast.error(t('organization.feedbacks.invalidUnitId'));
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
        await UpdateOrganizationalUnitFeedbackService(feedbackId, payload);
        toast.success(
          t('organization.feedbacks.proposalUpdated', { defaultValue: 'Propuesta de mejora actualizada' })
        );
      } else {
        await SaveOrganizationalUnitFeedbackService(orgUnitId, payload);

        toast.success(t('organization.feedbacks.proposalSaved'));
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(
        editMode
          ? t('organization.feedbacks.proposalUpdateError', { defaultValue: 'Error al actualizar la propuesta' })
          : t('organization.feedbacks.proposalError')
      );
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
        title={
          editMode
            ? t('organization.feedbacks.lessonEditTitle', { defaultValue: 'Editar Lección Aprendida' })
            : t('organization.feedbacks.lessonTitle')
        }
        onSubmit={handleSaveLesson}
        descriptionLabel={t('organization.feedbacks.description')}
        descriptionPlaceholder={t('organization.feedbacks.descriptionPlaceholder')}
        initialDescription={editMode ? (prefillFeedback?.description ?? fallbackDescription) : ''}
      />
    );
  }

  const title = editMode
    ? t('organization.feedbacks.proposalEditTitle', { defaultValue: 'Editar Propuesta de Mejora' })
    : t('organization.feedbacks.proposalTitle');

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
              label={t('organization.feedbacks.description')}
              multiline
              minRows={3}
              placeholder={t('organization.feedbacks.descriptionPlaceholder')}
            />

            <Field.Text
              name="problem"
              label={t('organization.feedbacks.problem')}
              multiline
              minRows={2}
              placeholder={t('organization.feedbacks.problemPlaceholder')}
            />

            <Field.Text
              name="rootCause"
              label={t('organization.feedbacks.rootCause')}
              multiline
              minRows={2}
              placeholder={t('organization.feedbacks.rootCausePlaceholder')}
            />

            <Field.Text
              name="proposedStrategy"
              label={t('organization.feedbacks.strategy')}
              multiline
              minRows={2}
              placeholder={t('organization.feedbacks.strategyPlaceholder')}
            />

            <Field.Text
              name="estimatedResourceCosts"
              label={t('organization.feedbacks.resources')}
              placeholder={t('organization.feedbacks.resourcesPlaceholder')}
            />

            <Field.Text
              name="expectedResults"
              label={t('organization.feedbacks.results')}
              multiline
              minRows={2}
              placeholder={t('organization.feedbacks.resultsPlaceholder')}
            />

            <Field.Text
              name="effectivenessIndicators"
              label={t('organization.feedbacks.indicators')}
              multiline
              minRows={2}
              placeholder={t('organization.feedbacks.indicatorsPlaceholder')}
            />

            <Field.Text
              name="proposedWorkTeam"
              label={t('organization.feedbacks.team')}
              multiline
              minRows={2}
              placeholder={t('organization.feedbacks.teamPlaceholder')}
            />

            <Field.Text
              name="link"
              label={t('organization.feedbacks.link')}
              placeholder={t('organization.feedbacks.linkPlaceholder')}
            />

            <Stack direction="row" spacing={1.5} sx={{ pt: 2 }}>
              <Button
                variant="outlined"
                onClick={onClose}
                disabled={loading}
                fullWidth
              >
                {t('organization.feedbacks.cancel')}
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
                {t('organization.feedbacks.saveProposal')}
              </Button>
            </Stack>
          </Stack>
        </Form>
      </Box>
    </Drawer>
  );
}
