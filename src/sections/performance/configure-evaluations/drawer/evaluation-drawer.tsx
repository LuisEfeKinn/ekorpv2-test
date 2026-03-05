'use client';

import type { EvaluatorConfig } from './steps/step-evaluators';
import type { IConfigureEvaluation } from 'src/types/performance';

import { useForm, FormProvider } from 'react-hook-form';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Step from '@mui/material/Step';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Stepper from '@mui/material/Stepper';
import StepLabel from '@mui/material/StepLabel';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import StepConnector from '@mui/material/StepConnector';
import LinearProgress from '@mui/material/LinearProgress';

import { useTranslate } from 'src/locales';
import { GetJobsPaginationService } from 'src/services/architecture/business/jobs.service';
import { GetVigenciesPaginationService } from 'src/services/organization/vigencies.service';
import { GetPerformanceRelatedDataService } from 'src/services/performance/related-data.service';
import { GetUserManagmentPaginationService } from 'src/services/employees/user-managment.service';
import { GetConfigureTestsPaginationService } from 'src/services/performance/configure-tests.service';
import { GetOrganizationalUnitPaginationService } from 'src/services/organization/organizationalUnit.service';
import {
  GetConfigureEvaluationByIdService,
  SaveOrUpdateConfigureEvaluationService,
} from 'src/services/performance/configure-evaluations.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { StepScope } from './steps/step-scope';
import { StepConfig } from './steps/step-config';
import { StepBasicInfo } from './steps/step-basic-info';
import { StepEvaluators } from './steps/step-evaluators';
import { TemplatePreviewDrawer } from './template-preview-drawer';

// ----------------------------------------------------------------------

type OptionType = { value: string; label: string };

type Props = {
  open: boolean;
  onClose: () => void;
  currentEvaluation?: IConfigureEvaluation;
  onSuccess?: () => void;
};

// ----------------------------------------------------------------------

const formatDateForInput = (isoDate?: string) => {
  if (!isoDate) return '';
  return isoDate.split('T')[0];
};

// ----------------------------------------------------------------------

