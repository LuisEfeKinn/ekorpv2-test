import type { IJobKm, ICompetencyKm } from 'src/types/organization';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { GetOrganizationalUnitPaginationService } from 'src/services/organization/organizationalUnit.service';
import {
  GetJobsKmService,
  SaveOrUpdateJobKmService,
  GetCompetenciesKmService,
} from 'src/services/organization/job-km.service';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

const PositionSchema = z.object({
  name: z.string().min(1),
  code: z.string().max(80).optional().or(z.literal('')),
  objectives: z.string().optional(),
  expectedResults: z.string().optional(),
  requirements: z.string().optional(),
  otherFunctions: z.string().optional(),
  minimumAcademicLevel: z.string().max(512).optional().or(z.literal('')),
  desiredAcademicLevel: z.string().max(512).optional().or(z.literal('')),
  minimumExperience: z.string().max(512).optional().or(z.literal('')),
  desiredExperience: z.string().max(512).optional().or(z.literal('')),
  supervises: z.string().max(512).optional().or(z.literal('')),
  regionalLocation: z.string().max(512).optional().or(z.literal('')),
  headquarters: z.string().max(512).optional().or(z.literal('')),
  version: z.string().max(64).optional().or(z.literal('')),
  numberOfPositions: z.number().int().min(0).optional().nullable(),
  superiorJobId: z.number().optional().nullable(),
  organizationalUnitId: z.number().optional().nullable(),
  // Almacena objetos completos; los IDs se extraen al hacer submit
  competencyIds: z.array(z.any()).optional(),
});

type PositionFormValues = z.infer<typeof PositionSchema>;

// ----------------------------------------------------------------------

type Props = {
  currentPosition?: IJobKm;
};

