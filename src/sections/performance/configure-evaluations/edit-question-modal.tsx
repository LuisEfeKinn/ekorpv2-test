import type { IScale, IQuestion } from 'src/types/performance';

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

import { useTranslate } from 'src/locales';
import { GetScalesPaginationService } from 'src/services/performance/scales.service';
import { SaveOrUpdateQuestionsService } from 'src/services/performance/questions.service';
import { GetPerformanceRelatedDataService } from 'src/services/performance/related-data.service';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  question: IQuestion | null;
};

export function EditQuestionModal({ open, onClose, onSuccess, question }: Props) {
  const { t } = useTranslate('performance');

  const [scales, setScales] = useState<IScale[]>([]);
  const [relationshipOptions, setRelationshipOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [description, setDescription] = useState('');
  const [weight, setWeight] = useState<number>(0);
  const [selectedScale, setSelectedScale] = useState<IScale | null>(null);
  const [isOptional, setIsOptional] = useState(false);
  const [visibleTo, setVisibleTo] = useState<string[]>([]);

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

  // Cargar datos de la pregunta cuando se abre el modal
  useEffect(() => {
    if (open && question) {
      setDescription(question.description || '');
      setWeight((question.weight || 0) * 100); // Convertir de 0-1 a 0-100
      setIsOptional(question.isOptional || false);
      
      // Extraer los relationships del array visibleFor
      const relationships = question.visibleFor?.map((vf: any) => vf.relationship) || [];
      setVisibleTo(relationships);

      // Buscar y setear la escala
      if (question.scale && scales.length > 0) {
        const scale = scales.find(s => s.id === question.scale.id);
        if (scale) {
          setSelectedScale(scale);
        }
      }
    }
  }, [open, question, scales]);

  useEffect(() => {
    if (open) {
      loadScales();
      loadRelatedData();
    }
  }, [open, loadScales, loadRelatedData]);

  const handleClose = () => {
    setDescription('');
    setWeight(0);
    setSelectedScale(null);
    setIsOptional(false);
    setVisibleTo([]);
    onClose();
  };

  const handleSubmit = async () => {
    if (!description || !selectedScale || weight <= 0 || visibleTo.length === 0) {
      toast.error(t('questions.messages.error.validation'));
      return;
    }

    if (!question?.id) {
      toast.error(t('questions.editDialog.messages.error.noId'));
      return;
    }

    try {
      setSubmitting(true);
      const dataSend = {
        campaignId: Number(question.campaignId),
        description,
        weight: weight / 100, // Convertir de 0-100 a 0-1
        scaleId: Number(selectedScale.id),
        isOptional,
        visibleTo,
      };

      await SaveOrUpdateQuestionsService(dataSend, question.id);
      
      toast.success(t('questions.editDialog.messages.success.updated'));
      
      handleClose();
      onSuccess();
    } catch (error: any) {
      console.error('Error updating question:', error);
      toast.error(
        error?.message || t('questions.editDialog.messages.error.updating')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = description && selectedScale && weight > 0 && weight <= 100 && visibleTo.length > 0;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {t('questions.editDialog.title')}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label={t('questions.form.fields.description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('questions.form.placeholders.description')}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              type="number"
              label={t('questions.form.fields.weight')}
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              inputProps={{ min: 0, max: 100, step: 0.1 }}
              helperText={t('questions.form.validation.maxWeight')}
            />

            <Autocomplete
              fullWidth
              loading={loading}
              options={scales}
              value={selectedScale}
              onChange={(_, newValue) => setSelectedScale(newValue)}
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
            value={relationshipOptions.filter((option) => visibleTo.includes(option.value))}
            onChange={(_, newValue) => setVisibleTo(newValue.map((option) => option.value))}
            getOptionLabel={(option) => option.label}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('questions.form.fields.visibleFor')}
                placeholder={t('questions.form.placeholders.visibleFor')}
              />
            )}
          />

          <FormControlLabel
            control={
              <Switch
                checked={isOptional}
                onChange={(e) => setIsOptional(e.target.checked)}
              />
            }
            label={t('questions.form.fields.isOptional')}
          />
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
            ? t('questions.editDialog.actions.saving')
            : t('questions.editDialog.actions.update')
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
}
