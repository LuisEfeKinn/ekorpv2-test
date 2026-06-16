'use client';

import type { IKanban, IKanbanTask } from 'src/types/kanban';
import type { IActivityKanbanColumn } from 'src/types/project-management';
import type { MoveTaskInfo } from 'src/components/kanban/hooks/use-board-dnd';

import { toast } from 'sonner';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import {
  CreateActivityService,
  MoveActivityKanbanService,
  GetActivitiesKanbanService,
} from 'src/services/project-management/activity.service';

import { KanbanBoard } from 'src/components/kanban/view';

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

export function ProjectTasksTab({ projectId }: Props) {
  const { t } = useTranslate('project-management');

  const [board, setBoard] = useState<IKanban>({ columns: [], tasks: {} });
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<IKanbanTask | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchBoard = useCallback(async () => {
    setLoading(true);
    try {
      const response = await GetActivitiesKanbanService(projectId);
      setBoard(mapColumnsToBoard(response.data));
    } catch {
      toast.error(t('detail.tasks.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [projectId, t]);

  const silentFetchBoard = useCallback(async () => {
    try {
      const response = await GetActivitiesKanbanService(projectId);
      setBoard(mapColumnsToBoard(response.data));
    } catch {
      // silent — optimistic state stays
    }
  }, [projectId]);

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
      <KanbanBoard
        board={board}
        boardLoading={false}
        readonlyColumns
        dndCallbacks={{ onMoveTask: handleMoveTask }}
        onAddTask={handleAddTask}
        onTaskClick={handleTaskClick}
      />

      <ActivityDetailsDrawer
        open={drawerOpen}
        task={selectedTask}
        projectId={projectId}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedTask(null);
        }}
        onSuccess={silentFetchBoard}
      />
    </Box>
  );
}