export function PositionCreateEditForm({ currentPosition }: Props) {
  const router = useRouter();
  const { t } = useTranslate('organization');

  const [jobOptions, setJobOptions] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  const [orgUnitOptions, setOrgUnitOptions] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingOrgUnits, setLoadingOrgUnits] = useState(false);

  const [competencyOptions, setCompetencyOptions] = useState<ICompetencyKm[]>([]);
  const [loadingCompetencies, setLoadingCompetencies] = useState(false);

  const defaultValues: PositionFormValues = {
    name: '',
    code: '',
    objectives: '',
    expectedResults: '',
    requirements: '',
    otherFunctions: '',
    minimumAcademicLevel: '',
    desiredAcademicLevel: '',
    minimumExperience: '',
    desiredExperience: '',
    supervises: '',
    regionalLocation: '',
    headquarters: '',
    version: '',
    numberOfPositions: null,
    superiorJobId: null,
    organizationalUnitId: null,
    competencyIds: [],
  };

  const methods = useForm<PositionFormValues>({
    mode: 'onSubmit',
    resolver: zodResolver(PositionSchema),
    defaultValues,
    values: currentPosition
      ? {
          name: currentPosition.name ?? '',
          code: currentPosition.code ?? '',
          objectives: currentPosition.objectives ?? '',
          expectedResults: currentPosition.expectedResults ?? '',
          requirements: currentPosition.requirements ?? '',
          otherFunctions: currentPosition.otherFunctions ?? '',
          minimumAcademicLevel: currentPosition.minimumAcademicLevel ?? '',
          desiredAcademicLevel: currentPosition.desiredAcademicLevel ?? '',
          minimumExperience: currentPosition.minimumExperience ?? '',
          desiredExperience: currentPosition.desiredExperience ?? '',
          supervises: currentPosition.supervises ?? '',
          regionalLocation: currentPosition.regionalLocation ?? '',
          headquarters: currentPosition.headquarters ?? '',
          version: currentPosition.version ?? '',
          numberOfPositions: currentPosition.numberOfPositions ?? null,
          superiorJobId: currentPosition.superiorJob?.id ?? null,
          organizationalUnitId: currentPosition.organizationalUnit?.id ?? null,
          competencyIds:
            currentPosition.competencies?.map((c) => ({ id: String(c.id), name: c.name })) ?? [],
        }
      : undefined,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  // Pre-cargar opciones cuando hay datos iniciales
  useEffect(() => {
    if (currentPosition?.superiorJob) {
      setJobOptions([
        { id: currentPosition.superiorJob.id, name: currentPosition.superiorJob.name },
      ]);
    }
  }, [currentPosition]);

  useEffect(() => {
    if (currentPosition?.organizationalUnit) {
      setOrgUnitOptions([
        {
          id: currentPosition.organizationalUnit.id,
          name: currentPosition.organizationalUnit.name,
        },
      ]);
    }
  }, [currentPosition]);

  useEffect(() => {
    // Precarga las competencias actuales en las opciones para que los chips
    if (currentPosition?.competencies?.length) {
      setCompetencyOptions((prev) => {
        const existing = new Set(prev.map((c) => c.id));
        const toAdd = currentPosition.competencies!
          .filter((c) => !existing.has(String(c.id)))
          .map((c) => ({ id: String(c.id), name: c.name }));
        return toAdd.length ? [...prev, ...toAdd] : prev;
      });
    }
  }, [currentPosition]);

  // ----------------------------------------------------------------------

  const handleSearchJobs = async (search: string) => {
    try {
      setLoadingJobs(true);
      const response = await GetJobsKmService({ page: 1, perPage: 20, search });
      if (response.status === 200) {
        setJobOptions(
          (response.data?.data ?? []).map((j) => ({ id: j.id, name: j.name }))
        );
      }
    } catch {
      setJobOptions([]);
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleSearchOrgUnits = async (search: string) => {
    try {
      setLoadingOrgUnits(true);
      const response = await GetOrganizationalUnitPaginationService({
        page: 1,
        perPage: 20,
        search,
      });
      if (response.status === 200) {
        const data = response.data[0] || [];
        const flattenUnits = (units: any[]): Array<{ id: number; name: string }> => {
          const result: Array<{ id: number; name: string }> = [];
          units.forEach((unit) => {
            result.push({ id: Number(unit.id), name: unit.name });
            if (unit.children?.length) {
              result.push(...flattenUnits(unit.children));
            }
          });
          return result;
        };
        setOrgUnitOptions(flattenUnits(data as any));
      }
    } catch {
      setOrgUnitOptions([]);
    } finally {
      setLoadingOrgUnits(false);
    }
  };

  const handleSearchCompetencies = async (search: string) => {
    try {
      setLoadingCompetencies(true);
      const response = await GetCompetenciesKmService({ page: 1, perPage: 30, search });
      if (response.status === 200) {
        setCompetencyOptions(response.data?.data?.data ?? []);
      }
    } catch {
      setCompetencyOptions([]);
    } finally {
      setLoadingCompetencies(false);
    }
  };

  // ----------------------------------------------------------------------

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload = {
        ...data,
        superiorJobId: data.superiorJobId ?? null,
        organizationalUnitId: data.organizationalUnitId ?? null,
        numberOfPositions: data.numberOfPositions ?? undefined,
        // Extraer IDs numéricos de los objetos seleccionados
        competencyIds: (data.competencyIds as ICompetencyKm[] ?? []).map((c) => Number(c.id)),
      };

      await SaveOrUpdateJobKmService(payload, currentPosition?.id);

      reset();
      toast.success(
        currentPosition
          ? t('position.messages.updateSuccess')
          : t('position.messages.createSuccess')
      );
      router.push(paths.dashboard.organizations.positions);
    } catch (error: any) {
      console.error('Error saving position:', error);
      toast.error(t(error?.message || 'position.messages.saveError'));
    }
  });

  // ----------------------------------------------------------------------

  const renderDetails = () => (
    <Card>
      <Stack spacing={3} sx={{ p: 3 }}>
        <Typography variant="h6">{t('position.form.sections.details')}</Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <Field.Text
            name="name"
            label={t('position.form.fields.name.label')}
            helperText={t('position.form.fields.name.helperText')}
          />

          <Field.Text
            name="code"
            label={t('position.form.fields.code.label')}
            helperText={t('position.form.fields.code.helperText')}
          />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <Field.Autocomplete
            name="superiorJobId"
            label={t('position.form.fields.superiorJob.label')}
            helperText={t('position.form.fields.superiorJob.helperText')}
            options={jobOptions}
            loading={loadingJobs}
            onOpen={() => {
              if (jobOptions.length <= 1) handleSearchJobs('');
            }}
            onInputChange={(_e, value, reason) => {
              if (reason === 'input') handleSearchJobs(value);
            }}
            getOptionLabel={(option) => {
              if (typeof option === 'number') {
                return jobOptions.find((j) => j.id === option)?.name
                  ?? currentPosition?.superiorJob?.name
                  ?? '';
              }
              return option?.name ?? '';
            }}
            isOptionEqualToValue={(option, value) =>
              option.id === (typeof value === 'number' ? value : value?.id)
            }
            onChange={(_e, newValue) => {
              methods.setValue('superiorJobId', newValue?.id ?? null);
            }}
            slotProps={{
              textField: { placeholder: t('position.form.fields.superiorJob.placeholder') },
            }}
          />

          <Field.Autocomplete
            name="organizationalUnitId"
            label={t('position.form.fields.organizationalUnit.label')}
            helperText={t('position.form.fields.organizationalUnit.helperText')}
            options={orgUnitOptions}
            loading={loadingOrgUnits}
            onOpen={() => {
              if (orgUnitOptions.length <= 1) handleSearchOrgUnits('');
            }}
            onInputChange={(_e, value, reason) => {
              if (reason === 'input') handleSearchOrgUnits(value);
            }}
            getOptionLabel={(option) => {
              if (typeof option === 'number') {
                return orgUnitOptions.find((u) => u.id === option)?.name
                  ?? currentPosition?.organizationalUnit?.name
                  ?? '';
              }
              return option?.name ?? '';
            }}
            isOptionEqualToValue={(option, value) =>
              option.id === (typeof value === 'number' ? value : value?.id)
            }
            onChange={(_e, newValue) => {
              methods.setValue('organizationalUnitId', newValue?.id ?? null);
            }}
            slotProps={{
              textField: { placeholder: t('position.form.fields.organizationalUnit.placeholder') },
            }}
          />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <Field.Text
            name="numberOfPositions"
            type="number"
            label={t('position.form.fields.numberOfPositions.label')}
            helperText={t('position.form.fields.numberOfPositions.helperText')}
            slotProps={{ htmlInput: { min: 0 } }}
            onChange={(e) => {
              const val = e.target.value;
              methods.setValue(
                'numberOfPositions',
                val === '' ? null : parseInt(val, 10)
              );
            }}
          />

          <Field.Text
            name="version"
            label={t('position.form.fields.version.label')}
            helperText={t('position.form.fields.version.helperText')}
          />
        </Box>

        <Field.Autocomplete
          name="competencyIds"
          multiple
          label={t('position.form.fields.competencies.label')}
          helperText={t('position.form.fields.competencies.helperText')}
          options={competencyOptions}
          loading={loadingCompetencies}
          onOpen={() => {
            if (competencyOptions.length === 0) handleSearchCompetencies('');
          }}
          onInputChange={(_e, value, reason) => {
            if (reason === 'input') handleSearchCompetencies(value);
          }}
          getOptionLabel={(option) => option?.name ?? ''}
          isOptionEqualToValue={(option, value) => option?.id === value?.id}
          slotProps={{
            textField: { placeholder: t('position.form.fields.competencies.placeholder') },
          }}
        />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <Field.Text
            name="objectives"
            label={t('position.form.fields.objectives.label')}
            helperText={t('position.form.fields.objectives.helperText')}
            multiline
            minRows={3}
          />

          <Field.Text
            name="expectedResults"
            label={t('position.form.fields.expectedResults.label')}
            helperText={t('position.form.fields.expectedResults.helperText')}
            multiline
            minRows={3}
          />

          <Field.Text
            name="requirements"
            label={t('position.form.fields.requirements.label')}
            helperText={t('position.form.fields.requirements.helperText')}
            multiline
            minRows={3}
          />

          <Field.Text
            name="otherFunctions"
            label={t('position.form.fields.otherFunctions.label')}
            helperText={t('position.form.fields.otherFunctions.helperText')}
            multiline
            minRows={3}
          />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <Field.Text
            name="minimumAcademicLevel"
            label={t('position.form.fields.minimumAcademicLevel.label')}
            helperText={t('position.form.fields.minimumAcademicLevel.helperText')}
            multiline
            minRows={2}
          />

          <Field.Text
            name="desiredAcademicLevel"
            label={t('position.form.fields.desiredAcademicLevel.label')}
            helperText={t('position.form.fields.desiredAcademicLevel.helperText')}
            multiline
            minRows={2}
          />

          <Field.Text
            name="minimumExperience"
            label={t('position.form.fields.minimumExperience.label')}
            helperText={t('position.form.fields.minimumExperience.helperText')}
            multiline
            minRows={2}
          />

          <Field.Text
            name="desiredExperience"
            label={t('position.form.fields.desiredExperience.label')}
            helperText={t('position.form.fields.desiredExperience.helperText')}
            multiline
            minRows={2}
          />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <Field.Text
            name="supervises"
            label={t('position.form.fields.supervises.label')}
            helperText={t('position.form.fields.supervises.helperText')}
          />

          <Field.Text
            name="regionalLocation"
            label={t('position.form.fields.regionalLocation.label')}
            helperText={t('position.form.fields.regionalLocation.helperText')}
          />

          <Field.Text
            name="headquarters"
            label={t('position.form.fields.headquarters.label')}
            helperText={t('position.form.fields.headquarters.helperText')}
          />
        </Box>
      </Stack>
    </Card>
  );

  const renderActions = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'flex-start' }}>
      <Button size="medium" variant="soft" color="inherit" onClick={() => router.back()}>
        {t('position.actions.cancel')}
      </Button>

      <Button
        size="medium"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator={t('position.actions.saving')}
      >
        {currentPosition ? t('position.actions.update') : t('position.actions.create')}
      </Button>
    </Box>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={3}>
        {renderDetails()}
        {renderActions()}
      </Stack>
    </Form>
  );
}
