import type { IProject, ICatalogOption } from 'src/types/project-management';

import { z } from 'zod';
import dayjs from 'dayjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Autocomplete from '@mui/material/Autocomplete';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useTranslate } from 'src/locales';
import { GetClientsPaginationService } from 'src/services/project-management/client.service';
import { SaveOrUpdateProjectService } from 'src/services/project-management/project.service';
import {
  GetProjectSizesService,
  GetProjectStatusesService,
  GetProjectComplexitiesService,
  GetProjectReintegroLevelsService,
  GetProjectImportanceLevelsService,
} from 'src/services/project-management/filters.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const ProjectSchema = z
  .object({
    name: z.string().min(1, 'El nombre es requerido'),
    clientId: z.string().min(1, 'El cliente es requerido'),
    statusId: z.string().min(1, 'El estado es requerido'),
    importanceLevelId: z.string().min(1, 'El nivel de importancia es requerido'),
    sizeId: z.string().min(1, 'El tamaño es requerido'),
    complexityId: z.string().min(1, 'La complejidad es requerida'),
    reintegroLevelId: z.string().min(1, 'El nivel de reintegro es requerido'),
    generatesIncome: z.boolean(),
    startDate: z.string().min(1, 'La fecha de inicio es requerida'),
    endDate: z.string().min(1, 'La fecha de fin es requerida'),
    observations: z.string().nullable().optional(),
  })
  .refine((data) => !data.startDate || !data.endDate || data.endDate > data.startDate, {
    message: 'La fecha de fin debe ser posterior a la fecha de inicio',
    path: ['endDate'],
  });

type ProjectFormData = z.infer<typeof ProjectSchema>;

