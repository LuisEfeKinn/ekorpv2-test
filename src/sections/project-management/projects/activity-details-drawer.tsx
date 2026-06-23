'use client';

import type { IKanbanTask } from 'src/types/kanban';
import type { IAssignment, IActivityStatusOption } from 'src/types/project-management';

import { z } from 'zod';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { varAlpha } from 'minimal-shared/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { useBoolean, usePopover } from 'minimal-shared/hooks';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Drawer from '@mui/material/Drawer';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import ListItemText from '@mui/material/ListItemText';
import DialogContent from '@mui/material/DialogContent';
import LinearProgress from '@mui/material/LinearProgress';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { fDateRangeShortLabel } from 'src/utils/format-time';
import { stringToAvatarColor } from 'src/utils/avatar-color';

import { useTranslate } from 'src/locales';
import { GetActivityStatusesService } from 'src/services/project-management/filters.service';
import { GetAssignmentsPaginationService } from 'src/services/project-management/assignment.service';
import {
  UpdateActivityService,
  DeleteActivityService,
  CreateActivityService,
  GetActivityByIdService,
  GetActivitiesListService,
} from 'src/services/project-management/activity.service';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';
import { CustomDateRangePicker } from 'src/components/custom-date-range-picker';
import { KanbanInputName } from 'src/components/kanban/components/kanban-input-name';

// ----------------------------------------------------------------------

const ACTIVITY_NAME_MAX = 150;
const ACTIVITY_DESCRIPTION_MAX = 2000;

