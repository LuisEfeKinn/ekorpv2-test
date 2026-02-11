import type { IJob } from 'src/types/architecture/jobs';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { useTranslate } from 'src/locales';
import { SaveOrUpdateJobsService, GetJobsPaginationService, GetJobTypesPaginationService } from 'src/services/architecture/business/jobs.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  currentJob?: IJob;
  onLoadData: () => void;
};

type Option = { value: number; label: string };

export function JobsCreateEditDrawer({ open, onClose, currentJob, onLoadData }: Props) {
  const { t } = useTranslate('business');

  const [jobTypeOptions, setJobTypeOptions] = useState<Option[]>([]);
  const [superiorJobOptions, setSuperiorJobOptions] = useState<Option[]>([]);

  const isEdit = !!currentJob;

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, { message: t('positions.form.fields.name.required') }),
        code: z.string().optional(),
        jobTypeId: z.number().min(1, { message: t('positions.form.fields.jobType.required') }),
        superiorJobId: z.number().optional().nullable(),
        objectives: z.string().optional(),
        expectedResults: z.string().optional(),
        requirements: z.string().optional(),
        otherFunctions: z.string().optional(),
        minimumAcademicLevel: z.string().optional(),
        desiredAcademicLevel: z.string().optional(),
        minimumExperience: z.string().optional(),
        desiredExperience: z.string().optional(),
        supervises: z.string().optional(),
        regionalLocation: z.string().optional(),
        headquarters: z.string().optional(),
        numberOfPositions: z.number().optional().nullable(),
        numberOfHoursPerPosition: z.number().optional().nullable(),
        academicProfile: z.string().optional(),
        psychologicalProfile: z.string().optional(),
        internalRelationship: z.string().optional(),
        externalRelationship: z.string().optional(),
        competencies: z.string().optional(),
      }),
    [t]
  );

  const defaultValues = useMemo(
    () => ({
      name: currentJob?.name || '',
      code: currentJob?.code || '',
      jobTypeId: currentJob?.jobType?.id || 0,
      superiorJobId: currentJob?.superiorJob?.id || null,
      objectives: currentJob?.objectives || '',
      expectedResults: currentJob?.expectedResults || '',
      requirements: currentJob?.requirements || '',
      otherFunctions: currentJob?.otherFunctions || '',
      minimumAcademicLevel: currentJob?.minimumAcademicLevel || '',
      desiredAcademicLevel: currentJob?.desiredAcademicLevel || '',
      minimumExperience: currentJob?.minimumExperience || '',
      desiredExperience: currentJob?.desiredExperience || '',
      supervises: currentJob?.supervises || '',
      regionalLocation: currentJob?.regionalLocation || '',
      headquarters: currentJob?.headquarters || '',
      numberOfPositions: currentJob?.numberOfPositions || null,
      numberOfHoursPerPosition: currentJob?.numberOfHoursPerPosition || null,
      academicProfile: currentJob?.academicProfile || '',
      psychologicalProfile: currentJob?.psychologicalProfile || '',
      internalRelationship: currentJob?.internalRelationship || '',
      externalRelationship: currentJob?.externalRelationship || '',
      competencies: currentJob?.competencies || '',
    }),
    [currentJob]
  );

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(schema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, defaultValues, reset]);

  const loadJobTypes = useCallback(async () => {
    try {
      const res = await GetJobTypesPaginationService({ page: 1, perPage: 1000 });
      const raw = res?.data;
      const list = Array.isArray(raw)
        ? raw
        : raw && typeof raw === 'object' && Array.isArray((raw as any).data)
          ? ((raw as any).data as any[])
          : [];

      const opts = list
        .map((it) => ({ value: Number(it?.id), label: String(it?.name || it?.code || `#${it?.id}`) }))
        .filter((it) => Number.isFinite(it.value) && it.value > 0);
      setJobTypeOptions(opts);
    } catch {
      setJobTypeOptions([]);
    }
  }, []);

  const loadSuperiorJobs = useCallback(async () => {
    try {
      const res = await GetJobsPaginationService({ page: 1, perPage: 1000 });
      const raw = res?.data;
      const list = Array.isArray(raw)
        ? raw
        : raw && typeof raw === 'object' && Array.isArray((raw as any).data)
          ? ((raw as any).data as any[])
          : [];

      const opts = list
        .filter((it) => !currentJob || it.id !== currentJob.id) // Avoid self-reference
        .map((it) => ({ value: Number(it?.id), label: String(it?.name || it?.code || `#${it?.id}`) }))
        .filter((it) => Number.isFinite(it.value) && it.value > 0);
      setSuperiorJobOptions(opts);
    } catch {
      setSuperiorJobOptions([]);
    }
  }, [currentJob]);

  useEffect(() => {
    if (open) {
      loadJobTypes();
      loadSuperiorJobs();
    }
  }, [open, loadJobTypes, loadSuperiorJobs]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload: any = {
        ...data,
        jobType: data.jobTypeId ? { id: Number(data.jobTypeId) } : null,
        superiorJob: data.superiorJobId ? { id: Number(data.superiorJobId) } : null,
      };

      // Clean up helper fields
      delete payload.jobTypeId;
      delete payload.superiorJobId;

      // Handle nulls for empty strings if API requires strict types, 
      // but usually strings are fine. 
      // However, user asked "no tengan datos por defecto". 
      // I'll send exactly what form has (empty strings if touched and cleared).
      
      await SaveOrUpdateJobsService(payload, currentJob?.id);
      
      reset();
      onClose();
      onLoadData();
      toast.success(isEdit ? t('positions.form.messages.updateSuccess') : t('positions.form.messages.createSuccess'));
    } catch (error) {
      console.error(error);
      toast.error(isEdit ? t('positions.form.messages.updateError') : t('positions.form.messages.createError'));
    }
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="right"
      slotProps={{ backdrop: { invisible: true } }}
      PaperProps={{ sx: { width: { xs: 1, md: 480 } } }}
    >
      <Form methods={methods} onSubmit={onSubmit}>
        <Stack sx={{ height: 1, display: 'flex', flexDirection: 'column' }}>
          <Box
            sx={{
              p: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: (theme) => `solid 1px ${theme.vars.palette.divider}`,
            }}
          >
            <Typography variant="h6">
              {isEdit ? t('positions.form.title.edit') : t('positions.form.title.create')}
            </Typography>

            <IconButton onClick={onClose}>
              <Iconify icon="mingcute:close-line" />
            </IconButton>
          </Box>

          <Scrollbar sx={{ flexGrow: 1, p: 2.5 }}>
            <Stack spacing={3}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Field.Text name="code" label={t('positions.form.fields.code.label')} />
                <Field.Text name="name" label={t('positions.form.fields.name.label')} />
              </Box>

              <Field.Select
                name="jobTypeId"
                label={t('positions.form.fields.jobType.label')}
              >
                <MenuItem value={0} disabled>
                  {t('positions.form.fields.jobType.placeholder')}
                </MenuItem>
                {jobTypeOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Field.Select>

              <Field.Select
                name="superiorJobId"
                label={t('positions.form.fields.superiorJob.label')}
              >
                <MenuItem value={0}>{t('positions.form.common.none')}</MenuItem>
                {superiorJobOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Field.Select>

              <Divider sx={{ borderStyle: 'dashed', my: 2 }} />
              
              <Typography variant="subtitle2">{t('positions.form.sections.details')}</Typography>

              <Field.Text name="objectives" label={t('positions.form.fields.objectives.label')} multiline minRows={3} />
              <Field.Text name="expectedResults" label={t('positions.form.fields.expectedResults.label')} multiline minRows={3} />
              <Field.Text name="requirements" label={t('positions.form.fields.requirements.label')} multiline minRows={3} />
              <Field.Text name="otherFunctions" label={t('positions.form.fields.otherFunctions.label')} multiline minRows={3} />

              <Divider sx={{ borderStyle: 'dashed', my: 2 }} />
              
              <Typography variant="subtitle2">{t('positions.form.sections.requirements')}</Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Field.Text name="minimumAcademicLevel" label={t('positions.form.fields.minimumAcademicLevel.label')} />
                <Field.Text name="desiredAcademicLevel" label={t('positions.form.fields.desiredAcademicLevel.label')} />
                <Field.Text name="minimumExperience" label={t('positions.form.fields.minimumExperience.label')} />
                <Field.Text name="desiredExperience" label={t('positions.form.fields.desiredExperience.label')} />
              </Box>
              
              <Field.Text name="academicProfile" label={t('positions.form.fields.academicProfile.label')} multiline minRows={2} />
              <Field.Text name="psychologicalProfile" label={t('positions.form.fields.psychologicalProfile.label')} multiline minRows={2} />

              <Divider sx={{ borderStyle: 'dashed', my: 2 }} />

              <Typography variant="subtitle2">{t('positions.form.sections.relationships')}</Typography>

              <Field.Text name="internalRelationship" label={t('positions.form.fields.internalRelationship.label')} multiline minRows={2} />
              <Field.Text name="externalRelationship" label={t('positions.form.fields.externalRelationship.label')} multiline minRows={2} />
              <Field.Text name="competencies" label={t('positions.form.fields.competencies.label')} multiline minRows={2} />
              
              <Field.Text name="supervises" label={t('positions.form.fields.supervises.label')} />
              
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Field.Text name="regionalLocation" label={t('positions.form.fields.regionalLocation.label')} />
                <Field.Text name="headquarters" label={t('positions.form.fields.headquarters.label')} />
                <Field.Text name="numberOfPositions" label={t('positions.form.fields.numberOfPositions.label')} type="number" />
                <Field.Text name="numberOfHoursPerPosition" label={t('positions.form.fields.numberOfHoursPerPosition.label')} type="number" />
              </Box>

            </Stack>
          </Scrollbar>

          <Box sx={{ p: 2.5, display: 'flex', gap: 2, borderTop: (theme) => `solid 1px ${theme.vars.palette.divider}` }}>
            <Button fullWidth variant="soft" onClick={onClose}>
              {t('positions.form.actions.cancel')}
            </Button>
            <Button fullWidth variant="contained" type="submit" loading={isSubmitting}>
              {isEdit ? t('positions.form.actions.saveChanges') : t('positions.form.actions.create')}
            </Button>
          </Box>
        </Stack>
      </Form>
    </Drawer>
  );
}
