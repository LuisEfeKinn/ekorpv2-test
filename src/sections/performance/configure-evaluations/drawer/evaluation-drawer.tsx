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
  LaunchEvaluationCampaignService,
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

// ── Evaluator presets by campaign type (weights in UI units: 0-100) ─────────
const EVALUATOR_PRESETS: Record<string, EvaluatorConfig[]> = {
  PERFORMANCE_90: [
    { relationship: 'MANAGER', weight: 100, maxEvaluators: 1, enabled: true },
  ],
  PERFORMANCE_180: [
    { relationship: 'MANAGER', weight: 70, maxEvaluators: 1, enabled: true },
    { relationship: 'SELF', weight: 30, maxEvaluators: 1, enabled: true },
  ],
  PERFORMANCE_270: [
    { relationship: 'MANAGER', weight: 50, maxEvaluators: 1, enabled: true },
    { relationship: 'PEER', weight: 30, maxEvaluators: 3, enabled: true },
    { relationship: 'SELF', weight: 20, maxEvaluators: 1, enabled: true },
  ],
  PERFORMANCE_360: [
    { relationship: 'MANAGER', weight: 40, maxEvaluators: 1, enabled: true },
    { relationship: 'PEER', weight: 30, maxEvaluators: 3, enabled: true },
    { relationship: 'SUBORDINATE', weight: 20, maxEvaluators: 5, enabled: true },
    { relationship: 'SELF', weight: 10, maxEvaluators: 1, enabled: true },
  ],
};

// ── Auto-distribute remaining weight among evaluators with weight=0 ──────────
function distributeWeights(configs: EvaluatorConfig[]): EvaluatorConfig[] {
  const assigned = configs.filter((c) => c.weight > 0);
  const unassigned = configs.filter((c) => !c.weight || c.weight === 0);
  if (unassigned.length === 0) return configs;

  const totalAssigned = assigned.reduce((sum, c) => sum + c.weight, 0);
  const remaining = Math.max(0, 100 - totalAssigned);
  const perItem = Math.round(remaining / unassigned.length);

  return configs.map((c) =>
    !c.weight || c.weight === 0 ? { ...c, weight: perItem } : c
  );
}

// ----------------------------------------------------------------------

