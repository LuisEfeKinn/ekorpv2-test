import type { IObjective, ITestObjective } from 'src/types/performance';

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
import { GetObjectivesPaginationService } from 'src/services/architecture/business/objectives.service';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (objective: ITestObjective) => void;
};

export function AddObjectiveModal({ open, onClose, onAdd }: Props) {
  const { t } = useTranslate('performance');

  const [objectives, setObjectives] = useState<IObjective[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<IObjective | null>(null);
  const [weight, setWeight] = useState<number>(0);
  const [targetValue, setTargetValue] = useState<number>(0);
  const [customKpi, setCustomKpi] = useState<string>('');

  const loadObjectives = useCallback(async () => {
    try {
      setLoading(true);
      const response = await GetObjectivesPaginationService({ page: 1, perPage: 100 });
      if (response?.data && Array.isArray(response.data[0])) {
        setObjectives(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading objectives:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadObjectives();
    }
  }, [open, loadObjectives]);

  const handleAdd = () => {
    if (selectedObjective && weight > 0) {
      onAdd({
        objectiveId: selectedObjective.id,
        objectiveName: selectedObjective.name,
        weight,
        targetValue,
        customKpi,
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedObjective(null);
    setWeight(0);
    setTargetValue(0);
    setCustomKpi('');
    onClose();
  };

  const isValid = selectedObjective && weight > 0 && weight <= 100;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('configure-tests.dialogs.addObjective.title')}</DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          <Autocomplete
            fullWidth
            loading={loading}
            options={objectives}
            value={selectedObjective}
            onChange={(_, newValue) => setSelectedObjective(newValue)}
            getOptionLabel={(option) => option.name}
            renderInput={(params) => (
              <TextField {...params} label={t('configure-tests.dialogs.addObjective.objective')} placeholder={t('configure-tests.dialogs.addObjective.selectObjective')} />
            )}
          />

          <TextField
            fullWidth
            type="number"
            label="Peso (%)"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            inputProps={{ min: 0, max: 100, step: 0.1 }}
            helperText={t('configure-tests.dialogs.addObjective.weightHelper')}
          />

          <TextField
            fullWidth
            type="number"
            label={t('configure-tests.dialogs.addObjective.targetValue')}
            value={targetValue}
            onChange={(e) => setTargetValue(Number(e.target.value))}
            inputProps={{ min: 0, step: 1 }}
          />

          <TextField
            fullWidth
            label={t('configure-tests.dialogs.addObjective.kpi')}
            value={customKpi}
            onChange={(e) => setCustomKpi(e.target.value)}
            multiline
            rows={2}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          {t('configure-tests.dialogs.addObjective.cancel')}
        </Button>
        <Button onClick={handleAdd} variant="contained" disabled={!isValid}>
          {t('configure-tests.dialogs.addObjective.add')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
