'use client';

import type { IBoard, IWorker, IAssignment, IJobPosition, ICatalogOption } from 'src/types/project-management';

import { z } from 'zod';
import dayjs from 'dayjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Autocomplete from '@mui/material/Autocomplete';

import { useTranslate } from 'src/locales';
import { GetBoardsService } from 'src/services/project-management/board.service';
import { GetJobsKmService } from 'src/services/project-management/jobs-km.service';
import { GetWorkersPaginationService } from 'src/services/project-management/worker.service';
import {
  GetAssignmentStatusesService,
  GetAssignmentPrioritiesService,
} from 'src/services/project-management/filters.service';
import { CreateAssignmentService, UpdateAssignmentService, GetAssignmentByIdService } from 'src/services/project-management/assignment.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const AssignmentSchema = z
  .object({
    employeeId: z.string().min(1),
    jobPositionIds: z.array(z.string()).min(1),
    priorityId: z.string().min(1),
    statusId: z.string().min(1),
    boardIds: z.array(z.string()).optional(),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    observations: z.string().nullable().optional(),
  })
  .refine((d) => !d.startDate || !d.endDate || d.endDate > d.startDate, {
    message: '',
    path: ['endDate'],
  });

type AssignmentFormData = z.infer<typeof AssignmentSchema>;

