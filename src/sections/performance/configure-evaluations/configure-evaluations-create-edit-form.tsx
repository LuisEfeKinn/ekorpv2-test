'use client';

import type { IConfigureEvaluation } from 'src/types/performance';

import { useForm } from 'react-hook-form';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import { alpha, useTheme } from '@mui/material/styles';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { GetJobsPaginationService } from 'src/services/architecture/business/jobs.service';
import { GetPerformanceRelatedDataService } from 'src/services/performance/related-data.service';
import { GetUserManagmentPaginationService } from 'src/services/employees/user-managment.service';
import { GetConfigureTestsPaginationService } from 'src/services/performance/configure-tests.service';
import { GetOrganizationalUnitPaginationService } from 'src/services/organization/organizationalUnit.service';
import { SaveOrUpdateConfigureEvaluationService } from 'src/services/performance/configure-evaluations.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { AddEvaluatorConfigModal } from './add-evaluator-config-modal';

// ----------------------------------------------------------------------

type OptionType = {
  value: string;
  label: string;
};

type Props = {
  currentEvaluation?: IConfigureEvaluation;
};

export function ConfigureEvaluationsCreateEditForm({ currentEvaluation }: Props) {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslate('performance');
  const { t: tCommon } = useTranslate('common');

  const [evaluationTypes, setEvaluationTypes] = useState<OptionType[]>([]);
  const [, setLoading] = useState(true);

  // Modal states
  const [openEvaluatorConfigModal, setOpenEvaluatorConfigModal] = useState(false);

  // Data lists
  const [evaluatorConfigs, setEvaluatorConfigs] = useState<any[]>([]);

  // Autocomplete data
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [evaluationRelationships, setEvaluationRelationships] = useState<OptionType[]>([]);

  // Selected values
  const [selectedDepartments, setSelectedDepartments] = useState<any[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<any[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  // Helper para convertir fecha ISO a YYYY-MM-DD
  const formatDateForInput = (isoDate: string) => {
    if (!isoDate) return '';
    return isoDate.split('T')[0];
  };

  const defaultValues = {
    name: currentEvaluation?.name || '',
    description: currentEvaluation?.description || '',
    type: currentEvaluation?.type || '',
    startDate: formatDateForInput(currentEvaluation?.startDate || ''),
    endDate: formatDateForInput(currentEvaluation?.endDate || ''),
    autoAssign: currentEvaluation?.autoAssign || false,
    editableEvaluators: currentEvaluation?.editableEvaluators || false,
  };

  const methods = useForm({
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  // Load autocomplete data
  const loadDepartments = useCallback(async () => {
    try {
      const response = await GetOrganizationalUnitPaginationService({ page: 1, perPage: 50 });
      if (response?.data && Array.isArray(response.data)) {
        setDepartments(response?.data || []);
      }
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  }, []);

  const loadPositions = useCallback(async () => {
    try {
      const response = await GetJobsPaginationService({ page: 1, perPage: 50 });
      if (response?.data && Array.isArray(response.data)) {
        setPositions(response?.data || []);
      }
    } catch (error) {
      console.error('Error loading positions:', error);
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      const response = await GetUserManagmentPaginationService({ page: 1, perPage: 50 });
      setEmployees(response?.data?.data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  }, []);

  const loadTemplates = useCallback(async (search: string = '') => {
    try {
      const response = await GetConfigureTestsPaginationService({ page: 1, perPage: 20, search });
      setTemplates(response?.data?.data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
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
          setEvaluationRelationships(response.data.data.evaluationRelationships || []);
        }

        // Load autocomplete data
        await Promise.all([loadDepartments(), loadPositions(), loadEmployees()]);
      } catch (error: any) {
        console.error('Error loading related data:', error);
        toast.error(t(error?.message) || t('configure-evaluations.messages.error.loadingRelatedData'));
      } finally {
        setLoading(false);
      }
    };

    loadRelatedData();
  }, [loadDepartments, loadPositions, loadEmployees, t]);

  // Precargar datos cuando se está editando
  useEffect(() => {
    if (currentEvaluation) {
      // Precargar template si existe (usando any para evitar errores de tipo)
      const evaluation = currentEvaluation as any;
      if (evaluation.template) {
        setSelectedTemplate({
          id: evaluation.template.id,
          name: evaluation.template.name,
        });
      } else if (evaluation.templateId) {
        // Si solo tenemos el ID, lo cargamos
        loadTemplates().then(() => {
          const template = templates.find((tp) => tp.id === evaluation.templateId);
          if (template) {
            setSelectedTemplate(template);
          }
        });
      }

      // Precargar departamentos (solo si departments está cargado)
      if (currentEvaluation.campaignDepartments && departments.length > 0) {
        const loadedDepartments = currentEvaluation.campaignDepartments
          .map((cd: any) => departments.find((d) => d.id === cd.organizationalUnitId || d.id === Number(cd.organizationalUnitId)))
          .filter(Boolean);
        setSelectedDepartments(loadedDepartments);
      }

      // Precargar posiciones (solo si positions está cargado)
      if (currentEvaluation.campaignPositions && positions.length > 0) {
        const loadedPositions = currentEvaluation.campaignPositions
          .map((cp: any) => positions.find((p) => p.id === cp.jobPositionId || p.id === Number(cp.jobPositionId)))
          .filter(Boolean);
        setSelectedPositions(loadedPositions);
      }

      // Precargar empleados (solo si employees está cargado)
      if (currentEvaluation.campaignEmployees && employees.length > 0) {
        const loadedEmployees = currentEvaluation.campaignEmployees
          .map((ce: any) => employees.find((e) => e.id === ce.employeeId || e.id === Number(ce.employeeId)))
          .filter(Boolean);
        setSelectedEmployees(loadedEmployees);
      }

      // Precargar evaluatorConfigs con weight convertido a porcentaje (0-1 -> 0-100)
      if (currentEvaluation.evaluatorConfigs) {
        const loadedEvaluatorConfigs = currentEvaluation.evaluatorConfigs.map((ec: any) => ({
          relationship: ec.relationship,
          weight: ec.weight * 100, // Convertir de decimal a porcentaje
          maxEvaluators: ec.maxEvaluators,
          enabled: ec.enabled,
        }));
        setEvaluatorConfigs(loadedEvaluatorConfigs);
      }
    }
  }, [currentEvaluation, departments, positions, employees, templates, loadTemplates]);

  // Handlers for evaluator configs
  const handleAddEvaluatorConfig = (
    relationship: string,
    weight: number,
    maxEvaluators: number,
    enabled: boolean
  ) => {
    setEvaluatorConfigs((prev) => [
      ...prev,
      { relationship, weight, maxEvaluators, enabled },
    ]);
  };

  const handleRemoveEvaluatorConfig = (index: number) => {
    setEvaluatorConfigs((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      const evaluationId = currentEvaluation?.id;

      // Prepare data with all sections
      const payload = {
        ...data,
        templateId: selectedTemplate?.id ? Number(selectedTemplate.id) : null,
        departments: selectedDepartments.map((d) => Number(d.id)),
        positions: selectedPositions.map((p) => Number(p.id)),
        employees: selectedEmployees.map((e) => Number(e.id)),
        evaluatorConfigs: evaluatorConfigs.map(({ relationship, weight, maxEvaluators, enabled }) => ({
          relationship,
          weight: weight / 100, // Convertir porcentaje a decimal (0-1)
          maxEvaluators,
          enabled,
        })),
      };

      const response = await SaveOrUpdateConfigureEvaluationService(payload, evaluationId);

      if (response?.status === 200 || response?.status === 201) {
        toast.success(
          currentEvaluation
            ? t('configure-evaluations.messages.success.updated')
            : t('configure-evaluations.messages.success.created')
        );

        router.push(paths.dashboard.performance.configureEvaluations);
      } else {
        throw new Error('Unexpected response status');
      }
    } catch (error: any) {
      console.error('Error saving evaluation:', error);
      toast.error(t(error?.message) || t('configure-evaluations.messages.error.saving'));
    }
  });

  const renderBasicInfo = () => (
    <Card 
      sx={{ 
        p: 3,
        boxShadow: theme.customShadows?.card,
        '&:hover': {
          boxShadow: theme.customShadows?.z8,
        },
        transition: 'box-shadow 0.3s ease-in-out',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1.5,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.16)} 0%, ${alpha(theme.palette.primary.dark, 0.24)} 100%)`,
          }}
        >
          <Iconify icon="solar:file-text-bold" width={28} sx={{ color: 'primary.main' }} />
        </Box>
        <Box>
          <Typography variant="h6">
            {t('configure-evaluations.form.sections.basicInfo')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('configure-evaluations.form.sections.basicInfoSubtitle')}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Field.Text
            name="name"
            label={t('configure-evaluations.form.fields.name.label')}
            placeholder={t('configure-evaluations.form.fields.name.helperText')}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Field.Select
            name="type"
            label={t('configure-evaluations.form.fields.type.label')}
            helperText={t('configure-evaluations.form.fields.type.helperText')}
          >
            {evaluationTypes.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {t(`configure-evaluations.types.${type.value}`)}
              </MenuItem>
            ))}
          </Field.Select>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Field.Text
            name="description"
            label={t('configure-evaluations.form.fields.description.label')}
            placeholder={t('configure-evaluations.form.fields.description.helperText')}
            multiline
            rows={3}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Autocomplete
            value={selectedTemplate}
            onChange={(event, newValue) => {
              setSelectedTemplate(newValue);
            }}
            onOpen={() => {
              if (!selectedTemplate || templates.length === 0) {
                loadTemplates();
              }
            }}
            options={templates}
            getOptionLabel={(option) => option.name || ''}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('configure-evaluations.form.fields.template.label')}
                placeholder={t('configure-evaluations.form.fields.template.helperText')}
                onChange={(e) => {
                  loadTemplates(e.target.value);
                }}
              />
            )}
            noOptionsText="No se encontraron plantillas"
          />
        </Grid>
      </Grid>
    </Card>
  );

  const renderDates = () => (
    <Card 
      sx={{ 
        p: 3,
        boxShadow: theme.customShadows?.card,
        '&:hover': {
          boxShadow: theme.customShadows?.z8,
        },
        transition: 'box-shadow 0.3s ease-in-out',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1.5,
            background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.16)} 0%, ${alpha(theme.palette.info.dark, 0.24)} 100%)`,
          }}
        >
          <Iconify icon="solar:calendar-date-bold" width={28} sx={{ color: 'info.main' }} />
        </Box>
        <Box>
          <Typography variant="h6">
            {t('configure-evaluations.form.sections.dates')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('configure-evaluations.form.sections.datesSubtitle')}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Field.Text
            name="startDate"
            label={t('configure-evaluations.form.fields.startDate.label')}
            type="date"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Field.Text
            name="endDate"
            label={t('configure-evaluations.form.fields.endDate.label')}
            type="date"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>
    </Card>
  );

  const renderScope = () => (
    <Card 
      sx={{ 
        p: 3,
        boxShadow: theme.customShadows?.card,
        '&:hover': {
          boxShadow: theme.customShadows?.z8,
        },
        transition: 'box-shadow 0.3s ease-in-out',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1.5,
            background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.16)} 0%, ${alpha(theme.palette.secondary.dark, 0.24)} 100%)`,
          }}
        >
          <Iconify icon="solar:users-group-rounded-bold" width={28} sx={{ color: 'secondary.main' }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6">
            {t('configure-evaluations.form.sections.scope')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('configure-evaluations.form.sections.scopeSubtitle')}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {selectedDepartments.length > 0 && (
            <Chip 
              icon={<Iconify icon="solar:box-minimalistic-bold" width={16} />}
              label={`${selectedDepartments.length} dept.`}
              size="small"
              color="secondary"
              variant="soft"
            />
          )}
          {selectedPositions.length > 0 && (
            <Chip 
              icon={<Iconify icon="solar:case-minimalistic-bold" width={16} />}
              label={`${selectedPositions.length} pos.`}
              size="small"
              color="secondary"
              variant="soft"
            />
          )}
          {selectedEmployees.length > 0 && (
            <Chip 
              icon={<Iconify icon="solar:user-rounded-bold" width={16} />}
              label={`${selectedEmployees.length} emp.`}
              size="small"
              color="secondary"
              variant="soft"
            />
          )}
        </Stack>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Autocomplete
            multiple
            fullWidth
            options={departments}
            value={selectedDepartments}
            onChange={(_, newValue) => setSelectedDepartments(newValue)}
            getOptionLabel={(option) => option.name || ''}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('configure-evaluations.form.fields.departments.label')}
                placeholder={t('configure-evaluations.form.fields.departments.placeholder')}
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip {...getTagProps({ index })} key={option.id} label={option.name} />
              ))
            }
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Autocomplete
            multiple
            fullWidth
            options={positions}
            value={selectedPositions}
            onChange={(_, newValue) => setSelectedPositions(newValue)}
            getOptionLabel={(option) => option.name || ''}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('configure-evaluations.form.fields.positions.label')}
                placeholder={t('configure-evaluations.form.fields.positions.placeholder')}
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip {...getTagProps({ index })} key={option.id} label={option.name} />
              ))
            }
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Autocomplete
            multiple
            fullWidth
            options={employees}
            value={selectedEmployees}
            onChange={(_, newValue) => setSelectedEmployees(newValue)}
            getOptionLabel={(option) => {
              const firstName = option.firstName || '';
              const firstLastName = option.firstLastName || '';
              const fullName = `${firstName} ${firstLastName}`.trim();
              const email = option.email || '';
              return fullName ? `${fullName} - ${email}` : email || 'Sin información';
            }}
            renderOption={(props, option) => {
              const firstName = option.firstName || '';
              const firstLastName = option.firstLastName || '';
              const fullName = `${firstName} ${firstLastName}`.trim();
              const email = option.email || 'Sin email';
              
              return (
                <Box component="li" {...props} key={option.id}>
                  <Box>
                    <Typography variant="body2">
                      {fullName || 'Sin nombre'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {email}
                    </Typography>
                  </Box>
                </Box>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('configure-evaluations.form.fields.employees.label')}
                placeholder={t('configure-evaluations.form.fields.employees.placeholder')}
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const firstName = option.firstName || '';
                const firstLastName = option.firstLastName || '';
                const fullName = `${firstName} ${firstLastName}`.trim();
                const displayLabel = fullName || option.email || 'Sin nombre';
                
                return (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={displayLabel}
                  />
                );
              })
            }
          />
        </Grid>
      </Grid>
    </Card>
  );

  const renderEvaluatorConfigs = () => (
    <Card 
      sx={{ 
        p: 3,
        boxShadow: theme.customShadows?.card,
        '&:hover': {
          boxShadow: theme.customShadows?.z8,
        },
        transition: 'box-shadow 0.3s ease-in-out',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 1.5,
              background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.16)} 0%, ${alpha(theme.palette.error.dark, 0.24)} 100%)`,
            }}
          >
            <Iconify icon="solar:user-plus-bold" width={28} sx={{ color: 'error.main' }} />
          </Box>
          <Box>
            <Typography variant="h6">
              {t('configure-evaluations.form.sections.evaluators')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('configure-evaluations.form.sections.evaluatorsSubtitle')}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => setOpenEvaluatorConfigModal(true)}
          sx={{ 
            background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.darker} 100%)`,
            },
          }}
        >
          {t('configure-evaluations.form.fields.evaluatorConfigs.addButton')}
        </Button>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {evaluatorConfigs.length === 0 ? (
        <Box 
          sx={{ 
            py: 6, 
            textAlign: 'center',
            borderRadius: 2,
            border: `2px dashed ${alpha(theme.palette.grey[500], 0.2)}`,
            bgcolor: alpha(theme.palette.grey[500], 0.04),
          }}
        >
          <Iconify icon="solar:user-plus-bold" width={48} sx={{ color: 'text.disabled', mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            {t('configure-evaluations.form.fields.evaluatorConfigs.emptyMessage')}
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
            Haz clic en el botón para configurar evaluadores
          </Typography>
        </Box>
      ) : (
        <TableContainer sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.grey[500], 0.16)}` }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.grey[500], 0.08) }}>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('configure-evaluations.form.fields.evaluatorConfigs.relationship')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{t('configure-evaluations.form.fields.evaluatorConfigs.weight')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{t('configure-evaluations.form.fields.evaluatorConfigs.maxEvaluators')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>{t('configure-evaluations.form.fields.evaluatorConfigs.enabled')}</TableCell>
                <TableCell align="right" width={80} />
              </TableRow>
            </TableHead>
            <TableBody>
              {evaluatorConfigs.map((config, index) => (
                <TableRow 
                  key={index}
                  sx={{ 
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                    transition: 'background-color 0.2s',
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 1,
                          bgcolor: alpha(theme.palette.error.main, 0.12),
                        }}
                      >
                        <Iconify icon="solar:user-rounded-bold" width={18} sx={{ color: 'error.main' }} />
                      </Box>
                      <Typography variant="body2" fontWeight="medium">
                        {t(`configure-evaluations.relationships.${config.relationship}`)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Chip 
                      label={`${Number(config.weight).toFixed(1)}%`}
                      size="small"
                      color="error"
                      variant="soft"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="medium">
                      {config.maxEvaluators}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      icon={config.enabled ? <Iconify icon="solar:check-circle-bold" width={16} /> : <Iconify icon="solar:close-circle-bold" width={16} />}
                      label={config.enabled ? 'Activo' : 'Inactivo'}
                      color={config.enabled ? 'success' : 'default'}
                      size="small"
                      variant="soft"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      color="error" 
                      onClick={() => handleRemoveEvaluatorConfig(index)}
                      sx={{ 
                        '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) },
                      }}
                    >
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Card>
  );

  const renderConfig = () => (
    <Card 
      sx={{ 
        p: 3,
        boxShadow: theme.customShadows?.card,
        '&:hover': {
          boxShadow: theme.customShadows?.z8,
        },
        transition: 'box-shadow 0.3s ease-in-out',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1.5,
            background: `linear-gradient(135deg, ${alpha(theme.palette.grey[600], 0.16)} 0%, ${alpha(theme.palette.grey[800], 0.24)} 100%)`,
          }}
        >
          <Iconify icon="solar:settings-bold" width={28} sx={{ color: 'text.secondary' }} />
        </Box>
        <Box>
          <Typography variant="h6">
            {t('configure-evaluations.form.sections.config')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('configure-evaluations.form.sections.configSubtitle')}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box 
            sx={{ 
              p: 2.5, 
              borderRadius: 2, 
              border: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
              bgcolor: alpha(theme.palette.grey[500], 0.04),
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.04),
                borderColor: alpha(theme.palette.primary.main, 0.24),
              },
              transition: 'all 0.2s',
            }}
          >
            <Field.Switch
              name="autoAssign"
              label={t('configure-evaluations.form.fields.autoAssign.label')}
              helperText={t('configure-evaluations.form.fields.autoAssign.helperText')}
            />
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Box 
            sx={{ 
              p: 2.5, 
              borderRadius: 2, 
              border: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
              bgcolor: alpha(theme.palette.grey[500], 0.04),
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.04),
                borderColor: alpha(theme.palette.primary.main, 0.24),
              },
              transition: 'all 0.2s',
            }}
          >
            <Field.Switch
              name="editableEvaluators"
              label={t('configure-evaluations.form.fields.editableEvaluators.label')}
              helperText={t('configure-evaluations.form.fields.editableEvaluators.helperText')}
            />
          </Box>
        </Grid>
      </Grid>
    </Card>
  );

  const renderActions = () => (
    <Card 
      sx={{ 
        p: 3,
        boxShadow: theme.customShadows?.card,
        background: `linear-gradient(135deg, ${alpha(theme.palette.grey[100], 0.9)} 0%, ${alpha(theme.palette.grey[200], 0.9)} 100%)`,
        ...(theme.palette.mode === 'dark' && {
          background: `linear-gradient(135deg, ${alpha(theme.palette.grey[800], 0.9)} 0%, ${alpha(theme.palette.grey[900], 0.9)} 100%)`,
        }),
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            size="medium"
            variant="outlined"
            color="inherit"
            onClick={() => router.back()}
            startIcon={<Iconify icon="solar:reply-bold" />}
          >
            {tCommon('actions.cancel')}
          </Button>

          <Button
            size="medium"
            type="submit"
            variant="contained"
            loading={isSubmitting}
            loadingIndicator={tCommon('actions.saving')}
            startIcon={currentEvaluation ? <Iconify icon="solar:pen-bold" /> : <Iconify icon="mingcute:add-line" />}
            sx={{ 
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              boxShadow: `0 8px 16px 0 ${alpha(theme.palette.primary.main, 0.24)}`,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.darker} 100%)`,
                boxShadow: `0 8px 16px 0 ${alpha(theme.palette.primary.main, 0.48)}`,
              },
            }}
          >
            {currentEvaluation ? tCommon('actions.update') : tCommon('actions.create')}
          </Button>
        </Box>
      </Box>
    </Card>
  );

  return (
    <>
      <Form methods={methods} onSubmit={onSubmit}>
        <Stack spacing={3}>
          {renderBasicInfo()}
          {renderDates()}
          {renderScope()}
          {renderEvaluatorConfigs()}
          {renderConfig()}
          {renderActions()}
        </Stack>
      </Form>

      <AddEvaluatorConfigModal
        open={openEvaluatorConfigModal}
        onClose={() => setOpenEvaluatorConfigModal(false)}
        onAdd={handleAddEvaluatorConfig}
        relationships={evaluationRelationships}
      />
    </>
  );
}