import type { IScale, IScaleLevel, IScaleFormInput, IScaleTypeOption } from 'src/types/performance';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { SaveOrUpdateScaleService } from 'src/services/performance/scales.service';
import { GetPerformanceRelatedDataService } from 'src/services/performance/related-data.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';
import { ConfirmDialog } from 'src/components/custom-dialog';

// ----------------------------------------------------------------------

type Props = {
  currentScale?: IScale;
};

export function ScalesCreateEditForm({ currentScale }: Props) {
  const router = useRouter();
  const { t } = useTranslate('performance');
  const addLevelDialog = useBoolean();
  const confirmDialog = useBoolean();
  const [selectedLevelIndex, setSelectedLevelIndex] = useState<number | null>(null);
  const [scaleTypes, setScaleTypes] = useState<IScaleTypeOption[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  // Estados para el formulario de nivel
  const [levelFormData, setLevelFormData] = useState({
    value: '',
    label: '',
    description: '',
  });

  const [levels, setLevels] = useState<Omit<IScaleLevel, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'color'>[]>(
    currentScale?.levels.map(level => ({
      value: level.value,
      label: level.label,
      description: level.description,
    })) || []
  );

  // Cargar tipos de escala desde el backend
  useEffect(() => {
    const fetchScaleTypes = async () => {
      try {
        setLoadingTypes(true);
        const response = await GetPerformanceRelatedDataService({});
        if (response.data.statusCode === 200) {
          setScaleTypes(response.data.data.scaleTypes || []);
        }
      } catch (error) {
        console.error('Error loading scale types:', error);
        toast.error('Error al cargar los tipos de escala');
      } finally {
        setLoadingTypes(false);
      }
    };

    fetchScaleTypes();
  }, []);

  type ScaleFormData = Omit<IScaleFormInput, 'levels'>;

  const ScaleCreateSchema = z.object({
    name: z.string().min(1, { message: t('scales.form.fields.name.required') }),
    description: z.string().min(1, { message: t('scales.form.fields.description.required') }),
    type: z.string().min(1, { message: t('scales.form.fields.type.required') }),
    maxValue: z.number().min(1, { message: t('scales.form.validation.minValue') }),
  });

  const defaultValues: ScaleFormData = {
    name: currentScale?.name || '',
    description: currentScale?.description || '',
    type: currentScale?.type || '',
    maxValue: currentScale?.maxValue || 5,
  };

  const methods = useForm<ScaleFormData>({
    mode: 'onSubmit',
    resolver: zodResolver(ScaleCreateSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (levels.length === 0) {
        toast.error(t('scales.form.validation.minLevels'));
        return;
      }

      const payload = {
        ...data,
        levels,
      };

      const response = await SaveOrUpdateScaleService(
        payload,
        currentScale?.id
      );

      if (response.data.statusCode === 200 || response.data.statusCode === 201) {
        reset();
        toast.success(
          currentScale
            ? t('scales.messages.success.updated')
            : t('scales.messages.success.created')
        );
        router.push(paths.dashboard.performance.scales);
      }
    } catch (error) {
      console.error('Error saving scale:', error);
      toast.error(t('scales.messages.error.saving'));
    }
  });

  const handleAddLevel = () => {
    if (!levelFormData.value || !levelFormData.label || !levelFormData.description) {
      toast.error('Todos los campos son requeridos');
      return;
    }

    const newLevel = {
      value: Number(levelFormData.value),
      label: levelFormData.label,
      description: levelFormData.description,
    };

    setLevels([...levels, newLevel]);
    setLevelFormData({ value: '', label: '', description: '' });
    addLevelDialog.onFalse();
    toast.success('Nivel agregado exitosamente');
  };

  const handleDeleteLevel = (index: number) => {
    const newLevels = levels.filter((_, i) => i !== index);
    setLevels(newLevels);
    confirmDialog.onFalse();
    setSelectedLevelIndex(null);
    toast.success('Nivel eliminado exitosamente');
  };

  const handleOpenDeleteDialog = (index: number) => {
    setSelectedLevelIndex(index);
    confirmDialog.onTrue();
  };

  const renderDetails = () => (
    <Card>
      <Stack spacing={3} sx={{ p: 3 }}>
        <Typography variant="h6">{t('scales.form.sections.details')}</Typography>

        <Field.Text
          name="name"
          label={t('scales.form.fields.name.label')}
          helperText={t('scales.form.fields.name.helperText')}
        />

        <Field.Text
          name="description"
          label={t('scales.form.fields.description.label')}
          helperText={t('scales.form.fields.description.helperText')}
          multiline
          rows={3}
        />

        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          <Field.Select
            name="type"
            label={t('scales.form.fields.type.label')}
            helperText={t('scales.form.fields.type.helperText')}
            disabled={loadingTypes}
            slotProps={{
              input: {
                endAdornment: loadingTypes ? (
                  <CircularProgress size={20} sx={{ mr: 2 }} />
                ) : null,
              },
            }}
          >
            {loadingTypes ? (
              <MenuItem disabled>{t('scales.form.sections.loading')}</MenuItem>
            ) : (
              scaleTypes.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))
            )}
          </Field.Select>

          <Field.Text
            name="maxValue"
            label={t('scales.form.fields.maxValue.label')}
            helperText={t('scales.form.fields.maxValue.helperText')}
            type="number"
            slotProps={{
              input: {
                inputProps: { min: 1 },
              },
            }}
          />
        </Box>
      </Stack>
    </Card>
  );

  const renderLevels = () => (
    <Card>
      <Stack spacing={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{t('scales.form.sections.levels')}</Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={addLevelDialog.onTrue}
          >
            {t('scales.actions.addLevel')}
          </Button>
        </Box>

        {levels.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('scales.form.fields.levels.value.label')}</TableCell>
                  <TableCell>{t('scales.form.fields.levels.label.label')}</TableCell>
                  <TableCell>{t('scales.form.fields.levels.description.label')}</TableCell>
                  <TableCell align="right">{t('scales.form.fields.levels.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {levels.map((level, index) => (
                  <TableRow key={index}>
                    <TableCell>{level.value}</TableCell>
                    <TableCell>{level.label}</TableCell>
                    <TableCell>{level.description}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="error"
                        onClick={() => handleOpenDeleteDialog(index)}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box
            sx={{
              py: 5,
              textAlign: 'center',
              color: 'text.secondary',
            }}
          >
            <Typography variant="body2">
              {t('scales.form.fields.levels.noLevels')}
            </Typography>
          </Box>
        )}
      </Stack>
    </Card>
  );

  const renderAddLevelDialog = () => (
    <Dialog
      open={addLevelDialog.value}
      onClose={addLevelDialog.onFalse}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>{t('scales.dialogs.addLevel.title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 2 }}>
          <TextField
            fullWidth
            type="number"
            label={t('scales.form.fields.levels.value.label')}
            helperText={t('scales.form.fields.levels.value.helperText')}
            value={levelFormData.value}
            onChange={(e) => setLevelFormData({ ...levelFormData, value: e.target.value })}
            slotProps={{
              input: {
                inputProps: { min: 1 },
              },
            }}
          />

          <TextField
            fullWidth
            label={t('scales.form.fields.levels.label.label')}
            helperText={t('scales.form.fields.levels.label.helperText')}
            value={levelFormData.label}
            onChange={(e) => setLevelFormData({ ...levelFormData, label: e.target.value })}
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            label={t('scales.form.fields.levels.description.label')}
            helperText={t('scales.form.fields.levels.description.helperText')}
            value={levelFormData.description}
            onChange={(e) => setLevelFormData({ ...levelFormData, description: e.target.value })}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={addLevelDialog.onFalse}>
          {t('scales.dialogs.addLevel.cancel')}
        </Button>
        <Button variant="contained" onClick={handleAddLevel}>
          {t('scales.dialogs.addLevel.add')}
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title={t('scales.dialogs.deleteLevel.title')}
      content={t('scales.dialogs.deleteLevel.content')}
      action={
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            if (selectedLevelIndex !== null) {
              handleDeleteLevel(selectedLevelIndex);
            }
          }}
        >
          {t('scales.actions.delete')}
        </Button>
      }
    />
  );

  const renderActions = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'flex-start' }}>
      <Button
        size="medium"
        variant="soft"
        color="inherit"
        onClick={() => router.back()}
      >
        {t('scales.actions.cancel')}
      </Button>

      <Button
        size="medium"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator={t('scales.actions.saving')}
      >
        {currentScale ? t('scales.actions.update') : t('scales.actions.save')}
      </Button>
    </Box>
  );

  return (
    <>
      <Form methods={methods} onSubmit={onSubmit}>
        <Stack spacing={3}>
          {renderDetails()}
          {renderLevels()}
          {renderActions()}
        </Stack>
      </Form>

      {renderAddLevelDialog()}
      {renderConfirmDialog()}
    </>
  );
}
