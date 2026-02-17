'use client';

import type { ITestObjective, IConfigureTest, ITestCompetence } from 'src/types/performance';

import { useForm } from 'react-hook-form';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import { alpha, useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { GetScalesPaginationService } from 'src/services/performance/scales.service';
import { GetPerformanceRelatedDataService } from 'src/services/performance/related-data.service';
import { SaveOrUpdateConfigureTestsService } from 'src/services/performance/configure-tests.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { AddObjectiveModal } from './add-objective-modal';
import { AddCompetenceModal } from './add-competence-modal';

// ----------------------------------------------------------------------

type OptionType = {
  value: string;
  label: string;
};

type Props = {
  currentTest?: IConfigureTest;
};

export function ConfigureTestsCreateEditForm({ currentTest }: Props) {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslate('performance');

  const [evaluationTypes, setEvaluationTypes] = useState<OptionType[]>([]);
  const [, setLoading] = useState(true);

  // Modal states
  const [openCompetenceModal, setOpenCompetenceModal] = useState(false);
  const [openObjectiveModal, setOpenObjectiveModal] = useState(false);

  // Data lists
  const [competences, setCompetences] = useState<ITestCompetence[]>([]);
  const [objectives, setObjectives] = useState<ITestObjective[]>([]);

  // Autocomplete data
  const [scales, setScales] = useState<any[]>([]);

  // Selected values
  const [selectedScale, setSelectedScale] = useState<any>(null);

  const defaultValues = {
    name: currentTest?.name || '',
    description: currentTest?.description || '',
    type: currentTest?.type || '',
    isActive: currentTest?.isActive ?? true,
    coverImage: currentTest?.coverImage || '',
    objectiveScaleId: currentTest?.objectiveScaleId || null,
  };

  const methods = useForm({
    defaultValues,
  });

  const {
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = methods;

  const watchType = watch('type');

  const loadScales = useCallback(async (search: string = '') => {
    try {
      const response = await GetScalesPaginationService({ page: 1, perPage: 50, search });
      setScales(response?.data || []);
    } catch (error) {
      console.error('Error loading scales:', error);
    }
  }, []);

  // Cargar datos relacionados
  useEffect(() => {
    const loadRelatedData = async () => {
      try {
        setLoading(true);
        const response = await GetPerformanceRelatedDataService({});

        if (response.data?.statusCode === 200 && response.data?.data) {
          setEvaluationTypes(response.data.data.evaluationTypes || []);
        }

        // Load scales
        await loadScales();
      } catch (error: any) {
        console.error('Error loading related data:', error);
        toast.error(t('configure-tests.messages.error.loading'));
      } finally {
        setLoading(false);
      }
    };

    loadRelatedData();
  }, [loadScales, t]);

  // Precargar datos cuando se está editando
  useEffect(() => {
    if (currentTest) {
      // Precargar escala si existe
      if (currentTest.objectiveScale) {
        setSelectedScale({
          id: currentTest.objectiveScale.id,
          name: currentTest.objectiveScale.name,
        });
      }

      // Precargar competencias
      if (currentTest.competences) {
        setCompetences(currentTest.competences);
      }

      // Precargar objetivos
      if (currentTest.objectives) {
        setObjectives(currentTest.objectives);
      }
    }
  }, [currentTest]);

  // Handlers for competences
  const handleAddCompetence = (newCompetence: ITestCompetence) => {
    setCompetences((prev) => [...prev, newCompetence]);
  };

  const handleRemoveCompetence = (index: number) => {
    setCompetences((prev) => prev.filter((_, i) => i !== index));
  };

  // Handlers for objectives
  const handleAddObjective = (newObjective: ITestObjective) => {
    setObjectives((prev) => [...prev, newObjective]);
  };

  const handleRemoveObjective = (index: number) => {
    setObjectives((prev) => prev.filter((_, i) => i !== index));
  };

  const translateType = useCallback(
    (type: string) => t(`configure-evaluations.types.${type}`),
    [t]
  );

  const onSubmit = handleSubmit(async (data) => {
    const testId = currentTest?.id;
    
    try {
      // Prepare data
      const payload = {
        name: data.name,
        description: data.description,
        type: data.type,
        isActive: data.isActive,
        coverImage: data.coverImage || null,
        objectiveScaleId: selectedScale?.id ? Number(selectedScale.id) : null,
        competences: competences.map((comp) => ({
          competencyId: comp.competencyId,
          weight: comp.weight,
          questions: comp.questions || [],
        })),
        objectives: objectives.map((obj) => ({
          objectiveId: obj.objectiveId,
          weight: obj.weight,
          targetValue: obj.targetValue,
          customKpi: obj.customKpi,
        })),
      };

      await SaveOrUpdateConfigureTestsService(payload, testId);

      toast.success(
        testId
          ? t('configure-tests.messages.success.updated')
          : t('configure-tests.messages.success.created')
      );

      router.push(paths.dashboard.performance.configureTests);
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast.error(
        testId
          ? t('configure-tests.messages.error.update')
          : t('configure-tests.messages.error.create')
      );
    }
  });

  return (
    <>
      <Form methods={methods} onSubmit={onSubmit}>
        <Card sx={{ p: 3 }}>
              <Box
                display="grid"
                gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, 1fr)' }}
                gap={3}
              >
                <Field.Text
                  name="name"
                  label={t('configure-tests.form.fields.name')}
                  placeholder={t('configure-tests.form.placeholders.name')}
                  required
                />

                <Field.Select
                  name="type"
                  label={t('configure-tests.form.fields.type')}
                  placeholder={t('configure-tests.form.placeholders.type')}
                  required
                >
                  {evaluationTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {translateType(type.value)}
                    </MenuItem>
                  ))}
                </Field.Select>

                <Box gridColumn="span 2">
                  <Field.Text
                    name="description"
                    label={t('configure-tests.form.fields.description')}
                    placeholder={t('configure-tests.form.placeholders.description')}
                    multiline
                    rows={3}
                  />
                </Box>

                <Field.Text
                  name="coverImage"
                  label={t('configure-tests.form.fields.coverImage')}
                  helperText="URL de la imagen de portada (opcional)"
                />

                <Field.Switch
                  name="isActive"
                  label={t('configure-tests.form.fields.isActive')}
                />

                {watchType === 'OBJECTIVES' && (
                  <Autocomplete
                    fullWidth
                    options={scales}
                    getOptionLabel={(option) => option.name || ''}
                    value={selectedScale}
                    onChange={(event, newValue) => setSelectedScale(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('configure-tests.form.fields.objectiveScale')}
                        placeholder={t('configure-tests.form.placeholders.objectiveScale')}
                      />
                    )}
                  />
                )}
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Competences Section */}
              {watchType && watchType !== 'OBJECTIVES' && (
                <>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 2 }}
                  >
                    <Typography variant="h6">
                      {t('configure-tests.form.fields.competences')}
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<Iconify icon="mingcute:add-line" />}
                      onClick={() => setOpenCompetenceModal(true)}
                    >
                      {t('configure-tests.dialogs.addCompetence.add')}
                    </Button>
                  </Stack>

                  {competences.length > 0 ? (
                    <Stack spacing={1} sx={{ mb: 3 }}>
                      {competences.map((comp, index) => (
                        <Box
                          key={index}
                          sx={{
                            p: 2,
                            border: `1px solid ${alpha(theme.palette.grey[500], 0.24)}`,
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Stack spacing={0.5}>
                            <Typography variant="subtitle2">
                              {comp.competenceName || `${t('configure-tests.form.fields.competence')} #${comp.competencyId}`}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {t('configure-tests.form.fields.weight')} {comp.weight}%
                              {comp.questions && comp.questions.length > 0 && 
                                ` | ${t('configure-tests.form.fields.questions')}: ${comp.questions.length}`
                              }
                            </Typography>
                          </Stack>
                          <IconButton
                            color="error"
                            onClick={() => handleRemoveCompetence(index)}
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" />
                          </IconButton>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      {t('configure-tests.form.messages.noCompetences')}
                    </Typography>
                  )}

                  <Divider sx={{ my: 3 }} />
                </>
              )}

              {/* Objectives Section */}
              {watchType === 'OBJECTIVES' && (
                <>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 2 }}
                  >
                    <Typography variant="h6">
                      {t('configure-tests.form.fields.objectives')}
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<Iconify icon="mingcute:add-line" />}
                      onClick={() => setOpenObjectiveModal(true)}
                    >
                      {t('configure-tests.dialogs.addObjective.add')}
                    </Button>
                  </Stack>

                  {objectives.length > 0 ? (
                    <Stack spacing={1} sx={{ mb: 3 }}>
                      {objectives.map((obj, index) => (
                        <Box
                          key={index}
                          sx={{
                            p: 2,
                            border: `1px solid ${alpha(theme.palette.grey[500], 0.24)}`,
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Stack spacing={0.5}>
                            <Typography variant="subtitle2">
                              {obj.objectiveName || `Objetivo #${obj.objectiveId}`}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {t('configure-tests.form.fields.weight')}: {obj.weight}% | {t('configure-tests.form.fields.target')}: {obj.targetValue} | {t('configure-tests.form.fields.kpi')}: {obj.customKpi}
                            </Typography>
                          </Stack>
                          <IconButton color="error" onClick={() => handleRemoveObjective(index)}>
                            <Iconify icon="solar:trash-bin-trash-bold" />
                          </IconButton>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      No hay objetivos agregados
                    </Typography>
                  )}
                </>
              )}

              <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => router.push(paths.dashboard.performance.configureTests)}
                >
                  {t('configure-tests.actions.cancel')}
                </Button>
                <Button type="submit" variant="contained" loading={isSubmitting}>
                  {currentTest
                    ? t('configure-tests.actions.update')
                    : t('configure-tests.actions.save')}
                </Button>
              </Stack>
            </Card>
      </Form>

      {/* Add Competence Modal */}
      <AddCompetenceModal
        open={openCompetenceModal}
        onClose={() => setOpenCompetenceModal(false)}
        onAdd={handleAddCompetence}
      />

      {/* Add Objective Modal */}
      <AddObjectiveModal
        open={openObjectiveModal}
        onClose={() => setOpenObjectiveModal(false)}
        onAdd={handleAddObjective}
      />
    </>
  );
}
