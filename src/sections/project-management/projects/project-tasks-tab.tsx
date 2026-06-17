'use client';

import type { IKanban, IKanbanTask } from 'src/types/kanban';
import type { AssigneeFilterOption } from './assignee-avatar-filter';
import type { IActivityKanbanColumn } from 'src/types/project-management';
import type { MoveTaskInfo } from 'src/components/kanban/hooks/use-board-dnd';

import { toast } from 'sonner';
import { useDebounce } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import {
  CreateActivityService,
  MoveActivityKanbanService,
} from 'src/services/project-management/activity.service';

import { Iconify } from 'src/components/iconify';
import { KanbanBoard } from 'src/components/kanban/view';

import { useProjectView } from '../project-view-context';
import { AssigneeAvatarFilter } from './assignee-avatar-filter';
import { ActivityDetailsDrawer } from './activity-details-drawer';

// ----------------------------------------------------------------------

function mapColumnsToBoard(columns: IActivityKanbanColumn[]): IKanban {
  const sortedColumns = [...columns].sort((a, b) => a.statusId - b.statusId);

  const kanbanColumns = sortedColumns.map((col) => ({
    id: String(col.statusId),
    name: col.statusName,
  }));

  const tasks: IKanban['tasks'] = {};

  for (const col of sortedColumns) {
    const sorted = [...col.activities].sort((a, b) => a.order - b.order);

    tasks[String(col.statusId)] = sorted.map((activity) => ({
      id: String(activity.id),
      name: activity.name,
      status: col.statusKey,
      priority: activity.priority ?? 'medium',
      labels: [],
      attachments: [],
      comments: [],
      assignee: activity.assignee
        ? [
            {
              id: String(activity.assignee.id),
              name: activity.assignee.fullName,
              role: '',
              email: '',
              status: '',
              address: '',
              phoneNumber: '',
              lastActivity: null,
            },
          ]
        : [],
      due: [activity.startDate ?? null, activity.endDate ?? null],
      reporter: { id: '', name: '', avatarUrl: '' },
      subtaskCount: activity.subtaskCount,
    }));
  }

  return { columns: kanbanColumns, tasks };
}

// ----------------------------------------------------------------------

type Props = {
  projectId: string;
};

function extractAssignees(board: IKanban): AssigneeFilterOption[] {
  const map = new Map<string, string>();
  let hasUnassigned = false;

  for (const tasks of Object.values(board.tasks)) {
    for (const task of tasks) {
      if (task.assignee[0]) {
        map.set(task.assignee[0].id, task.assignee[0].name);
      } else {
        hasUnassigned = true;
      }
    }
  }

  const result: AssigneeFilterOption[] = [];
  if (hasUnassigned) result.push({ id: 'unassigned', label: 'Sin asignar' });
  for (const [id, label] of map) result.push({ id, label });
  return result;
}

// ----------------------------------------------------------------------

export function ProjectTasksTab({ projectId }: Props) {
  const { t } = useTranslate('project-management');
  const { fetchKanban, canManageTasks } = useProjectView();

  const [board, setBoard] = useState<IKanban>({ columns: [], tasks: {} });
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<IKanbanTask | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);

  const assignees = useMemo(() => extractAssignees(board), [board]);

  const taskTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const [colId, tasks] of Object.entries(board.tasks)) {
      totals[colId] = tasks.length;
    }
    return totals;
  }, [board]);

  const hasFilter = selectedAssignees.length > 0 || search.trim() !== '';

  const displayBoard = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    const hasAssigneeFilter = selectedAssignees.length > 0;
    if (!term && !hasAssigneeFilter) return board;

    const filtered: IKanban['tasks'] = {};
    for (const colId of Object.keys(board.tasks)) {
      filtered[colId] = board.tasks[colId].filter((task) => {
        const matchesSearch = !term || task.name.toLowerCase().includes(term);
        const assigneeId = task.assignee[0]?.id ?? 'unassigned';
        const matchesAssignee = !hasAssigneeFilter || selectedAssignees.includes(assigneeId);
        return matchesSearch && matchesAssignee;
      });
    }
    return { ...board, tasks: filtered };
  }, [board, selectedAssignees, debouncedSearch]);

  const fetchBoard = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchKanban(projectId);
      setBoard(mapColumnsToBoard(response.data));
    } catch {
      toast.error(t('detail.tasks.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [projectId, t, fetchKanban]);

  const silentFetchBoard = useCallback(async () => {
    try {
      const response = await fetchKanban(projectId);
      setBoard(mapColumnsToBoard(response.data));
    } catch {
      // silent — optimistic state stays
    }
  }, [projectId, fetchKanban]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const handleMoveTask = useCallback(
    async (updatedTasks: IKanban['tasks'], info: MoveTaskInfo) => {
      const prevBoard = board;
      setBoard((prev) => ({ ...prev, tasks: updatedTasks }));

      try {
        await MoveActivityKanbanService(info.taskId, {
          ...(info.sourceColumnId !== info.targetColumnId && { statusId: Number(info.targetColumnId) }),
          order: info.targetIndex,
        });
        silentFetchBoard();
      } catch {
        toast.error(t('detail.tasks.errorMove'));
        setBoard(prevBoard);
      }
    },
    [board, t, silentFetchBoard]
  );

  const handleTaskClick = useCallback((task: IKanbanTask) => {
    setSelectedTask(task);
    setDrawerOpen(true);
  }, []);

  const handleAddTask = useCallback(
    async (columnId: string, taskData: IKanbanTask) => {
      try {
        await CreateActivityService({
          projectId: Number(projectId),
          name: taskData.name,
          statusId: Number(columnId),
        });
        silentFetchBoard();
      } catch {
        toast.error(t('detail.tasks.errorLoading'));
      }
    },
    [projectId, silentFetchBoard, t]
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        pb: 0,
        minHeight: 0,
        flex: '1 1 0',
        display: 'flex',
        flexDirection: 'column',
        '--kanban-board-pl': 'var(--layout-dashboard-content-px)',
        '--kanban-board-pr': '16px',
      }}
    >
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        sx={{ px: 'var(--layout-dashboard-content-px)', mb: 1.5 }}
      >
        <TextField
          size="small"
          placeholder={t('detail.tasks.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" width={16} sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ width: 240 }}
        />

        {assignees.length > 0 && (
          <AssigneeAvatarFilter
            assignees={assignees}
            selected={selectedAssignees}
            onChange={setSelectedAssignees}
          />
        )}

        {hasFilter && (
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => {
              setSearch('');
              setSelectedAssignees([]);
            }}
          >
            {t('detail.tasks.clearFilters')}
          </Button>
        )}
      </Stack>

      <KanbanBoard
        board={displayBoard}
        boardLoading={false}
        readonlyColumns
        disableTaskDnd={!canManageTasks}
        taskTotals={hasFilter ? taskTotals : undefined}
        dndCallbacks={canManageTasks ? { onMoveTask: handleMoveTask } : undefined}
        onAddTask={canManageTasks ? handleAddTask : undefined}
        onTaskClick={handleTaskClick}
      />

      <ActivityDetailsDrawer
        open={drawerOpen}
        task={selectedTask}
        projectId={projectId}
        readOnly={!canManageTasks}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedTask(null);
        }}
        onSuccess={silentFetchBoard}
      />
    </Box>
  );
}