type Props = {
  open: boolean;
  currentRow: IProject | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function ProjectsCreateEditDrawer({ open, currentRow, onClose, onSuccess }: Props) {
  const { t } = useTranslate('project-management');
  const isEdit = !!currentRow;

  const [clientOptions, setClientOptions] = useState<ICatalogOption[]>([]);
  const [statusOptions, setStatusOptions] = useState<ICatalogOption[]>([]);
  const [importanceOptions, setImportanceOptions] = useState<ICatalogOption[]>([]);
  const [sizeOptions, setSizeOptions] = useState<ICatalogOption[]>([]);
  const [complexityOptions, setComplexityOptions] = useState<ICatalogOption[]>([]);
  const [reintegroOptions, setReintegroOptions] = useState<ICatalogOption[]>([]);

  const clientSearchTimer = useRef<ReturnType<typeof setTimeout>>();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(ProjectSchema),
    defaultValues: {
      name: '',
      clientId: '',
      statusId: '',
      importanceLevelId: '',
      sizeId: '',
      complexityId: '',
      reintegroLevelId: '',
      generatesIncome: false,
      startDate: '',
      endDate: '',
      observations: '',
    },
  });

  const loadCatalogs = useCallback(async () => {
    const [statuses, importance, sizes, complexities, reintegro] = await Promise.all([
      GetProjectStatusesService(),
      GetProjectImportanceLevelsService(),
      GetProjectSizesService(),
      GetProjectComplexitiesService(),
      GetProjectReintegroLevelsService(),
    ]);
    setStatusOptions(statuses.data ?? []);
    setImportanceOptions(importance.data ?? []);
    setSizeOptions(sizes.data ?? []);
    setComplexityOptions(complexities.data ?? []);
    setReintegroOptions(reintegro.data ?? []);
  }, []);

  const loadClients = useCallback(async (search?: string) => {
    const response = await GetClientsPaginationService({ page: 1, perPage: 15, search });
    setClientOptions(response.data?.data ?? response.data ?? []);
  }, []);

  useEffect(() => {
    if (open) {
      loadCatalogs();
      loadClients();
      reset(
        currentRow
          ? {
              name: currentRow.name,
              clientId: currentRow.clientId,
              statusId: currentRow.statusId,
              importanceLevelId: currentRow.importanceLevelId,
              sizeId: currentRow.sizeId,
              complexityId: currentRow.complexityId,
              reintegroLevelId: currentRow.reintegroLevelId,
              generatesIncome: currentRow.generatesIncome,
              startDate: currentRow.startDate,
              endDate: currentRow.endDate,
              observations: currentRow.observations ?? '',
            }
          : {
              name: '',
              clientId: '',
              statusId: '',
              importanceLevelId: '',
              sizeId: '',
              complexityId: '',
              reintegroLevelId: '',
              generatesIncome: false,
              startDate: '',
              endDate: '',
              observations: '',
            }
      );
    }
  }, [open, currentRow, reset, loadCatalogs, loadClients]);

  const watchedStartDate = watch('startDate');

  const minEndDate = watchedStartDate
    ? dayjs(watchedStartDate).add(1, 'day').format('YYYY-MM-DD')
    : undefined;

  const onSubmit = async (data: ProjectFormData) => {
    try {
      await SaveOrUpdateProjectService(
        {
          name: data.name,
          clientId: Number(data.clientId),
          statusId: Number(data.statusId),
          importanceLevelId: Number(data.importanceLevelId),
          sizeId: Number(data.sizeId),
          complexityId: Number(data.complexityId),
          reintegroLevelId: Number(data.reintegroLevelId),
          generatesIncome: data.generatesIncome,
          startDate: data.startDate,
          endDate: data.endDate,
          observations: data.observations || null,
        },
        currentRow?.id
      );
      toast.success(isEdit ? t('projects.messages.updated') : t('projects.messages.created'));
      onSuccess();
      onClose();
    } catch {
      toast.error(isEdit ? t('projects.messages.errorUpdate') : t('projects.messages.errorCreate'));
    }
  };

  const renderAutocomplete = (
    name: keyof ProjectFormData,
    label: string,
    options: ICatalogOption[]
  ) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Autocomplete
          fullWidth
          options={options}
          getOptionLabel={(o) => o.name}
          getOptionKey={(o) => o.id}
          value={options.find((o) => o.id === field.value) ?? null}
          onChange={(_e, val) => field.onChange(val?.id ?? '')}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              error={!!errors[name]}
              helperText={errors[name]?.message as string}
            />
          )}
        />
      )}
    />
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: 1, sm: 520 }, display: 'flex', flexDirection: 'column' } }}
    >
      <Box
        sx={{
          px: 3,
          py: 2,
          position: 'relative',
          borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}`,
        }}
      >
        <Typography variant="h6">
          {isEdit ? t('projects.drawer.titleEdit') : t('projects.drawer.titleCreate')}
        </Typography>
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
          name="name"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label={t('projects.drawer.fields.name')}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          )}
        />

        <Controller
          name="clientId"
          control={control}
          render={({ field }) => (
            <Autocomplete
              options={clientOptions}
              getOptionLabel={(o) => o.name}
              getOptionKey={(o) => o.id}
              value={clientOptions.find((o) => o.id === field.value) ?? null}
              onChange={(_e, val) => field.onChange(val?.id ?? '')}
              onInputChange={(_e, value) => {
                clearTimeout(clientSearchTimer.current);
                clientSearchTimer.current = setTimeout(() => loadClients(value || undefined), 300);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('projects.drawer.fields.client')}
                  error={!!errors.clientId}
                  helperText={errors.clientId?.message}
                />
              )}
            />
          )}
        />

        <Stack direction="row" spacing={2}>
          <Box sx={{ flex: 1, minWidth: 0 }}>{renderAutocomplete('statusId', t('projects.drawer.fields.status'), statusOptions)}</Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>{renderAutocomplete('importanceLevelId', t('projects.drawer.fields.importanceLevel'), importanceOptions)}</Box>
        </Stack>

        <Stack direction="row" spacing={2}>
          <Box sx={{ flex: 1, minWidth: 0 }}>{renderAutocomplete('sizeId', t('projects.drawer.fields.size'), sizeOptions)}</Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>{renderAutocomplete('complexityId', t('projects.drawer.fields.complexity'), complexityOptions)}</Box>
        </Stack>

        {renderAutocomplete('reintegroLevelId', t('projects.drawer.fields.reintegroLevel'), reintegroOptions)}

        <Stack direction="row" spacing={2}>
          <Controller
            name="startDate"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                type="date"
                label={t('projects.drawer.fields.startDate')}
                InputLabelProps={{ shrink: true }}
                error={!!errors.startDate}
                helperText={errors.startDate?.message}
              />
            )}
          />
          <Controller
            name="endDate"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                type="date"
                label={t('projects.drawer.fields.endDate')}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: minEndDate }}
                error={!!errors.endDate}
                helperText={errors.endDate?.message}
              />
            )}
          />
        </Stack>

        <Controller
          name="generatesIncome"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Switch
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              }
              label={t('projects.drawer.fields.generatesIncome')}
            />
          )}
        />

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
              label={t('projects.drawer.fields.observations')}
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
          {t('projects.actions.cancel')}
        </Button>
        <Button
          type="submit"
          variant="contained"
          loading={isSubmitting}
          onClick={handleSubmit(onSubmit)}
        >
          {isEdit ? t('projects.actions.save') : t('projects.actions.create')}
        </Button>
      </Box>
    </Drawer>
  );
}
