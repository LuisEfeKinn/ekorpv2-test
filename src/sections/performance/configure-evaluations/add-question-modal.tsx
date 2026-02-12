import type { IScale } from 'src/types/performance';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import { Alert, Divider, IconButton, Typography } from '@mui/material';

import { useTranslate } from 'src/locales';
import { GetScalesPaginationService } from 'src/services/performance/scales.service';
import { GetPerformanceRelatedDataService } from 'src/services/performance/related-data.service';
import {
  GetQuestionsByIdService,
  SaveOrUpdateQuestionsService
} from 'src/services/performance/questions.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type QuestionForm = {
  id: string;
  description: string;
  weight: number;
  selectedScale: IScale | null;
  isOptional: boolean;
  visibleTo: string[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  competenceId: string;
  campaignId: string;
  questionId?: string;
};


export function AddQuestionModal({ open, onClose, onSuccess, competenceId, campaignId, questionId }: Props) {
  const { t } = useTranslate('performance');

  const [scales, setScales] = useState<IScale[]>([]);
  const [relationshipOptions, setRelationshipOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form fields - ahora un array de preguntas
  const [questions, setQuestions] = useState<QuestionForm[]>([
    {
      id: crypto.randomUUID(),
      description: '',
      weight: 0,
      selectedScale: null,
      isOptional: false,
      visibleTo: [],
    },
  ]);

  const loadScales = useCallback(async () => {
    try {
      setLoading(true);
      const response = await GetScalesPaginationService({ page: 1, perPage: 100 });
      if (response?.data && Array.isArray(response.data)) {
        setScales(response.data);
      }
    } catch (error) {
      console.error('Error loading scales:', error);
      toast.error(t('questions.messages.error.loadingScales'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadRelatedData = useCallback(async () => {
    try {
      const response = await GetPerformanceRelatedDataService({});
      if (response?.data?.data?.evaluationRelationships && Array.isArray(response.data.data.evaluationRelationships)) {
        setRelationshipOptions(response.data.data.evaluationRelationships);
      }
    } catch (error) {
      console.error('Error loading related data:', error);
      toast.error(t('questions.messages.error.loadingRelationships'));
    }
  }, [t]);

  const loadQuestion = useCallback(async () => {
    if (!questionId) return;

    try {
      setLoading(true);
      const response = await GetQuestionsByIdService(questionId);
      if (response?.data) {
        const question = response.data;
        setQuestions([
          {
            id: crypto.randomUUID(),
            description: question.description || '',
            weight: (question.weight || 0) * 100,
            selectedScale: scales.find(s => s.id === question.scaleId) || null,
            isOptional: question.isOptional || false,
            visibleTo: question.visibleTo || [],
          },
        ]);
      }
    } catch (error) {
      console.error('Error loading question:', error);
      toast.error(t('questions.messages.error.loading'));
    } finally {
      setLoading(false);
    }
  }, [questionId, scales, t]);

  useEffect(() => {
    if (open) {
      loadScales();
      loadRelatedData();
    }
  }, [open, loadScales, loadRelatedData]);

  useEffect(() => {
    if (open && questionId && scales.length > 0) {
      loadQuestion();
    }
  }, [open, questionId, scales, loadQuestion]);

  const handleClose = () => {
    setQuestions([
      {
        id: crypto.randomUUID(),
        description: '',
        weight: 0,
        selectedScale: null,
        isOptional: false,
        visibleTo: [],
      },
    ]);
    onClose();
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: crypto.randomUUID(),
        description: '',
        weight: 0,
        selectedScale: null,
        isOptional: false,
        visibleTo: [],
      },
    ]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((q) => q.id !== id));
    }
  };

  const updateQuestion = (id: string, field: keyof QuestionForm, value: any) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const totalWeight = questions.reduce((sum, q) => sum + q.weight, 0);
  const isWeightValid = Math.abs(totalWeight - 100) < 0.01; // Tolera error de redondeo

  const handleSubmit = async () => {
    // Validar cada pregunta
    const invalidQuestion = questions.find(
      (q) => !q.description || !q.selectedScale || q.weight <= 0 || q.visibleTo.length === 0
    );

    if (invalidQuestion) {
      toast.error(t('questions.messages.error.validation'));
      return;
    }

    if (!isWeightValid) {
      toast.error(t('questions.messages.error.weightSum'));
      return;
    }

    try {
      setSubmitting(true);
      const dataSend = {
        campaignId: Number(campaignId),
        questions: questions.map((q) => ({
          description: q.description,
          scaleId: Number(q.selectedScale!.id),
          weight: q.weight / 100,
          isOptional: q.isOptional,
          visibleTo: q.visibleTo,
        })),
      };

      await SaveOrUpdateQuestionsService(dataSend, questionId, competenceId);

      toast.success(
        questionId
          ? t('questions.messages.success.updated')
          : t('questions.messages.success.created')
      );

      handleClose();
      onSuccess();
    } catch (error: any) {
      console.error('Error saving question:', error);
      toast.error(
        error?.message ||
        t(questionId ? 'questions.messages.error.updating' : 'questions.messages.error.creating')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = questions.every(
    (q) => q.description && q.selectedScale && q.weight > 0 && q.weight <= 100 && q.visibleTo.length > 0
  ) && isWeightValid;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {questionId ? t('questions.dialogs.edit.title') : t('questions.dialogs.add.title')}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {!isWeightValid && (
            <Alert severity="warning">
              {t('questions.messages.warning.weightSum')}: {totalWeight.toFixed(1)}% / 100%
            </Alert>
          )}

          {questions.map((question, index) => (
            <Box key={question.id}>
              {index > 0 && <Divider sx={{ my: 2 }} />}

              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2">
                    {t('questions.form.questionNumber', { number: index + 1 })}
                  </Typography>
                  {questions.length > 1 && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeQuestion(question.id)}
                    >
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  )}
                </Box>

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label={t('questions.form.fields.description')}
                  value={question.description}
                  onChange={(e) => updateQuestion(question.id, 'description', e.target.value)}
                  placeholder={t('questions.form.placeholders.description')}
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label={t('questions.form.fields.weight')}
                    value={question.weight}
                    onChange={(e) => updateQuestion(question.id, 'weight', Number(e.target.value))}
                    inputProps={{ min: 0, max: 100, step: 0.1 }}
                    helperText={t('questions.form.validation.maxWeight')}
                  />

                  <Autocomplete
                    fullWidth
                    loading={loading}
                    options={scales}
                    value={question.selectedScale}
                    onChange={(_, newValue) => updateQuestion(question.id, 'selectedScale', newValue)}
                    getOptionLabel={(option) => option.name}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('questions.form.fields.scale')}
                        placeholder={t('questions.form.placeholders.scale')}
                      />
                    )}
                  />
                </Box>

                <Autocomplete
                  multiple
                  fullWidth
                  options={relationshipOptions}
                  value={relationshipOptions.filter((option) =>
                    question.visibleTo.includes(option.value)
                  )}
                  onChange={(_, newValue) =>
                    updateQuestion(
                      question.id,
                      'visibleTo',
                      newValue.map((option) => option.value)
                    )
                  }
                  getOptionLabel={(option) => option.label}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('questions.form.fields.visibleTo')}
                      placeholder={t('questions.form.placeholders.visibleTo')}
                    />
                  )}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={question.isOptional}
                      onChange={(e) => updateQuestion(question.id, 'isOptional', e.target.checked)}
                    />
                  }
                  label={t('questions.form.fields.isOptional')}
                />
              </Stack>
            </Box>
          ))}

          <Button
            variant="outlined"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={addQuestion}
            fullWidth
          >
            {t('questions.actions.addAnother')}
          </Button>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit" disabled={submitting}>
          {t('questions.actions.cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isValid || submitting}
        >
          {submitting
            ? t('questions.actions.saving')
            : questionId
              ? t('questions.actions.update')
              : t('questions.actions.add')
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
}
