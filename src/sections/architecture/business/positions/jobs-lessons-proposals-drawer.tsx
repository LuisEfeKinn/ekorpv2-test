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
import { SaveJobLessonsLearnedAndProposalsForImprovementRelationService } from 'src/services/architecture/business/jobRelations.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  jobId: number;
  isLessonLearned: boolean;
};

const getLessonProposalSchema = (t: (key: string) => string) => zod.object({
  description: zod.string().min(1, { message: t('positions.form.descriptionRequired') }),
  problem: zod.string().optional(),
  rootCause: zod.string().optional(),
  proposedStrategy: zod.string().optional(),
  estimatedResourceCosts: zod.string().optional(),
  expectedResults: zod.string().optional(),
  effectivenessIndicators: zod.string().optional(),
  proposedWorkTeam: zod.string().optional(),
  link: zod.string().url({ message: t('positions.form.linkValidation') }).optional().or(zod.literal('')),
});

export function JobsLessonsProposalsDrawer({ open, onClose, onSuccess, jobId, isLessonLearned }: Props) {
  const { t } = useTranslate('business');
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

  const onSubmit = handleSubmit(async (data) => {
    if (!jobId) {
      toast.error(t('positions.errors.invalidJobId'));
      return;
    }

    try {
      setLoading(true);

      const payload = {
        date: new Date().toISOString(),
        improvementLesson: isLessonLearned,
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

      await SaveJobLessonsLearnedAndProposalsForImprovementRelationService(jobId, payload);

      toast.success(
        isLessonLearned 
          ? t('positions.relations.lessonLearned.success')
          : t('positions.relations.proposal.success')
      );
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(
        isLessonLearned 
          ? t('positions.relations.lessonLearned.error')
          : t('positions.relations.proposal.error')
      );
    } finally {
      setLoading(false);
    }
  });

  const title = isLessonLearned 
    ? t('positions.relations.lessonLearned.title')
    : t('positions.relations.proposal.title');

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 520 } }}>
      <Box sx={{ px: 3, py: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          {title}
        </Typography>

        <Form methods={methods} onSubmit={onSubmit}>
          <Stack spacing={2.5}>
            <Field.Text
              name="description"
              label={`${t('positions.form.description')} *`}
              multiline
              minRows={3}
              placeholder={t('positions.form.descriptionPlaceholder')}
            />

            <Field.Text
              name="problem"
              label={t('positions.form.problem')}
              multiline
              minRows={2}
              placeholder={t('positions.form.problemPlaceholder')}
            />

            <Field.Text
              name="rootCause"
              label={t('positions.form.rootCause')}
              multiline
              minRows={2}
              placeholder={t('positions.form.rootCausePlaceholder')}
            />

            <Field.Text
              name="proposedStrategy"
              label={t('positions.form.proposedStrategy')}
              multiline
              minRows={2}
              placeholder={t('positions.form.proposedStrategyPlaceholder')}
            />

            <Field.Text
              name="estimatedResourceCosts"
              label={t('positions.form.estimatedResourceCosts')}
              placeholder={t('positions.form.estimatedResourceCostsPlaceholder')}
            />

            <Field.Text
              name="expectedResults"
              label={t('positions.form.expectedResults')}
              multiline
              minRows={2}
              placeholder={t('positions.form.expectedResultsPlaceholder')}
            />

            <Field.Text
              name="effectivenessIndicators"
              label={t('positions.form.effectivenessIndicators')}
              multiline
              minRows={2}
              placeholder={t('positions.form.effectivenessIndicatorsPlaceholder')}
            />

            <Field.Text
              name="proposedWorkTeam"
              label={t('positions.form.proposedWorkTeam')}
              multiline
              minRows={2}
              placeholder={t('positions.form.proposedWorkTeamPlaceholder')}
            />

            <Field.Text
              name="link"
              label={t('positions.form.link')}
              placeholder={t('positions.form.linkPlaceholder')}
            />

            <Stack direction="row" spacing={1.5} sx={{ pt: 2 }}>
              <Button
                variant="outlined"
                onClick={onClose}
                disabled={loading}
                fullWidth
              >
                {t('positions.relations.common.cancel')}
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
                {isLessonLearned 
                  ? t('positions.relations.lessonLearned.saveButton')
                  : t('positions.relations.proposal.saveButton')}
              </Button>
            </Stack>
          </Stack>
        </Form>
      </Box>
    </Drawer>
  );
}