type Props = {
  open: boolean;
  projectId: string;
  currentRow: IAssignment | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function AssignmentCreateEditDrawer({ open, projectId, currentRow, onClose, onSuccess }: Props) {
  const { t } = useTranslate('project-management');
  const isEdit = !!currentRow;

  const [workerOptions, setWorkerOptions] = useState<IWorker[]>([]);
  const [jobOptions, setJobOptions] = useState<IJobPosition[]>([]);
  const [priorityOptions, setPriorityOptions] = useState<ICatalogOption[]>([]);
  const [statusOptions, setStatusOptions] = useState<ICatalogOption[]>([]);
  const [boardOptions, setBoardOptions] = useState<IBoard[]>([]);

  const [pinnedWorker, setPinnedWorker] = useState<IWorker | null>(null);
  const [pinnedJobs, setPinnedJobs] = useState<IJobPosition[]>([]);
  const [selectedBoards, setSelectedBoards] = useState<IBoard[]>([]);

  const workerSearchTimer = useRef<ReturnType<typeof setTimeout>>();
  const jobSearchTimer = useRef<ReturnType<typeof setTimeout>>();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(AssignmentSchema),
    defaultValues: {
      employeeId: '',
      jobPositionIds: [],
      priorityId: '',
      statusId: '',
      boardIds: [],
      startDate: '',
      endDate: '',
      observations: '',
    },
  });

  const loadCatalogs = useCallback(async () => {
    const [priorities, statuses, boards] = await Promise.all([
      GetAssignmentPrioritiesService(),
      GetAssignmentStatusesService(),
      GetBoardsService(Number(projectId)),
    ]);
    setPriorityOptions(priorities.data ?? []);
    setStatusOptions(statuses.data ?? []);
    setBoardOptions(boards.data?.data ?? boards.data ?? []);
  }, [projectId]);

  const loadWorkers = useCallback(async (search?: string) => {
    const response = await GetWorkersPaginationService({ page: 1, perPage: 30, search });
    setWorkerOptions(response.data?.data ?? []);
  }, []);

  const loadJobs = useCallback(async (search?: string) => {
    const response = await GetJobsKmService({ page: 1, perPage: 30, search });
    setJobOptions(response.data?.data ?? []);
  }, []);

  useEffect(() => {
    if (!open) return;

    loadCatalogs();
    loadWorkers();
    loadJobs();

    if (currentRow) {
      const loadEdit = async () => {
        const detail = await GetAssignmentByIdService(currentRow.id).then((r) => r.data).catch(() => null);
        if (!detail) return;

        const boardIds: string[] = (detail.boards ?? []).map((b: any) => String(b.id));
        const preselectedBoards: IBoard[] = (detail.boards ?? []).map((b: any) => ({
          id: String(b.id),
          name: b.name,
          projectId: detail.project?.id ?? '',
          createdAt: b.createdAt ?? '',
          updatedAt: b.updatedAt ?? '',
        }));
        const jobs: IJobPosition[] = (detail.jobPositions ?? []).map((j: any) => ({
          id: Number(j.id),
          name: j.name,
          code: j.code ?? '',
        }));

        setPinnedWorker({ id: String(detail.employee?.id), fullName: detail.employee?.fullName } as IWorker);
        setPinnedJobs(jobs);
        setSelectedBoards(preselectedBoards);
        reset({
          employeeId: String(detail.employee?.id ?? ''),
          jobPositionIds: jobs.map((j) => String(j.id)),
          priorityId: String(detail.priority?.id ?? ''),
          statusId: String(detail.status?.id ?? ''),
          boardIds,
          startDate: detail.startDate ?? '',
          endDate: detail.endDate ?? '',
          observations: detail.observations ?? '',
        });
      };
      loadEdit();
    } else {
        setPinnedWorker(null);
        setPinnedJobs([]);
        setSelectedBoards([]);
        reset({
          employeeId: '',
          jobPositionIds: [],
          priorityId: '',
          statusId: '',
          boardIds: [],
          startDate: '',
          endDate: '',
          observations: '',
        });
    }
  }, [open, currentRow, reset, loadCatalogs, loadWorkers, loadJobs]);

  const watchedStartDate = watch('startDate');
  const todayStr = dayjs().format('YYYY-MM-DD');
  const minEndDate = watchedStartDate
    ? dayjs(watchedStartDate).add(1, 'day').format('YYYY-MM-DD')
    : undefined;

  const handleWorkerSelect = (worker: IWorker | null) => {
    setPinnedWorker(worker);
    setValue('employeeId', worker?.id ?? '');
    if (worker?.positionId && !isEdit) {
      const preloadedJob = jobOptions.find((j) => String(j.id) === worker.positionId)
        ?? (worker.positionName ? { id: Number(worker.positionId), name: worker.positionName, code: '' } : null);
      if (preloadedJob) {
        setPinnedJobs([preloadedJob]);
        setJobOptions((prev) => {
          const exists = prev.some((j) => String(j.id) === worker.positionId);
          return exists ? prev : [preloadedJob, ...prev];
        });
        setValue('jobPositionIds', [worker.positionId]);
      }
    } else if (!worker) {
      setPinnedJobs([]);
      setValue('jobPositionIds', []);
    }
  };

  const onSubmit = async (data: AssignmentFormData) => {
    try {
      const payload = {
        projectId: Number(projectId),
        employeeId: Number(data.employeeId),
        jobPositionIds: data.jobPositionIds.map(Number),
        priorityId: Number(data.priorityId),
        statusId: Number(data.statusId),
        boardIds: data.boardIds?.map(Number) ?? [],
        startDate: data.startDate,
        endDate: data.endDate,
        observations: data.observations || null,
      };

      if (isEdit && currentRow) {
        await UpdateAssignmentService(currentRow.id, payload);
        toast.success(t('detail.team.messages.updated'));
      } else {
        await CreateAssignmentService(payload);
        toast.success(t('detail.team.messages.assigned'));
      }

      onSuccess();
      onClose();
    } catch {
      toast.error(isEdit ? t('detail.team.messages.errorUpdate') : t('detail.team.messages.errorAssign'));
    }
  };

  const mergedWorkerOptions = pinnedWorker
    ? [pinnedWorker, ...workerOptions.filter((w) => w.id !== pinnedWorker.id)]
    : workerOptions;

  const mergedJobOptions = [
    ...pinnedJobs,
    ...jobOptions.filter((j) => !pinnedJobs.some((p) => p.id === j.id)),
  ];

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
          {isEdit ? t('detail.team.drawer.titleEdit') : t('detail.team.drawer.titleCreate')}
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
        {/* Employee */}
        <Autocomplete
          options={mergedWorkerOptions}
          getOptionLabel={(o) => o.fullName}
          getOptionKey={(o) => o.id}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          value={pinnedWorker}
          onChange={(_e, val) => handleWorkerSelect(val)}
          onOpen={() => loadWorkers()}
          onInputChange={(_e, value, reason) => {
            if (reason !== 'input') return;
            clearTimeout(workerSearchTimer.current);
            workerSearchTimer.current = setTimeout(() => loadWorkers(value || undefined), 300);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('detail.team.drawer.fields.employee')}
              error={!!errors.employeeId}
              helperText={errors.employeeId ? t('detail.team.drawer.validation.employeeRequired') : undefined}
            />
          )}
        />

        {/* Job positions (multi) */}
        <Autocomplete
          multiple
          options={mergedJobOptions}
          getOptionLabel={(o) => o.name}
          getOptionKey={(o) => o.id}
          isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
          value={pinnedJobs}
          onChange={(_e, vals) => { setPinnedJobs(vals); setValue('jobPositionIds', vals.map((v) => String(v.id))); }}
          onOpen={() => loadJobs()}
          onInputChange={(_e, value, reason) => {
            if (reason !== 'input') return;
            clearTimeout(jobSearchTimer.current);
            jobSearchTimer.current = setTimeout(() => loadJobs(value || undefined), 300);
          }}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                key={option.id}
                label={option.name}
                size="small"
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('detail.team.drawer.fields.jobPositions')}
              error={!!errors.jobPositionIds}
              helperText={errors.jobPositionIds ? t('detail.team.drawer.validation.jobPositionsRequired') : undefined}
            />
          )}
        />

        {/* Priority + Status */}
        <Stack direction="row" spacing={2}>
          <Controller
            name="priorityId"
            control={control}
            render={({ field }) => (
              <Autocomplete
                fullWidth
                options={priorityOptions}
                getOptionLabel={(o) => o.name}
                getOptionKey={(o) => o.id}
                value={priorityOptions.find((o) => o.id === field.value) ?? null}
                onChange={(_e, val) => field.onChange(val?.id ?? '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('detail.team.drawer.fields.priority')}
                    error={!!errors.priorityId}
                    helperText={errors.priorityId ? t('detail.team.drawer.validation.priorityRequired') : undefined}
                  />
                )}
              />
            )}
          />
          <Controller
            name="statusId"
            control={control}
            render={({ field }) => (
              <Autocomplete
                fullWidth
                options={statusOptions}
                getOptionLabel={(o) => o.name}
                getOptionKey={(o) => o.id}
                value={statusOptions.find((o) => o.id === field.value) ?? null}
                onChange={(_e, val) => field.onChange(val?.id ?? '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('detail.team.drawer.fields.status')}
                    error={!!errors.statusId}
                    helperText={errors.statusId ? t('detail.team.drawer.validation.statusRequired') : undefined}
                  />
                )}
              />
            )}
          />
        </Stack>

        {/* Boards */}
        <Autocomplete
          multiple
          options={boardOptions}
          getOptionLabel={(o) => o.name}
          getOptionKey={(o) => o.id}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          value={selectedBoards}
          onChange={(_e, vals) => {
            setSelectedBoards(vals);
            setValue('boardIds', vals.map((v) => v.id));
          }}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip {...getTagProps({ index })} key={option.id} label={option.name} size="small" />
            ))
          }
          renderInput={(params) => (
            <TextField {...params} label={t('detail.team.drawer.fields.boards')} />
          )}
        />

        {/* Dates */}
        <Stack direction="row" spacing={2}>
          <Controller
            name="startDate"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                type="date"
                label={t('detail.team.drawer.fields.startDate')}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: todayStr }}
                error={!!errors.startDate}
                helperText={errors.startDate ? t('detail.team.drawer.validation.startDateRequired') : undefined}
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
                label={t('detail.team.drawer.fields.endDate')}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: minEndDate }}
                error={!!errors.endDate}
                helperText={errors.endDate ? t('detail.team.drawer.validation.endDateMin') : undefined}
              />
            )}
          />
        </Stack>

        {/* Observations */}
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
              label={t('detail.team.drawer.fields.observations')}
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
        <Button type="submit" variant="contained" loading={isSubmitting} onClick={handleSubmit(onSubmit)}>
          {isEdit ? t('projects.actions.save') : t('detail.team.assign')}
        </Button>
      </Box>
    </Drawer>
  );
}
