import { useState } from 'react';

import Box from '@mui/material/Box';
import { Switch } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormHelperText from '@mui/material/FormHelperText';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useTranslate } from 'src/locales';

// ----------------------------------------------------------------------

type OptionType = {
  value: string;
  label: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (relationship: string, weight: number, maxEvaluators: number, enabled: boolean) => void;
  relationships: OptionType[];
};

export function AddEvaluatorConfigModal({ open, onClose, onAdd, relationships }: Props) {
  const { t } = useTranslate('performance');

  const [relationship, setRelationship] = useState<string>('');
  const [weight, setWeight] = useState<number>(0);
  const [maxEvaluators, setMaxEvaluators] = useState<number>(1);
  const [enabled, setEnabled] = useState<boolean>(true);

  const handleAdd = () => {
    if (relationship && weight > 0) {
      onAdd(relationship, weight, maxEvaluators, enabled);
      handleClose();
    }
  };

  const handleClose = () => {
    setRelationship('');
    setWeight(0);
    setMaxEvaluators(1);
    setEnabled(true);
    onClose();
  };

  const isValid = relationship && weight > 0 && weight <= 100 && maxEvaluators > 0;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('configure-evaluations.dialogs.addEvaluatorConfig.title')}</DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>{t('configure-evaluations.form.fields.evaluatorConfigs.relationship')}</InputLabel>
            <Select
              value={relationship}
              label={t('configure-evaluations.form.fields.evaluatorConfigs.relationship')}
              onChange={(e) => setRelationship(e.target.value)}
            >
              {relationships.map((rel) => (
                <MenuItem key={rel.value} value={rel.value}>
                  {t(`configure-evaluations.relationships.${rel.value}`)}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>{t('configure-evaluations.form.fields.evaluatorConfigs.select')}</FormHelperText>
          </FormControl>

          <TextField
            fullWidth
            type="number"
            label={t('configure-evaluations.form.fields.evaluatorConfigs.weight')}
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            inputProps={{ min: 0, max: 100, step: 0.1 }}
            helperText={t('configure-evaluations.form.validation.maxWeight')}
          />

          <TextField
            fullWidth
            type="number"
            label={t('configure-evaluations.form.fields.evaluatorConfigs.maxEvaluators')}
            value={maxEvaluators}
            onChange={(e) => setMaxEvaluators(Number(e.target.value))}
            inputProps={{ min: 1, step: 1 }}
            helperText={t('configure-evaluations.form.validation.minEvaluators')}
          />

          <FormControlLabel
            control={
              <Switch
                checked={enabled}
                onChange={(e: any) => setEnabled(e.target.checked)}
              />
            }
            label={t('configure-evaluations.form.fields.evaluatorConfigs.enabled')}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          {t('configure-evaluations.dialogs.addEvaluatorConfig.cancel')}
        </Button>
        <Button onClick={handleAdd} variant="contained" disabled={!isValid}>
          {t('configure-evaluations.dialogs.addEvaluatorConfig.add')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
