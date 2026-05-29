import type { ICompetency } from 'src/types/performance';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { useTranslate } from 'src/locales';
import { GetCompetenciesPaginationService } from 'src/services/architecture/business/competencies.service';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (competenceId: number, competenceName: string, weight: number) => void;
};

export function AddCompetenceModal({ open, onClose, onAdd }: Props) {
  const { t } = useTranslate('performance');

  const [competencies, setCompetencies] = useState<ICompetency[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCompetency, setSelectedCompetency] = useState<ICompetency | null>(null);
  const [weight, setWeight] = useState<number>(0);

  const loadCompetencies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await GetCompetenciesPaginationService({ page: 1, perPage: 100 });
      if (response?.data && Array.isArray(response.data[0])) {
        setCompetencies(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading competencies:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadCompetencies();
    }
  }, [open, loadCompetencies]);

  const handleAdd = () => {
    if (selectedCompetency && weight > 0) {
      onAdd(selectedCompetency.id, selectedCompetency.name, weight);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedCompetency(null);
    setWeight(0);
    onClose();
  };

  const isValid = selectedCompetency && weight > 0 && weight <= 100;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('configure-evaluations.dialogs.addCompetence.title')}</DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          <Autocomplete
            fullWidth
            loading={loading}
            options={competencies}
            value={selectedCompetency}
            onChange={(_, newValue) => setSelectedCompetency(newValue)}
            getOptionLabel={(option) => option.name}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('configure-evaluations.form.fields.competences.select')}
                placeholder={t('configure-evaluations.form.fields.competences.label')}
              />
            )}
          />

          <TextField
            fullWidth
            type="number"
            label={t('configure-evaluations.form.fields.competences.weight')}
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            inputProps={{ min: 0, max: 100, step: 0.1 }}
            helperText={t('configure-evaluations.form.validation.maxWeight')}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          {t('configure-evaluations.dialogs.addCompetence.cancel')}
        </Button>
        <Button onClick={handleAdd} variant="contained" disabled={!isValid}>
          {t('configure-evaluations.dialogs.addCompetence.add')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