export function EvaluationDrawer({ open, onClose, currentEvaluation, onSuccess }: Props) {
  const { t } = useTranslate('performance');
  const { t: tCommon } = useTranslate('common');
  const theme = useTheme();

  const [activeStep, setActiveStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  // campaignId: undefined in new create mode, set after step-1 POST, or currentEvaluation.id in edit
  const [campaignId, setCampaignId] = useState<string | number | undefined>(undefined);

  // Only DRAFT campaigns can be edited; ACTIVE, COMPLETED and CANCELLED are view-only
  const isReadOnly = ['ACTIVE', 'COMPLETED', 'CANCELLED'].includes(currentEvaluation?.status ?? '');

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
  // Tracks which evaluation type was used to populate the evaluatorConfigs preset.
  // If the user goes back and changes the type, the preset gets re-applied.
  const [lastPresetType, setLastPresetType] = useState('');

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
      editableEvaluators: true,
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
      setCampaignId(undefined);
      methods.reset({
        name: '',
        description: '',
        type: '',
        startDate: '',
        endDate: '',
        editableEvaluators: true,
      });
      setSelectedTemplate(null);
      setSelectedVigency(null);
      setEvaluatorConfigs([]);
      setSelectedDepartments([]);
      setSelectedPositions([]);
      setSelectedEmployees([]);
      setLastPresetType('');
      return;
    }

    // Edit mode: campaignId known from the start
    setCampaignId(currentEvaluation.id);

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
          editableEvaluators: data.editableEvaluators ?? true,
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
              weight: Math.round(ec.weight * 100),
              maxEvaluators: ec.maxEvaluators ?? 1,
              enabled: ec.enabled,
            }))
          );
        } else {
          setEvaluatorConfigs([]);
        }
        // Mark the loaded type so we can detect if the user changes it later
        setLastPresetType(data.type || '');
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

  // ── Step-by-step save ─────────────────────────────────────────────────────

  /**
   * Step 1 — POST (create) or PATCH (edit) with basic info fields.
   * Returns the campaignId to use for subsequent PATCH calls.
   */
  const saveStep1 = async (): Promise<string | number> => {
    const values = methods.getValues();
    const payload = {
      name: values.name.trim(),
      type: values.type,
      vigencyId: Number(selectedVigency.id),
      templateId: Number(selectedTemplate.id),
      ...(values.description?.trim() ? { description: values.description.trim() } : {}),
    };

    const response = await SaveOrUpdateConfigureEvaluationService(payload, campaignId);

    // On create (201) the backend returns { data: { rowId } }
    if (!campaignId) {
      const newId = response?.data?.data?.rowId;
      if (!newId) throw new Error('No campaign ID returned from server');
      return newId;
    }
    return campaignId;
  };

  /**
   * Step 2 — PATCH evaluatorConfigs (full replacement).
   * Applies auto-weight distribution before sending.
   */
  const saveStep2 = async (distributed: EvaluatorConfig[]): Promise<void> => {
    const payload = {
      evaluatorConfigs: distributed.map(({ relationship, weight, maxEvaluators, enabled }) => ({
        relationship,
        weight: weight / 100,
        maxEvaluators,
        enabled,
      })),
    };
    await SaveOrUpdateConfigureEvaluationService(payload, campaignId);
  };

  /**
   * Step 3 — PATCH scope (always send all three arrays, even if empty).
   */
  const saveStep3 = async (): Promise<void> => {
    const payload = {
      departments: selectedDepartments.map((d) => Number(d.id)),
      positions: selectedPositions.map((p) => Number(p.id)),
      employees: selectedEmployees.map((e) => Number(e.id)),
    };
    await SaveOrUpdateConfigureEvaluationService(payload, campaignId);
  };

  /**
   * Step 4 — PATCH config: startDate, endDate, editableEvaluators.
   */
  const saveStep4 = async (): Promise<void> => {
    const values = methods.getValues();
    const payload = {
      startDate: new Date(values.startDate).toISOString(),
      endDate: new Date(values.endDate).toISOString(),
      editableEvaluators: values.editableEvaluators,
    };
    await SaveOrUpdateConfigureEvaluationService(payload, campaignId);
  };

  // ── Step navigation ───────────────────────────────────────────────────────
  const handleNext = async () => {
    // In read-only mode just advance without saving anything
    if (isReadOnly) {
      setActiveStep((prev) => prev + 1);
      return;
    }

    // ── Step 0: validate then save basic info ──
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

      if (!selectedVigency) {
        toast.error(t('configure-evaluations.form.fields.vigency.required'));
        hasError = true;
      }

      if (!selectedTemplate) {
        toast.error(t('configure-evaluations.form.fields.template.required'));
        hasError = true;
      }

      if (hasError) return;

      try {
        setIsSaving(true);
        const isCreating = !campaignId;
        const newId = await saveStep1();
        setCampaignId(newId);

        // Show feedback and refresh background list on first creation
        if (isCreating) {
          toast.success(t('configure-evaluations.messages.success.created'));
          onSuccess?.();
        }

        // Apply evaluator preset when the type has changed (or on first creation).
        // This lets users go back, change the type, and get the correct preset.
        if (values.type !== lastPresetType) {
          const preset = EVALUATOR_PRESETS[values.type];
          if (preset) {
            setEvaluatorConfigs(preset);
            setLastPresetType(values.type);
          }
        }

        setActiveStep((prev) => prev + 1);
      } catch (error: any) {
        console.error('Error saving step 1:', error);
        toast.error(error?.response?.data?.message || t('configure-evaluations.messages.error.saving'));
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // ── Step 1: validate then save evaluator configs ──
    if (activeStep === 1) {
      if (evaluatorConfigs.length === 0) {
        toast.warning(t('configure-evaluations.drawer.steps.evaluatorsEmpty'));
        return;
      }

      // Auto-distribute weights among evaluators with weight=0
      const distributed = distributeWeights(evaluatorConfigs);

      // Validate no duplicate relationships
      const relationships = distributed.map((c) => c.relationship).filter(Boolean);
      const hasDuplicates = relationships.length !== new Set(relationships).size;
      if (hasDuplicates) {
        toast.error(t('configure-evaluations.drawer.steps.evaluatorsDuplicateRelationship'));
        return;
      }

      // Validate all have relationship and weight
      const hasIncomplete = distributed.some((c) => !c.relationship || c.weight <= 0);
      if (hasIncomplete) {
        toast.error(t('configure-evaluations.drawer.steps.evaluatorsIncomplete'));
        return;
      }

      // Validate weights sum to 100% (tolerance ±1%)
      const totalWeight = distributed.reduce((sum, c) => sum + c.weight, 0);
      if (Math.abs(totalWeight - 100) > 1) {
        toast.error(t('configure-evaluations.drawer.steps.evaluatorsWeightSum'));
        return;
      }

      try {
        setIsSaving(true);
        setEvaluatorConfigs(distributed);
        await saveStep2(distributed);
        setActiveStep((prev) => prev + 1);
      } catch (error: any) {
        console.error('Error saving step 2:', error);
        toast.error(error?.response?.data?.message || t('configure-evaluations.messages.error.saving'));
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // ── Step 2: validate scope then save ──
    if (activeStep === 2) {
      const hasScope =
        selectedDepartments.length > 0 ||
        selectedPositions.length > 0 ||
        selectedEmployees.length > 0;

      if (!hasScope) {
        toast.error(t('configure-evaluations.drawer.steps.scopeRequired'));
        return;
      }

      try {
        setIsSaving(true);
        await saveStep3();
        setActiveStep((prev) => prev + 1);
      } catch (error: any) {
        console.error('Error saving step 3:', error);
        toast.error(error?.response?.data?.message || t('configure-evaluations.messages.error.saving'));
      } finally {
        setIsSaving(false);
      }
      return;
    }

    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  // ── Validate step 4 dates ─────────────────────────────────────────────────
  const validateDates = (): boolean => {
    const values = methods.getValues();

    if (!values.startDate) {
      methods.setError('startDate', {
        type: 'required',
        message: t('configure-evaluations.form.fields.startDate.required'),
      });
      return false;
    }

    if (!values.endDate) {
      methods.setError('endDate', {
        type: 'required',
        message: t('configure-evaluations.form.fields.endDate.required'),
      });
      return false;
    }

    if (new Date(values.startDate) >= new Date(values.endDate)) {
      methods.setError('endDate', {
        type: 'validate',
        message: t('configure-evaluations.form.fields.endDate.afterStart'),
      });
      return false;
    }

    methods.clearErrors(['startDate', 'endDate']);
    return true;
  };

  // ── Save step 4 and close drawer ─────────────────────────────────────────
  const handleFinish = async () => {
    if (!validateDates()) return;
    try {
      setIsSaving(true);
      await saveStep4();
      toast.success(
        currentEvaluation
          ? t('configure-evaluations.messages.success.updated')
          : t('configure-evaluations.messages.success.created')
      );
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error saving step 4:', error);
      toast.error(error?.response?.data?.message || t('configure-evaluations.messages.error.saving'));
    } finally {
      setIsSaving(false);
    }
  };

  // ── Save step 4 then launch ───────────────────────────────────────────────
  const handleFinishAndLaunch = async () => {
    if (!validateDates()) return;

    // Frontend pre-check before launching
    const hasScope =
      selectedDepartments.length > 0 ||
      selectedPositions.length > 0 ||
      selectedEmployees.length > 0;

    if (evaluatorConfigs.length === 0) {
      toast.error(t('configure-evaluations.drawer.launch.missingEvaluators'));
      return;
    }
    if (!hasScope) {
      toast.error(t('configure-evaluations.drawer.launch.missingScope'));
      return;
    }


    try {
      setIsSaving(true);
      await saveStep4();
      await LaunchEvaluationCampaignService(campaignId);
      toast.success(t('configure-evaluations.messages.success.launched'));
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error launching campaign:', error);
      toast.error(error?.response?.data?.message || t('configure-evaluations.messages.error.launching'));
    } finally {
      setIsSaving(false);
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
          borderBottom: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
          flexShrink: 0,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Box sx={{ flexShrink: 0 }}>
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

          {isReadOnly && (
            <Box
              sx={{
                px: 1.5,
                py: 0.75,
                borderRadius: 1,
                maxWidth: 280,
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                ml: 'auto',
                bgcolor: alpha(theme.palette.warning.main, 0.08),
                border: `1px solid ${alpha(theme.palette.warning.main, 0.24)}`,
              }}
            >
              <Iconify icon="solar:lock-bold-duotone" width={28} sx={{ color: 'warning.main', flexShrink: 0, mt: 0.2, mr: 0.5 }} />
              <Typography variant="caption" color="warning.dark" fontWeight={600}>
                {t('configure-evaluations.drawer.readOnlyBanner')}
              </Typography>
            </Box>
          )}

          <IconButton onClick={onClose} size="small" sx={{ flexShrink: 0 }}>
            <Iconify icon="mingcute:close-line" />
          </IconButton>
        </Stack>
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
                disabled={isReadOnly}
              />
            )}

            {activeStep === 1 && (
              <StepEvaluators
                evaluatorConfigs={evaluatorConfigs}
                evaluationRelationships={evaluationRelationships}
                onUpdate={handleUpdateEvaluator}
                disabled={isReadOnly}
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
                disabled={isReadOnly}
              />
            )}

            {activeStep === 3 && <StepConfig disabled={isReadOnly} />}
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
            {isReadOnly ? (
              /* Solo lectura: navegación entre pasos sin guardar */
              <>
                <Button
                  type="button"
                  variant="outlined"
                  color="inherit"
                  onClick={activeStep === 0 ? onClose : handleBack}
                  startIcon={
                    <Iconify icon={activeStep === 0 ? 'mingcute:close-line' : 'solar:reply-bold'} />
                  }
                >
                  {activeStep === 0 ? tCommon('actions.close') : tCommon('actions.back')}
                </Button>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    {activeStep + 1} / {STEPS.length}
                  </Typography>

                  {isLastStep ? (
                    <Button
                      type="button"
                      variant="outlined"
                      color="inherit"
                      onClick={onClose}
                      startIcon={<Iconify icon="mingcute:close-line" />}
                    >
                      {tCommon('actions.close')}
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
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outlined"
                  color="inherit"
                  onClick={activeStep === 0 ? onClose : handleBack}
                  disabled={isSaving}
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
                    <>
                      <Button
                        type="button"
                        variant="outlined"
                        color="inherit"
                        onClick={handleFinish}
                        disabled={isSaving}
                        startIcon={<Iconify icon="solar:diskette-bold-duotone" />}
                      >
                        {isSaving ? tCommon('actions.saving') : tCommon('actions.saveDraft')}
                      </Button>

                      <Button
                        type="button"
                        variant="contained"
                        color="primary"
                        onClick={handleFinishAndLaunch}
                        disabled={isSaving}
                        startIcon={<Iconify icon="solar:flag-bold" />}
                      >
                        {isSaving ? tCommon('actions.saving') : t('configure-evaluations.actions.launch')}
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="contained"
                      onClick={handleNext}
                      disabled={isSaving}
                      endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
                    >
                      {isSaving ? tCommon('actions.saving') : tCommon('actions.continue')}
                    </Button>
                  )}
                </Stack>
              </>
            )}
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
