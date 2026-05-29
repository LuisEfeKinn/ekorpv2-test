import type { IWorker, ICatalogOption } from 'src/types/project-management';

import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Autocomplete from '@mui/material/Autocomplete';

import { useTranslate } from 'src/locales';
import { UpdateWorkerService } from 'src/services/project-management/worker.service';
import {
  GetWorkerStatusesService,
  GetExperienceLevelsService,
  GetEmploymentTypesForFilterService,
} from 'src/services/project-management/filters.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const WorkerEditSchema = z.object({
  workerStatusId: z.string().nullable().optional(),
  experienceLevelId: z.string().nullable().optional(),
  employmentTypeId: z.string().nullable().optional(),
  technologies: z.string().nullable().optional(),
  observations: z.string().nullable().optional(),
  yearsOfExperience: z.coerce.number().min(0).optional(),
  yearsInCompany: z.coerce.number().min(0).optional(),
});

type WorkerEditFormData = z.infer<typeof WorkerEditSchema>;

type Props = {
  open: boolean;
  currentRow: IWorker | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function WorkersEditDrawer({ open, currentRow, onClose, onSuccess }: Props) {
  const { t } = useTranslate('project-management');

  const [workerStatusOptions, setWorkerStatusOptions] = useState<ICatalogOption[]>([]);
  const [experienceLevelOptions, setExperienceLevelOptions] = useState<ICatalogOption[]>([]);
  const [employmentTypeOptions, setEmploymentTypeOptions] = useState<ICatalogOption[]>([]);

  const empTypeSearchTimer = useRef<ReturnType<typeof setTimeout>>();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<WorkerEditFormData>({
    resolver: zodResolver(WorkerEditSchema),
    defaultValues: {
      workerStatusId: null,
      experienceLevelId: null,
      employmentTypeId: null,
      technologies: '',
      observations: '',
      yearsOfExperience: 0,
      yearsInCompany: 0,
    },
  });

  const loadCatalogs = useCallback(async () => {
    const [statuses, levels, types] = await Promise.all([
      GetWorkerStatusesService(),
      GetExperienceLevelsService(),
      GetEmploymentTypesForFilterService({ page: 1, perPage: 15 }),
    ]);
    setWorkerStatusOptions(statuses.data ?? []);
    setExperienceLevelOptions(levels.data ?? []);
    setEmploymentTypeOptions(types.data?.data ?? types.data ?? []);
  }, []);

  const loadEmploymentTypes = useCallback(async (search?: string) => {
    const response = await GetEmploymentTypesForFilterService({ page: 1, perPage: 15, search });
    setEmploymentTypeOptions(response.data?.data ?? response.data ?? []);
  }, []);

  useEffect(() => {
    if (open) {
      loadCatalogs();
      reset({
        workerStatusId: currentRow?.workerStatusId ?? null,
        experienceLevelId: currentRow?.experienceLevelId ?? null,
        employmentTypeId: currentRow?.employmentTypeId ?? null,
        technologies: currentRow?.technologies ?? '',
        observations: '',
        yearsOfExperience: 0,
        yearsInCompany: 0,
      });
    }
  }, [open, currentRow, reset, loadCatalogs]);

  const onSubmit = async (data: WorkerEditFormData) => {
    if (!currentRow) return;
    try {
      await UpdateWorkerService(currentRow.id, {
        workerStatusId: data.workerStatusId ? Number(data.workerStatusId) : null,
        experienceLevelId: data.experienceLevelId ? Number(data.experienceLevelId) : null,
        employmentTypeId: data.employmentTypeId ? Number(data.employmentTypeId) : null,
        technologies: data.technologies || null,
        observations: data.observations || null,
        yearsOfExperience: data.yearsOfExperience ?? null,
        yearsInCompany: data.yearsInCompany ?? null,
      });
      toast.success(t('workers.messages.updated'));
      onSuccess();
      onClose();
    } catch {
      toast.error(t('workers.messages.errorUpdate'));
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: 1, sm: 480 }, display: 'flex', flexDirection: 'column' } }}
    >
      <Box
        sx={{
          px: 3,
          py: 2,
          position: 'relative',
          borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}`,
        }}
      >
        <Typography variant="h6">{t('workers.drawer.title')}</Typography>
        {currentRow && (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {currentRow.fullName}
          </Typography>
        )}
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12 }}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </Box>

      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{ px: 3, py: 2.5, overflow: 'auto', flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: 2.5 }}
      >
        <Controller
          name="workerStatusId"
          control={control}
          render={({ field }) => (
            <Autocomplete
              options={workerStatusOptions}
              getOptionLabel={(o) => o.name}
              getOptionKey={(o) => o.id}
              value={workerStatusOptions.find((o) => o.id === field.value) ?? null}
              onChange={(_e, val) => field.onChange(val?.id ?? null)}
              renderInput={(params) => (
                <TextField {...params} label={t('workers.drawer.fields.workerStatus')} />
              )}
            />
          )}
        />

        <Controller
          name="experienceLevelId"
          control={control}
          render={({ field }) => (
            <Autocomplete
              options={experienceLevelOptions}
              getOptionLabel={(o) => o.name}
              getOptionKey={(o) => o.id}
              value={experienceLevelOptions.find((o) => o.id === field.value) ?? null}
              onChange={(_e, val) => field.onChange(val?.id ?? null)}
              renderInput={(params) => (
                <TextField {...params} label={t('workers.drawer.fields.experienceLevel')} />
              )}
            />
          )}
        />

        <Controller
          name="employmentTypeId"
          control={control}
          render={({ field }) => (
            <Autocomplete
              options={employmentTypeOptions}
              getOptionLabel={(o) => o.name}
              getOptionKey={(o) => o.id}
              value={employmentTypeOptions.find((o) => o.id === field.value) ?? null}
              onChange={(_e, val) => field.onChange(val?.id ?? null)}
              onInputChange={(_e, value) => {
                clearTimeout(empTypeSearchTimer.current);
                empTypeSearchTimer.current = setTimeout(() => loadEmploymentTypes(value || undefined), 300);
              }}
              renderInput={(params) => (
                <TextField {...params} label={t('workers.drawer.fields.employmentType')} />
              )}
            />
          )}
        />

        <Controller
          name="technologies"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              value={field.value ?? ''}
              fullWidth
              label={t('workers.drawer.fields.technologies')}
              placeholder="NestJS, TypeScript, MySQL..."
              helperText={t('workers.drawer.fields.technologiesHint')}
            />
          )}
        />

        <Stack direction="row" spacing={2}>
          <Controller
            name="yearsOfExperience"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                type="number"
                label={t('workers.drawer.fields.yearsOfExperience')}
                inputProps={{ min: 0 }}
              />
            )}
          />

          <Controller
            name="yearsInCompany"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                type="number"
                label={t('workers.drawer.fields.yearsInCompany')}
                inputProps={{ min: 0 }}
              />
            )}
          />
        </Stack>

        <Controller
          name="observations"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              value={field.value ?? ''}
              fullWidth
              multiline
              rows={3}
              label={t('workers.drawer.fields.observations')}
            />
          )}
        />
      </Box>

      <Box
        sx={{
          px: 3,
          py: 2,
          borderTop: (theme) => `1px solid ${theme.vars.palette.divider}`,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1.25,
        }}
      >
        <Button onClick={onClose} color="inherit" variant="outlined">
          {t('workers.actions.cancel')}
        </Button>
        <Button
          type="submit"
          variant="contained"
          loading={isSubmitting}
          onClick={handleSubmit(onSubmit)}
        >
          {t('workers.actions.save')}
        </Button>
      </Box>
    </Drawer>
  );
}
