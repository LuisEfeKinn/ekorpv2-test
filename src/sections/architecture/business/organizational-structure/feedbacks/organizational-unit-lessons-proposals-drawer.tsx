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
import { SaveOrganizationalUnitFeedbackService } from 'src/services/architecture/business/organizational-unit-feedbacks.service';

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

export function OrganizationalUnitLessonsProposalsDrawer({ open, onClose, onSuccess, orgUnitId, isLessonLearned }: Props) {
  const { t } = useTranslate('organization');
  const [loading, setLoading] = useState(false);

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

  const { reset, handleSubmit } = methods;

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

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

      await SaveOrganizationalUnitFeedbackService(orgUnitId, payload);
      toast.success(t('organization.feedbacks.lessonSaved'));
    } catch (error) {
      toast.error(t('organization.feedbacks.lessonError'));
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

      await SaveOrganizationalUnitFeedbackService(orgUnitId, payload);

      toast.success(t('organization.feedbacks.proposalSaved'));
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(t('organization.feedbacks.proposalError'));
    } finally {
      setLoading(false);
    }
  });

  if (isLessonLearned) {
    return (
      <SharedFeedbackCreateDrawer
        open={open}
        onClose={onClose}
        onSuccess={onSuccess}
        title={t('organization.feedbacks.lessonTitle')}
        onSubmit={handleSaveLesson}
        descriptionLabel={t('organization.feedbacks.description')}
        descriptionPlaceholder={t('organization.feedbacks.descriptionPlaceholder')}
      />
    );
  }

  const title = t('organization.feedbacks.proposalTitle');

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