export function EvaluationDrawer({ open, onClose, currentEvaluation, onSuccess }: Props) {
  const { t } = useTranslate('performance');
  const { t: tCommon } = useTranslate('common');
  const theme = useTheme();

  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Related data ─────────────────────────────────────────────────────────
  const [evaluationTypes, setEvaluationTypes] = useState<OptionType[]>([]);
  const [evaluationRelationships, setEvaluationRelationships] = useState<OptionType[]>([]);

  // ── Autocomplete lists ────────────────────────────────────────────────────
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [vigencies, setVigencies] = useState<any[]>([]);

  // ── Selected scope values ─────────────────────────────────────────────────
  const [selectedDepartments, setSelectedDepartments] = useState<any[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<any[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedVigency, setSelectedVigency] = useState<any>(null);
  const [evaluatorConfigs, setEvaluatorConfigs] = useState<EvaluatorConfig[]>([]);

  // ── Fetched evaluation data (for edit prefill) ────────────────────────────
  const [fetchedEvaluation, setFetchedEvaluation] = useState<any>(null);

  // ── Template preview ──────────────────────────────────────────────────────
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | number | null>(null);

  const handlePreviewTemplate = (templateId: string | number) => {
    setPreviewTemplateId(templateId);
    setPreviewOpen(true);
  };

  // ── RHF form ──────────────────────────────────────────────────────────────
  const methods = useForm({
    defaultValues: {
      name: '',
      description: '',
      type: '',
      startDate: '',
      endDate: '',
      autoAssign: false,
      editableEvaluators: false,
    },
  });

  // ── Loaders ───────────────────────────────────────────────────────────────
  const loadDepartments = useCallback(async () => {
    try {
      const response = await GetOrganizationalUnitPaginationService({ page: 1, perPage: 50 });
      if (response?.data && Array.isArray(response.data)) {
        setDepartments((response?.data[0] as any) || []);
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

  const loadVigencies = useCallback(async (search: string = '') => {
    try {
      const response = await GetVigenciesPaginationService({ page: 1, perPage: 20, search });
      setVigencies(response?.data?.data?.data || []);
    } catch (error) {
      console.error('Error loading vigencies:', error);
    }
  }, []);

  // ── Init on open ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    setActiveStep(0);

    const init = async () => {
      try {
        const response = await GetPerformanceRelatedDataService({});
        if (response.data?.statusCode === 200 && response.data?.data) {
          setEvaluationTypes(response.data.data.evaluationTypes || []);
          setEvaluationRelationships(response.data.data.evaluationRelationships || []);
        }
        await Promise.all([loadDepartments(), loadPositions(), loadEmployees()]);
      } catch (error) {
        console.error('Error loading related data:', error);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ── Fetch by ID when editing ──────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    if (!currentEvaluation?.id) {
      // Create mode: reset everything
      setFetchedEvaluation(null);
      methods.reset({
        name: '',
        description: '',
        type: '',
        startDate: '',
        endDate: '',
        autoAssign: false,
        editableEvaluators: false,
      });
      setSelectedTemplate(null);
      setSelectedVigency(null);
      setEvaluatorConfigs([]);
      setSelectedDepartments([]);
      setSelectedPositions([]);
      setSelectedEmployees([]);
      return;
    }

    // Edit mode: fetch full data by ID
    const fetchById = async () => {
      try {
        const response = await GetConfigureEvaluationByIdService(currentEvaluation.id);
        const data = response?.data?.data;
        if (!data) return;

        setFetchedEvaluation(data);

        methods.reset({
          name: data.name || '',
          description: data.description || '',
          type: data.type || '',
          startDate: formatDateForInput(data.startDate),
          endDate: formatDateForInput(data.endDate),
          autoAssign: data.autoAssign ?? false,
          editableEvaluators: data.editableEvaluators ?? false,
        });

        // Template
        if (data.template) {
          setSelectedTemplate({ id: data.template.id, name: data.template.name });
        } else {
          setSelectedTemplate(null);
        }

        // Vigency
        if (data.vigency) {
          setSelectedVigency({ id: data.vigency.id, name: data.vigency.name });
        } else {
          setSelectedVigency(null);
        }

        // Evaluator configs (weight: 0-1 → 0-100)
        if (data.evaluatorConfigs?.length) {
          setEvaluatorConfigs(
            data.evaluatorConfigs.map((ec: any) => ({
              relationship: ec.relationship,
              weight: ec.weight * 100,
              maxEvaluators: ec.maxEvaluators,
              enabled: ec.enabled,
            }))
          );
        } else {
          setEvaluatorConfigs([]);
        }
      } catch (error) {
        console.error('Error fetching evaluation by ID:', error);
      }
    };

    fetchById();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentEvaluation?.id]);

  // ── Prefill scope once lists and fetchedEvaluation are ready ─────────────
  useEffect(() => {
    if (!fetchedEvaluation) return;

    if (fetchedEvaluation.campaignDepartments?.length && departments.length > 0) {
      setSelectedDepartments(
        fetchedEvaluation.campaignDepartments
          .map((cd: any) =>
            departments.find(
              (d) => d.id === cd.organizationalUnitId || d.id === Number(cd.organizationalUnitId)
            )
          )
          .filter(Boolean)
      );
    }

    if (fetchedEvaluation.campaignPositions?.length && positions.length > 0) {
      setSelectedPositions(
        fetchedEvaluation.campaignPositions
          .map((cp: any) =>
            positions.find(
              (p) => p.id === cp.jobPositionId || p.id === Number(cp.jobPositionId)
            )
          )
          .filter(Boolean)
      );
    }

    if (fetchedEvaluation.campaignEmployees?.length && employees.length > 0) {
      setSelectedEmployees(
        fetchedEvaluation.campaignEmployees
          .map((ce: any) =>
            employees.find((e) => e.id === ce.employeeId || e.id === Number(ce.employeeId))
          )
          .filter(Boolean)
      );
    }
  }, [fetchedEvaluation, departments, positions, employees]);

  // ── Evaluator config handlers ─────────────────────────────────────────────
  const handleAddEvaluator = () => {
    setEvaluatorConfigs((prev) => [
      ...prev,
      { relationship: '', weight: 0, maxEvaluators: 1, enabled: true },
    ]);
  };

  const handleRemoveEvaluator = (index: number) => {
    setEvaluatorConfigs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateEvaluator = (
    index: number,
    field: keyof EvaluatorConfig,
    value: string | number | boolean
  ) => {
    setEvaluatorConfigs((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  };

  // ── Step config ───────────────────────────────────────────────────────────
  const STEPS = [
    t('configure-evaluations.drawer.steps.basicInfo'),
    t('configure-evaluations.drawer.steps.evaluators'),
    t('configure-evaluations.drawer.steps.scope'),
    t('configure-evaluations.drawer.steps.config'),
  ];

  const isLastStep = activeStep === STEPS.length - 1;
  const progress = ((activeStep + 1) / STEPS.length) * 100;

  // ── Step navigation ───────────────────────────────────────────────────────
  const handleNext = () => {
    // Step 0: validate name + type
    if (activeStep === 0) {
      const values = methods.getValues();
      let hasError = false;

      if (!values.name?.trim()) {
        methods.setError('name', {
          type: 'required',
          message: t('configure-evaluations.form.fields.name.required'),
        });
        hasError = true;
      } else {
        methods.clearErrors('name');
      }

      if (!values.type) {
        methods.setError('type', {
          type: 'required',
          message: t('configure-evaluations.form.fields.type.required'),
        });
        hasError = true;
      } else {
        methods.clearErrors('type');
      }

      if (hasError) return;
    }

    // Step 1: validate evaluator cards are complete
    if (activeStep === 1) {
      const hasIncomplete = evaluatorConfigs.some(
        (c) => !c.relationship || c.weight <= 0 || c.maxEvaluators < 1
      );
      if (hasIncomplete) {
        toast.error(t('configure-evaluations.drawer.steps.evaluatorsIncomplete'));
        return;
      }
    }

    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  // ── Submit (called via button onClick, NOT form onSubmit) ─────────────────
  const handleSubmit = async () => {
    const isValid = await methods.trigger();
    if (!isValid) return;

    const data = methods.getValues();

    try {
      setIsSubmitting(true);

      const payload = {
        ...data,
        templateId: selectedTemplate?.id ? Number(selectedTemplate.id) : null,
        vigencyId: selectedVigency?.id ? Number(selectedVigency.id) : null,
        departments: selectedDepartments.map((d) => Number(d.id)),
        positions: selectedPositions.map((p) => Number(p.id)),
        employees: selectedEmployees.map((e) => Number(e.id)),
        evaluatorConfigs: evaluatorConfigs.map(({ relationship, weight, maxEvaluators, enabled }) => ({
          relationship,
          weight: weight / 100,
          maxEvaluators,
          enabled,
        })),
      };

      const response = await SaveOrUpdateConfigureEvaluationService(payload, currentEvaluation?.id);

      if (response?.status === 200 || response?.status === 201) {
        toast.success(
          currentEvaluation
            ? t('configure-evaluations.messages.success.updated')
            : t('configure-evaluations.messages.success.created')
        );
        onSuccess?.();
        onClose();
      } else {
        throw new Error('Unexpected response status');
      }
    } catch (error: any) {
      console.error('Error saving evaluation:', error);
      toast.error(t(error?.message) || t('configure-evaluations.messages.error.saving'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 600, md: 680 },
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* ── Header ── */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
          flexShrink: 0,
        }}
      >
        <Box>
          <Typography variant="h6">
            {currentEvaluation
              ? t('configure-evaluations.drawer.editTitle')
              : t('configure-evaluations.drawer.createTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('configure-evaluations.drawer.stepOf', {
              step: String(activeStep + 1),
              total: String(STEPS.length),
            })}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </Box>

      {/* ── Progress bar (primary color) ── */}
      <LinearProgress
        variant="determinate"
        value={progress}
        color="primary"
        sx={{ height: 3, flexShrink: 0 }}
      />

      {/* ── Stepper (bigger circles, primary connector) ── */}
      <Box
        sx={{
          px: 3,
          py: 2,
          borderBottom: `1px solid ${alpha(theme.palette.grey[500], 0.08)}`,
          flexShrink: 0,
        }}
      >
        <Stepper
          activeStep={activeStep}
          alternativeLabel
          connector={
            <StepConnector
              sx={{
                top: 20,
                '& .MuiStepConnector-line': {
                  borderColor: alpha(theme.palette.primary.main, 0.2),
                },
                '&.Mui-active .MuiStepConnector-line': {
                  borderColor: 'primary.main',
                },
                '&.Mui-completed .MuiStepConnector-line': {
                  borderColor: 'primary.main',
                },
              }}
            />
          }
        >
          {STEPS.map((label, index) => (
            <Step key={label}>
              <StepLabel
                StepIconProps={{
                  sx: {
                    width: 40,
                    height: 40,
                    fontSize: '1rem',
                    '& .MuiStepIcon-text': { fontSize: '0.8rem', fontWeight: 700 },
                  },
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: index === activeStep ? 700 : 400,
                    color: index === activeStep ? 'primary.main' : 'text.secondary',
                  }}
                >
                  {label}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* ── Form + Content + Footer ── */}
      <FormProvider {...methods}>
        {/* Prevent accidental Enter-key submission */}
        <Box
          component="form"
          onSubmit={(e) => e.preventDefault()}
          noValidate
          sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          {/* Scrollable content */}
          <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 3 }}>
            {activeStep === 0 && (
              <StepBasicInfo
                evaluationTypes={evaluationTypes}
                templates={templates}
                vigencies={vigencies}
                selectedTemplate={selectedTemplate}
                selectedVigency={selectedVigency}
                onTemplateChange={setSelectedTemplate}
                onVigencyChange={setSelectedVigency}
                loadTemplates={loadTemplates}
                loadVigencies={loadVigencies}
                onPreviewTemplate={handlePreviewTemplate}
              />
            )}

            {activeStep === 1 && (
              <StepEvaluators
                evaluatorConfigs={evaluatorConfigs}
                evaluationRelationships={evaluationRelationships}
                onAdd={handleAddEvaluator}
                onRemove={handleRemoveEvaluator}
                onUpdate={handleUpdateEvaluator}
              />
            )}

            {activeStep === 2 && (
              <StepScope
                departments={departments}
                positions={positions}
                employees={employees}
                selectedDepartments={selectedDepartments}
                selectedPositions={selectedPositions}
                selectedEmployees={selectedEmployees}
                onDepartmentsChange={setSelectedDepartments}
                onPositionsChange={setSelectedPositions}
                onEmployeesChange={setSelectedEmployees}
              />
            )}

            {activeStep === 3 && <StepConfig />}
          </Box>

          {/* ── Footer ── */}
          <Divider />
          <Box
            sx={{
              px: 3,
              py: 2.5,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              bgcolor: alpha(theme.palette.grey[500], 0.04),
            }}
          >
            <Button
              type="button"
              variant="outlined"
              color="inherit"
              onClick={activeStep === 0 ? onClose : handleBack}
              startIcon={
                <Iconify icon={activeStep === 0 ? 'mingcute:close-line' : 'solar:reply-bold'} />
              }
            >
              {activeStep === 0 ? tCommon('actions.cancel') : tCommon('actions.back')}
            </Button>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography variant="caption" color="text.secondary">
                {activeStep + 1} / {STEPS.length}
              </Typography>

              {isLastStep ? (
                <Button
                  type="button"
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  startIcon={
                    currentEvaluation ? (
                      <Iconify icon="solar:pen-bold" />
                    ) : (
                      <Iconify icon="mingcute:add-line" />
                    )
                  }
                >
                  {isSubmitting
                    ? tCommon('actions.saving')
                    : currentEvaluation
                      ? tCommon('actions.update')
                      : tCommon('actions.create')}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
                >
                  {tCommon('actions.continue')}
                </Button>
              )}
            </Stack>
          </Box>
        </Box>
      </FormProvider>
    </Drawer>

    <TemplatePreviewDrawer
      open={previewOpen}
      onClose={() => setPreviewOpen(false)}
      templateId={previewTemplateId}
    />
    </>
  );
}
