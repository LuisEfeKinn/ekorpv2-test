import type { IScale, ITestQuestion } from 'src/types/performance';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useTranslate } from 'src/locales';
import { GetScalesPaginationService } from 'src/services/performance/scales.service';
import { GetPerformanceRelatedDataService } from 'src/services/performance/related-data.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type QuestionForm = {
  id: string;
  description: string;
  weight: number;
  selectedScale: IScale | null;
  isOptional: boolean;
  visibleFor: string[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (questions: ITestQuestion[]) => void;
  initialQuestions?: ITestQuestion[];
};

const buildInitialQuestion = (): QuestionForm => ({
  id: crypto.randomUUID(),
  description: '',
  weight: 0,
  selectedScale: null,
  isOptional: false,
  visibleFor: [],
});

export function AddQuestionsModal({
  open,
  onClose,
  onSaved,
  initialQuestions,
}: Props) {
  const { t } = useTranslate('performance');

  const [scales, setScales] = useState<IScale[]>([]);
  const [relationshipOptions, setRelationshipOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [questions, setQuestions] = useState<QuestionForm[]>([buildInitialQuestion()]);

  const getRelationshipLabel = useCallback(
    (value: string) => t(`configure-evaluations.relationships.${value}`) || value,
    [t]
  );

  const loadScales = useCallback(async () => {
    try {
      setLoading(true);
      const response = await GetScalesPaginationService({ page: 1, perPage: 100 });
      if (response?.data && Array.isArray(response.data)) {
        setScales(response.data);
      }
    } catch (error) {
      console.error('Error loading scales:', error);
      toast.error(t('configure-tests.questionsModal.messages.error.loadingScales'));
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
      toast.error(t('configure-tests.questionsModal.messages.error.loadingRelationships'));
    }
  }, [t]);

  useEffect(() => {
    if (open) {
      loadScales();
      loadRelatedData();
    }
  }, [open, loadScales, loadRelatedData]);

  useEffect(() => {
    if (!open) return;

    if (initialQuestions && initialQuestions.length > 0) {
      const mapped = initialQuestions.map((question) => ({
        id: crypto.randomUUID(),
        description: question.description || '',
        weight: (question.weight || 0) <= 1 ? (question.weight || 0) * 100 : question.weight || 0,
        selectedScale: scales.find((scale) => Number(scale.id) === Number(question.scaleId)) || null,
        isOptional: question.isOptional || false,
        visibleFor: question.visibleFor || [],
      }));
      setQuestions(mapped);
      return;
    }

    setQuestions([buildInitialQuestion()]);
  }, [open, initialQuestions, scales]);

  const handleClose = () => {
    setQuestions([buildInitialQuestion()]);
    onClose();
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, buildInitialQuestion()]);
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const updateQuestion = (id: string, field: keyof QuestionForm, value: any) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)));
  };

  const totalWeight = questions.reduce((sum, question) => sum + Number(question.weight || 0), 0);
  const isWeightValid = Math.abs(totalWeight - 100) < 0.01;

  const handleSubmit = async () => {
    if (questions.length === 0) {
      try {
        setSubmitting(true);
        onSaved([]);
        toast.success(t('configure-tests.questionsModal.messages.success.localSaved'));
        handleClose();
      } catch (error: any) {
        console.error('Error saving questions:', error);
        toast.error(error?.message || t('configure-tests.questionsModal.messages.error.saving'));
      } finally {
        setSubmitting(false);
      }

      return;
    }

    const invalidQuestion = questions.find(
      (question) =>
        !question.description ||
        !question.selectedScale ||
        Number(question.weight) <= 0 ||
        Number(question.weight) > 100 ||
        question.visibleFor.length === 0
    );

    if (invalidQuestion) {
      toast.error(t('configure-tests.questionsModal.messages.error.validation'));
      return;
    }

    if (!isWeightValid) {
      toast.error(t('configure-tests.questionsModal.messages.error.weightSum'));
      return;
    }

    const normalizedQuestions: ITestQuestion[] = questions.map((question, index) => ({
      description: question.description,
      scaleId: Number(question.selectedScale!.id),
      weight: Number(question.weight) / 100,
      isOptional: question.isOptional,
      order: index + 1,
      visibleFor: question.visibleFor,
    }));

    try {
      setSubmitting(true);

      onSaved(normalizedQuestions);

      toast.success(t('configure-tests.questionsModal.messages.success.localSaved'));

      handleClose();
    } catch (error: any) {
      console.error('Error saving questions:', error);
      toast.error(error?.message || t('configure-tests.questionsModal.messages.error.saving'));
    } finally {
      setSubmitting(false);
    }
  };

  const isValid =
    questions.length === 0 ||
    (questions.every(
      (question) =>
        question.description &&
        question.selectedScale &&
        Number(question.weight) > 0 &&
        Number(question.weight) <= 100 &&
        question.visibleFor.length > 0
    ) && isWeightValid);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('configure-tests.questionsModal.title')}</DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {!isWeightValid && (
            <Alert severity="warning">
              {t('configure-tests.questionsModal.messages.warning.weightSum')}: {totalWeight.toFixed(1)}% / 100%
            </Alert>
          )}

          {questions.map((question, index) => (
            <Box key={question.id}>
              {index > 0 && <Divider sx={{ my: 2 }} />}

              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2">
                    {t('configure-tests.questionsModal.questionNumber', { number: index + 1 })}
                  </Typography>
                  <IconButton size="small" color="error" onClick={() => removeQuestion(question.id)}>
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Box>

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label={t('configure-tests.questionsModal.fields.description')}
                  value={question.description}
                  onChange={(event) => updateQuestion(question.id, 'description', event.target.value)}
                  placeholder={t('configure-tests.questionsModal.placeholders.description')}
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label={t('configure-tests.questionsModal.fields.weight')}
                    value={question.weight}
                    onChange={(event) => updateQuestion(question.id, 'weight', Number(event.target.value))}
                    inputProps={{ min: 0, max: 100, step: 0.1 }}
                    helperText={t('configure-tests.questionsModal.validation.maxWeight')}
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
                        label={t('configure-tests.questionsModal.fields.scale')}
                        placeholder={t('configure-tests.questionsModal.placeholders.scale')}
                      />
                    )}
                  />
                </Box>

                <Autocomplete
                  multiple
                  fullWidth
                  options={relationshipOptions}
                  value={relationshipOptions.filter((option) => question.visibleFor.includes(option.value))}
                  onChange={(_, newValue) =>
                    updateQuestion(
                      question.id,
                      'visibleFor',
                      newValue.map((option) => option.value)
                    )
                  }
                  getOptionLabel={(option) => getRelationshipLabel(option.value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('configure-tests.questionsModal.fields.visibleFor')}
                      placeholder={t('configure-tests.questionsModal.placeholders.visibleFor')}
                    />
                  )}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={question.isOptional}
                      onChange={(event) => updateQuestion(question.id, 'isOptional', event.target.checked)}
                    />
                  }
                  label={t('configure-tests.questionsModal.fields.isOptional')}
                />
              </Stack>
            </Box>
          ))}

          <Button variant="outlined" startIcon={<Iconify icon="mingcute:add-line" />} onClick={addQuestion} fullWidth>
            {t('configure-tests.questionsModal.actions.addAnother')}
          </Button>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button type="button" onClick={handleClose} color="inherit" disabled={submitting}>
          {t('configure-tests.questionsModal.actions.cancel')}
        </Button>
        <Button type="button" onClick={handleSubmit} variant="contained" disabled={!isValid || submitting}>
          {submitting
            ? t('configure-tests.questionsModal.actions.saving')
            : t('configure-tests.questionsModal.actions.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