const ActivitySchema = z
  .object({
    name: z.string().min(1).max(ACTIVITY_NAME_MAX),
    statusId: z.string().min(1),
    assigneeId: z.string().nullable().optional(),
    supervisorIds: z.array(z.string()).optional(),
    description: z.string().max(ACTIVITY_DESCRIPTION_MAX).nullable().optional(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
  })
  .refine((d) => !d.startDate || !d.endDate || d.endDate >= d.startDate, {
    message: '',
    path: ['endDate'],
  });

type ActivityFormData = z.infer<typeof ActivitySchema>;

// ----------------------------------------------------------------------

const BlockLabel = styled('span')(({ theme }) => ({
  ...theme.typography.caption,
  width: 110,
  flexShrink: 0,
  color: theme.vars.palette.text.secondary,
  fontWeight: theme.typography.fontWeightSemiBold,
}));

function getInitials(name: string) {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

// ----------------------------------------------------------------------

type MemberOption = { id: string; label: string };

type MemberDialogProps = {
  open: boolean;
  onClose: () => void;
  projectId: string;
  excludeIds?: string[];
  pinnedMembers: MemberOption[];
  multiple?: boolean;
  selected: string[];
  onConfirm: (ids: string[], members: MemberOption[]) => void;
  title: string;
  t: (key: string) => string;
};

function MemberSelectionDialog({
  open,
  onClose,
  projectId,
  excludeIds = [],
  pinnedMembers,
  t,
  multiple = false,
  selected,
  onConfirm,
  title,
}: MemberDialogProps) {
  const [search, setSearch] = useState('');
  const [localSelected, setLocalSelected] = useState<string[]>(selected);
  const [apiResults, setApiResults] = useState<MemberOption[]>([]);
  const [loading, setLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  const fetchMembers = useCallback(
    async (query: string) => {
      setLoading(true);
      try {
        const res = await GetAssignmentsPaginationService({
          projectId: Number(projectId),
          page: 1,
          perPage: 20,
          search: query || undefined,
        });
        const data: IAssignment[] = res.data?.data ?? [];
        setApiResults(data.map((a) => ({ id: String(a.employeeId), label: a.employeeFullName })));
      } finally {
        setLoading(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    if (open) {
      setLocalSelected(selectedRef.current);
      setSearch('');
      fetchMembers('');
    }
  }, [open, fetchMembers]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchMembers(value), 300);
  };

  const allOptions: MemberOption[] = [
    ...pinnedMembers.filter((p) => !excludeIds.includes(p.id)),
    ...apiResults.filter(
      (r) => !pinnedMembers.some((p) => p.id === r.id) && !excludeIds.includes(r.id)
    ),
  ];

  const resolveMembers = (ids: string[]): MemberOption[] =>
    ids
      .map((id) => [...pinnedMembers, ...apiResults].find((o) => o.id === id))
      .filter((o): o is MemberOption => !!o);

  const toggle = (id: string) => {
    if (multiple) {
      setLocalSelected((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    } else {
      const newIds = localSelected[0] === id ? [] : [id];
      onConfirm(newIds, resolveMembers(newIds));
      onClose();
    }
  };

  return (
    <Dialog fullWidth maxWidth="xs" open={open} onClose={onClose}>
      <DialogTitle sx={{ pb: 0 }}>{title}</DialogTitle>

      <Box sx={{ px: 3, py: 1.5 }}>
        <TextField
          fullWidth
          size="small"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={t('detail.tasks.memberDialog.search')}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : allOptions.length === 0 ? (
          <Box sx={{ mt: 3, mb: 6, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: 'text.primary' }}>
              {t('detail.tasks.memberDialog.notFound')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
              {t('detail.tasks.memberDialog.notFoundHint')}
            </Typography>
          </Box>
        ) : (
          <Scrollbar sx={{ maxHeight: 320, px: 2.5 }}>
            <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
              {allOptions.map((opt) => {
                const checked = localSelected.includes(opt.id);
                return (
                  <Box
                    component="li"
                    key={opt.id}
                    sx={{ display: 'flex', alignItems: 'center', height: 56, gap: 2 }}
                  >
                    <Avatar sx={{ width: 36, height: 36, fontSize: 13, color: '#fff', bgcolor: stringToAvatarColor(opt.id) }}>
                      {getInitials(opt.label)}
                    </Avatar>
                    <ListItemText primary={opt.label} />
                    <Button
                      size="small"
                      color={checked ? 'primary' : 'inherit'}
                      startIcon={
                        <Iconify
                          width={16}
                          icon={checked ? 'eva:checkmark-fill' : 'mingcute:add-line'}
                          sx={{ mr: -0.5 }}
                        />
                      }
                      onClick={() => toggle(opt.id)}
                    >
                      {checked ? t('detail.tasks.memberDialog.assigned') : t('detail.tasks.memberDialog.assign')}
                    </Button>
                  </Box>
                );
              })}
            </Box>
          </Scrollbar>
        )}
      </DialogContent>

      {multiple && (
        <Box sx={{ px: 2.5, py: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button variant="outlined" color="inherit" size="small" onClick={onClose}>
            {t('detail.tasks.memberDialog.cancel')}
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => {
              onConfirm(localSelected, resolveMembers(localSelected));
              onClose();
            }}
          >
            {t('detail.tasks.memberDialog.confirm')}
          </Button>
        </Box>
      )}
    </Dialog>
  );
}

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  task: IKanbanTask | null;
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
  onDelete?: (taskId: string) => void;
  readOnly?: boolean;
};

export function ActivityDetailsDrawer({ open, task, projectId, onClose, onSuccess, onDelete, readOnly = false }: Props) {
  const { t } = useTranslate('project-management');

  const assigneeDialog = useBoolean();
  const supervisorsDialog = useBoolean();
  const confirmDelete = useBoolean();
  const datePickerOpen = useBoolean();
  const statusPopover = usePopover();

  const [statuses, setStatuses] = useState<IActivityStatusOption[]>([]);
  const [pinnedAssignee, setPinnedAssignee] = useState<MemberOption | null>(null);
  const [pinnedSupervisors, setPinnedSupervisors] = useState<MemberOption[]>([]);
  const [subtasks, setSubtasks] = useState<{ id: string; name: string; statusName: string }[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
  } = useForm<ActivityFormData>({
    resolver: zodResolver(ActivitySchema),
    defaultValues: {
      name: '',
      statusId: '',
      assigneeId: null,
      supervisorIds: [],
      description: null,
      startDate: null,
      endDate: null,
    },
  });

  const watchedStatusId = watch('statusId');
  const watchedAssigneeId = watch('assigneeId');
  const watchedSupervisorIds = watch('supervisorIds') ?? [];

  const statusLabels: Record<string, string> = useMemo(
    () => ({
      TODO: t('detail.tasks.statuses.TODO'),
      IN_PROGRESS: t('detail.tasks.statuses.IN_PROGRESS'),
      IN_TESTING: t('detail.tasks.statuses.IN_TESTING'),
      DONE: t('detail.tasks.statuses.DONE'),
    }),
    [t]
  );

  const getStatusLabel = useCallback(
    (status: IActivityStatusOption) => statusLabels[status.key] ?? status.name,
    [statusLabels]
  );

  const currentStatus = statuses.find((s) => String(s.id) === watchedStatusId);

  const startDayjs = watch('startDate') ? dayjs(watch('startDate')) : null;
  const endDayjs = watch('endDate') ? dayjs(watch('endDate')) : null;
  const datesSelected = !!startDayjs && !!endDayjs;
  const datesError = !!(startDayjs && endDayjs && !startDayjs.isBefore(endDayjs));

  const loadStatuses = useCallback(async () => {
    const res = await GetActivityStatusesService();
    setStatuses(res.data ?? []);
  }, []);

  const loadDetail = useCallback(async () => {
    if (!task) return;
    setLoadingDetail(true);
    try {
      const [detailRes, subtasksRes] = await Promise.all([
        GetActivityByIdService(task.id),
        GetActivitiesListService({ projectId: Number(projectId), onlyRoot: false }),
      ]);

      const detail = detailRes.data;
      const allActivities = subtasksRes.data?.data ?? [];
      const childTasks = allActivities.filter(
        (a: { parentId: number | null; id: number; name: string; statusName: string }) =>
          String(a.parentId) === task.id
      );
      setSubtasks(
        childTasks.map((a: { id: number; name: string; statusName: string }) => ({
          id: String(a.id),
          name: a.name,
          statusName: a.statusName,
        }))
      );

      const assignee = detail.assignee
        ? { id: String(detail.assignee.id), label: detail.assignee.fullName }
        : null;
      const supervisors: MemberOption[] =
        detail.supervisors?.map((s: { id: number; fullName: string }) => ({
          id: String(s.id),
          label: s.fullName,
        })) ?? [];

      setPinnedAssignee(assignee);
      setPinnedSupervisors(supervisors);

      reset({
        name: detail.name ?? '',
        statusId: String(detail.status?.id ?? ''),
        assigneeId: assignee?.id ?? null,
        supervisorIds: supervisors.map((s) => s.id),
        description: detail.description ?? null,
        startDate: detail.startDate ? dayjs(detail.startDate).format('YYYY-MM-DD') : null,
        endDate: detail.endDate ? dayjs(detail.endDate).format('YYYY-MM-DD') : null,
      });
    } finally {
      setLoadingDetail(false);
    }
  }, [task, projectId, reset]);

  useEffect(() => {
    if (open) {
      loadStatuses();
      if (task) {
        loadDetail();
      } else {
        setPinnedAssignee(null);
        setPinnedSupervisors([]);
        setSubtasks([]);
        reset({ name: '', statusId: '', assigneeId: null, supervisorIds: [], description: null, startDate: null, endDate: null });
      }
    }
  }, [open, task, loadStatuses, loadDetail, reset]);

  const onSubmit = async (data: ActivityFormData) => {
    setSubmitting(true);
    try {
      const payload = {
        name: data.name,
        statusId: Number(data.statusId),
        assigneeId: data.assigneeId ? Number(data.assigneeId) : undefined,
        supervisorIds: data.supervisorIds?.map(Number) ?? [],
        description: data.description || null,
        startDate: data.startDate ?? undefined,
        endDate: data.endDate ?? undefined,
      };

      if (task) {
        await UpdateActivityService(task.id, payload);
      } else {
        await CreateActivityService({ projectId: Number(projectId), ...payload });
      }

      toast.success(task ? t('detail.tasks.updated') : t('detail.tasks.created'));
      onSuccess();
      onClose();
    } catch {
      toast.error(t('detail.tasks.saveError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    try {
      await DeleteActivityService(task.id);
      toast.success(t('detail.tasks.deleted'));
      if (onDelete) onDelete(task.id);
      confirmDelete.onFalse();
      onClose();
      onSuccess();
    } catch {
      toast.error(t('detail.tasks.deleteError'));
    }
  };

  // -- Toolbar --

  const renderToolbar = () => (
    <>
      <Box
        sx={[
          (theme) => ({
            display: 'flex',
            alignItems: 'center',
            p: theme.spacing(2.5, 1, 2.5, 2.5),
            borderBottom: `solid 1px ${theme.vars.palette.divider}`,
          }),
        ]}
      >
        {readOnly ? (
          <Chip label={currentStatus ? getStatusLabel(currentStatus) : '…'} size="small" variant="soft" />
        ) : (
          <Button
            size="small"
            variant="soft"
            endIcon={<Iconify icon="eva:arrow-ios-downward-fill" width={16} sx={{ ml: -0.5 }} />}
            onClick={statusPopover.onOpen}
            disabled={statuses.length === 0}
          >
            {currentStatus ? getStatusLabel(currentStatus) : '…'}
          </Button>
        )}

        <Box sx={{ flexGrow: 1 }} />

        {task && !readOnly && (
          <Tooltip title={t('detail.tasks.delete')}>
            <IconButton onClick={confirmDelete.onTrue}>
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          </Tooltip>
        )}

        <Tooltip title={t('detail.tasks.close')}>
          <IconButton onClick={onClose}>
            <Iconify icon="mingcute:close-line" />
          </IconButton>
        </Tooltip>
      </Box>

      <CustomPopover
        open={statusPopover.open}
        anchorEl={statusPopover.anchorEl}
        onClose={statusPopover.onClose}
        slotProps={{ arrow: { placement: 'top-left' } }}
      >
        <MenuList>
          {statuses.map((s) => (
            <MenuItem
              key={s.id}
              selected={String(s.id) === watchedStatusId}
              onClick={() => {
                setValue('statusId', String(s.id));
                statusPopover.onClose();
              }}
            >
              {getStatusLabel(s)}
            </MenuItem>
          ))}
        </MenuList>
      </CustomPopover>
    </>
  );

  const renderContent = () => (
    <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
      {/* Título */}
      {readOnly ? (
        <Typography variant="h6" sx={{ px: 0.5 }}>{watch('name') || '—'}</Typography>
      ) : (
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <KanbanInputName
              {...field}
              onChange={(e) => field.onChange(e.target.value.replace(/[\r\n]/g, ''))}
              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
              placeholder={t('detail.tasks.namePlaceholder')}
              inputProps={{ maxLength: ACTIVITY_NAME_MAX, id: 'activity-name-input' }}
            />
          )}
        />
      )}

      {/* Asignado */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <BlockLabel sx={{ height: 40, lineHeight: '40px' }}>{t('detail.tasks.assignee')}</BlockLabel>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {pinnedAssignee ? (
            <Tooltip title={pinnedAssignee.label}>
              <Avatar
                sx={{ width: 36, height: 36, fontSize: 13, color: '#fff', cursor: readOnly ? 'default' : 'pointer', bgcolor: stringToAvatarColor(pinnedAssignee.id) }}
                onClick={readOnly ? undefined : assigneeDialog.onTrue}
              >
                {getInitials(pinnedAssignee.label)}
              </Avatar>
            </Tooltip>
          ) : readOnly ? (
            <Typography variant="body2" sx={{ color: 'text.disabled' }}>—</Typography>
          ) : (
            <Tooltip title={t('detail.tasks.addAssignee')}>
              <IconButton
                size="small"
                onClick={assigneeDialog.onTrue}
                sx={[
                  (theme) => ({
                    border: `dashed 1px ${theme.vars.palette.divider}`,
                    bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
                  }),
                ]}
              >
                <Iconify icon="mingcute:add-line" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Supervisores */}
      <Box sx={{ display: 'flex' }}>
        <BlockLabel sx={{ height: 40, lineHeight: '40px' }}>{t('detail.tasks.supervisors')}</BlockLabel>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          {pinnedSupervisors.map((s) => (
            <Tooltip key={s.id} title={s.label}>
              <Avatar
                sx={{ width: 36, height: 36, fontSize: 13, color: '#fff', cursor: readOnly ? 'default' : 'pointer', bgcolor: stringToAvatarColor(s.id) }}
                onClick={readOnly ? undefined : supervisorsDialog.onTrue}
              >
                {getInitials(s.label)}
              </Avatar>
            </Tooltip>
          ))}
          {!readOnly && (
            <Tooltip title={t('detail.tasks.addSupervisor')}>
              <IconButton
                size="small"
                onClick={supervisorsDialog.onTrue}
                sx={[
                  (theme) => ({
                    border: `dashed 1px ${theme.vars.palette.divider}`,
                    bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
                  }),
                ]}
              >
                <Iconify icon="mingcute:add-line" />
              </IconButton>
            </Tooltip>
          )}
          {readOnly && pinnedSupervisors.length === 0 && (
            <Typography variant="body2" sx={{ color: 'text.disabled' }}>—</Typography>
          )}
        </Box>
      </Box>

      {/* Fechas */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <BlockLabel sx={{ height: 40, lineHeight: '40px' }}>{t('detail.tasks.dates')}</BlockLabel>

        {readOnly ? (
          <Typography variant="body2" sx={{ color: datesSelected ? 'text.primary' : 'text.disabled' }}>
            {datesSelected ? fDateRangeShortLabel(startDayjs, endDayjs) : '—'}
          </Typography>
        ) : datesSelected ? (
          <Button size="small" onClick={datePickerOpen.onTrue}>
            {fDateRangeShortLabel(startDayjs, endDayjs)}
          </Button>
        ) : (
          <Tooltip title={t('detail.tasks.addDates')}>
            <IconButton
              size="small"
              onClick={datePickerOpen.onTrue}
              sx={[
                (theme) => ({
                  border: `dashed 1px ${theme.vars.palette.divider}`,
                  bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
                }),
              ]}
            >
              <Iconify icon="mingcute:add-line" />
            </IconButton>
          </Tooltip>
        )}

        <CustomDateRangePicker
          variant="calendar"
          title={t('detail.tasks.selectDates')}
          errorMessage={t('detail.tasks.datesError')}
          cancelLabel={t('detail.tasks.cancel')}
          applyLabel={t('detail.tasks.apply')}
          clearLabel={t('detail.tasks.clearDates')}
          minDate={dayjs()}
          startDate={startDayjs}
          endDate={endDayjs}
          onChangeStartDate={(v) => {
            setValue('startDate', v ? v.format('YYYY-MM-DD') : null);
            if (v && endDayjs && !v.isBefore(endDayjs)) {
              setValue('endDate', null);
            }
          }}
          onChangeEndDate={(v) => setValue('endDate', v ? v.format('YYYY-MM-DD') : null)}
          onClear={() => {
            setValue('startDate', null);
            setValue('endDate', null);
            datePickerOpen.onFalse();
          }}
          open={datePickerOpen.value}
          onClose={datePickerOpen.onFalse}
          selected={datesSelected}
          error={datesError}
        />
      </Box>

      {/* Descripción */}
      {readOnly ? (
        watch('description') ? (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {t('detail.tasks.description')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'pre-line' }}>
              {watch('description')}
            </Typography>
          </Box>
        ) : null
      ) : (
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              value={field.value ?? ''}
              fullWidth
              multiline
              minRows={5}
              maxRows={10}
              label={t('detail.tasks.description')}
              placeholder={t('detail.tasks.descriptionPlaceholder')}
              inputProps={{ maxLength: ACTIVITY_DESCRIPTION_MAX }}
            />
          )}
        />
      )}

      {/* Subtareas — inline, solo si existen */}
      {subtasks.length > 0 && (
        <Box sx={{ gap: 2, display: 'flex', flexDirection: 'column' }}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t('detail.tasks.tabSubtasks')} ({subtasks.length})
            </Typography>
            <LinearProgress variant="determinate" value={0} />
          </Box>
          <Stack spacing={1}>
            {subtasks.map((sub) => (
              <Box
                key={sub.id}
                sx={{
                  px: 1.5,
                  py: 1,
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  bgcolor: 'action.hover',
                }}
              >
                <Typography variant="body2">{sub.name}</Typography>
                <Chip label={sub.statusName} size="small" variant="soft" />
              </Box>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );

  // ----------------------------------------------------------------------

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        anchor="right"
        aria-hidden={!open}
        slotProps={{
          backdrop: { invisible: true },
          paper: { sx: { width: { xs: 1, sm: 480 }, display: 'flex', flexDirection: 'column' } },
        }}
      >
        {renderToolbar()}

        {loadingDetail ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Scrollbar fillContent sx={{ py: 3, px: 2.5 }}>
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              {renderContent()}
            </Box>
          </Scrollbar>
        )}

        <Box
          sx={[
            (theme) => ({
              px: 2.5,
              py: 2,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 1.5,
              borderTop: `solid 1px ${theme.vars.palette.divider}`,
            }),
          ]}
        >
          {readOnly ? (
            <Button variant="outlined" color="inherit" onClick={onClose}>
              {t('detail.tasks.close')}
            </Button>
          ) : (
            <>
              <Button variant="outlined" color="inherit" onClick={onClose}>
                {t('detail.tasks.cancel')}
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
                onClick={handleSubmit(onSubmit)}
              >
                {submitting ? <CircularProgress size={18} /> : t('detail.tasks.save')}
              </Button>
            </>
          )}
        </Box>
      </Drawer>

      {/* Asignado — selección única, excluye supervisores actuales */}
      <MemberSelectionDialog
        open={assigneeDialog.value}
        onClose={assigneeDialog.onFalse}
        projectId={projectId}
        excludeIds={watchedSupervisorIds}
        pinnedMembers={pinnedAssignee ? [pinnedAssignee] : []}
        selected={watchedAssigneeId ? [watchedAssigneeId] : []}
        multiple={false}
        title={t('detail.tasks.selectAssignee')}
        t={t}
        onConfirm={(ids, members) => {
          setValue('assigneeId', ids[0] ?? null);
          setPinnedAssignee(members[0] ?? null);
        }}
      />

      {/* Supervisores — selección múltiple, excluye asignado actual */}
      <MemberSelectionDialog
        open={supervisorsDialog.value}
        onClose={supervisorsDialog.onFalse}
        projectId={projectId}
        excludeIds={watchedAssigneeId ? [watchedAssigneeId] : []}
        pinnedMembers={pinnedSupervisors}
        selected={watchedSupervisorIds}
        multiple
        title={t('detail.tasks.selectSupervisors')}
        t={t}
        onConfirm={(ids, members) => {
          setValue('supervisorIds', ids);
          setPinnedSupervisors(members);
        }}
      />

      <ConfirmDialog
        open={confirmDelete.value}
        onClose={confirmDelete.onFalse}
        title={t('detail.tasks.deleteTitle')}
        content={t('detail.tasks.deleteConfirm')}
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            {t('detail.tasks.delete')}
          </Button>
        }
      />
    </>
  );
}
