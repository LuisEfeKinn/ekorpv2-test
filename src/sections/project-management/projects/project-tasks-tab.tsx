'use client';

import type { IKanban, IKanbanTask } from 'src/types/kanban';
import type { AssigneeFilterOption } from './assignee-avatar-filter';
import type { MoveTaskInfo } from 'src/components/kanban/hooks/use-board-dnd';
import type { IBoard, IBoardColumn, IActivityKanbanColumn } from 'src/types/project-management';

import { toast } from 'sonner';
import { useDebounce } from 'minimal-shared/hooks';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import {
  CreateActivityService,
  MoveActivityKanbanService,
} from 'src/services/project-management/activity.service';
import {
  GetBoardsService,
  CreateBoardService,
  GetBoardColumnsService,
  UpdateBoardColumnService,
  DeleteBoardColumnService,
  CreateBoardColumnService,
  ReorderBoardColumnsService,
} from 'src/services/project-management/board.service';

import { Iconify } from 'src/components/iconify';
import { KanbanBoard } from 'src/components/kanban/view';

import { useProjectView } from '../project-view-context';
import { BoardColumnDrawer } from './board-column-drawer';
import { AssigneeAvatarFilter } from './assignee-avatar-filter';
import { ActivityDetailsDrawer } from './activity-details-drawer';

// ----------------------------------------------------------------------

function mapColumnsToBoard(
  columns: IActivityKanbanColumn[],
  boardColumnsMap?: Record<string, IBoardColumn>
): IKanban {
  const sortedColumns = [...columns].sort((a, b) => {
    const orderA = boardColumnsMap?.[String(a.statusId)]?.order ?? a.statusId;
    const orderB = boardColumnsMap?.[String(b.statusId)]?.order ?? b.statusId;
    return orderA - orderB;
  });

  const kanbanColumns = sortedColumns.map((col) => ({
    id: String(col.statusId),
    name: col.statusName,
    isCompletion: boardColumnsMap?.[String(col.statusId)]?.isCompletion ?? false,
    color: boardColumnsMap?.[String(col.statusId)]?.color,
  }));

  const tasks: IKanban['tasks'] = {};

  for (const col of sortedColumns) {
    const sorted = [...col.activities].sort((a, b) => a.order - b.order);

    tasks[String(col.statusId)] = sorted.map((activity) => ({
      id: String(activity.id),
      name: activity.name,
      status: col.statusKey ?? col.statusName,
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
  const { fetchKanban, canManageTasks, canManageColumns, allowedBoards } = useProjectView();

  const [board, setBoard] = useState<IKanban>({ columns: [], tasks: {} });
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<IKanbanTask | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);

  // Boards state
  const [boards, setBoards] = useState<IBoard[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [boardColumnsMap, setBoardColumnsMap] = useState<Record<string, IBoardColumn>>({});
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [creatingBoard, setCreatingBoard] = useState(false);

  // Column drawer
  const [columnDrawerOpen, setColumnDrawerOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<IBoardColumn | null>(null);

  // Stable refs to avoid stale closures
  const selectedBoardIdRef = useRef<string | null>(null);
  selectedBoardIdRef.current = selectedBoardId;
  const boardColumnsMapRef = useRef<Record<string, IBoardColumn>>({});
  boardColumnsMapRef.current = boardColumnsMap;

  // ----------------------------------------------------------------------

  const loadBoardColumns = useCallback(async (boardId: string): Promise<Record<string, IBoardColumn>> => {
    try {
      const response = await GetBoardColumnsService(Number(boardId));
      const cols: IBoardColumn[] = Array.isArray(response.data) ? response.data : [];
      const map: Record<string, IBoardColumn> = {};
      for (const col of cols) {
        map[col.id] = col;
      }
      setBoardColumnsMap(map);
      return map;
    } catch {
      return {};
    }
  }, []);

  const loadBoards = useCallback(async () => {
    if (allowedBoards !== null) {
      setBoards(allowedBoards);
      if (allowedBoards.length > 0 && !selectedBoardIdRef.current) {
        setSelectedBoardId(allowedBoards[0].id);
      }
      setLoadingBoards(false);
      return;
    }
    setLoadingBoards(true);
    try {
      const response = await GetBoardsService(Number(projectId));
      const boardList: IBoard[] = Array.isArray(response.data) ? response.data : [];
      setBoards(boardList);
      if (boardList.length > 0 && !selectedBoardIdRef.current) {
        setSelectedBoardId(boardList[0].id);
      }
    } catch {
      // silent
    } finally {
      setLoadingBoards(false);
    }
  }, [projectId, allowedBoards]);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  // ----------------------------------------------------------------------

  const fetchBoardWithId = useCallback(
    async (boardId: string, colsMap?: Record<string, IBoardColumn>) => {
      setLoading(true);
      try {
        const response = await fetchKanban(boardId);
        const map = colsMap ?? boardColumnsMapRef.current;
        setBoard(mapColumnsToBoard(response.data, map));
      } catch {
        toast.error(t('detail.tasks.errorLoading'));
      } finally {
        setLoading(false);
      }
    },
    [fetchKanban, t]
  );

  const silentFetchBoard = useCallback(async () => {
    const boardId = selectedBoardIdRef.current;
    if (!boardId) return;
    try {
      const response = await fetchKanban(boardId);
      setBoard(mapColumnsToBoard(response.data, boardColumnsMapRef.current));
    } catch {
      // silent — optimistic state stays
    }
  }, [fetchKanban]);

  // Fetch kanban when selectedBoardId changes
  useEffect(() => {
    if (!selectedBoardId) return;
    (async () => {
      const colsMap = await loadBoardColumns(selectedBoardId);
      await fetchBoardWithId(selectedBoardId, colsMap);
    })();
  }, [selectedBoardId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ----------------------------------------------------------------------

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

  // ----------------------------------------------------------------------
  // Task handlers

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
      } catch (error: any) {
        toast.error(error?.response?.data?.message || t('detail.tasks.errorMove'));
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
      } catch (error: any) {
        toast.error(error?.response?.data?.message || t('detail.tasks.errorLoading'));
      }
    },
    [projectId, silentFetchBoard, t]
  );

  // ----------------------------------------------------------------------
  // Column handlers

  const handleMoveColumn = useCallback(
    async (reorderedColumns: IKanban['columns']) => {
      const boardId = selectedBoardIdRef.current;
      if (!boardId) return;

      setBoard((prev) => ({ ...prev, columns: reorderedColumns }));

      try {
        await ReorderBoardColumnsService(
          reorderedColumns.map((col, index) => ({ id: parseInt(col.id, 10), order: index }))
        );
        const newMap = await loadBoardColumns(boardId);
        const response = await fetchKanban(boardId);
        setBoard(mapColumnsToBoard(response.data, newMap));
      } catch {
        toast.error(t('detail.tasks.column.columnErrorReorder'));
        silentFetchBoard();
      }
    },
    [fetchKanban, loadBoardColumns, silentFetchBoard, t]
  );

  const handleUpdateColumn = useCallback(
    async (id: string, name: string) => {
      const numericId = parseInt(id, 10);
      if (Number.isNaN(numericId)) return;
      try {
        await UpdateBoardColumnService(numericId, { name });
        setBoardColumnsMap((prev) => {
          if (!prev[id]) return prev;
          return { ...prev, [id]: { ...prev[id], name } };
        });
        toast.success(t('detail.tasks.column.columnUpdated'));
        silentFetchBoard();
      } catch (error: any) {
        toast.error(error?.message || t('detail.tasks.column.columnErrorUpdate'));
        throw error;
      }
    },
    [silentFetchBoard, t]
  );

  const handleDeleteColumn = useCallback(
    async (id: string) => {
      const boardId = selectedBoardIdRef.current;
      if (!boardId) return;
      const numericId = parseInt(id, 10);
      if (Number.isNaN(numericId)) return;
      try {
        await DeleteBoardColumnService(numericId);
        toast.success(t('detail.tasks.column.columnDeleted'));
        const newMap = await loadBoardColumns(boardId);
        await fetchBoardWithId(boardId, newMap);
      } catch (error: any) {
        toast.error(error?.message || t('detail.tasks.column.columnErrorDelete'));
      }
    },
    [fetchBoardWithId, loadBoardColumns, t]
  );

  const handleEditColumn = useCallback(
    (id: string) => {
      const col = boardColumnsMapRef.current[id];
      if (col) {
        setEditingColumn(col);
        setColumnDrawerOpen(true);
      }
    },
    []
  );

  const handleCreateDefaultBoard = useCallback(async () => {
    setCreatingBoard(true);
    try {
      const boardRes = await CreateBoardService({ projectId: Number(projectId), name: 'Principal' });
      const boardId = boardRes.data?.data?.rowId ?? boardRes.data?.rowId ?? boardRes.data?.id;
      if (boardId) {
        await Promise.all([
          CreateBoardColumnService({ boardId, name: 'Por hacer', color: '#3B82F6', order: 0, isCompletion: false }),
          CreateBoardColumnService({ boardId, name: 'En progreso', color: '#F59E0B', order: 1, isCompletion: false }),
          CreateBoardColumnService({ boardId, name: 'Finalizado', color: '#22C55E', order: 2, isCompletion: true }),
        ]);
      }
      await loadBoards();
    } catch (error: any) {
      toast.error(error?.message || 'Error al crear el tablero');
    } finally {
      setCreatingBoard(false);
    }
  }, [projectId, loadBoards]);

  const handleColumnDrawerSuccess = useCallback(async () => {
    const boardId = selectedBoardIdRef.current;
    if (!boardId) return;
    const newMap = await loadBoardColumns(boardId);
    await fetchBoardWithId(boardId, newMap);
  }, [fetchBoardWithId, loadBoardColumns]);

  // ----------------------------------------------------------------------

  const nextColumnOrder = Object.keys(boardColumnsMap).length;

  if (loadingBoards) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (boards.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
          gap: 2,
          px: 'var(--layout-dashboard-content-px)',
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: 'background.neutral',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Iconify icon="solar:bill-list-bold-duotone" width={40} sx={{ color: 'text.disabled' }} />
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Sin tableros
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {allowedBoards !== null
              ? t('detail.tasks.column.noBoardsAssigned')
              : t('detail.tasks.column.noBoards')}
          </Typography>
        </Box>
        {canManageColumns && (
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={handleCreateDefaultBoard}
            loading={creatingBoard}
          >
            Crear tablero
          </Button>
        )}
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  const boardIsEmpty = board.columns.length === 0;

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
      {/* Toolbar: search + filters LEFT · board selector RIGHT */}
      <Stack
        direction="row"
        alignItems="center"
        sx={{ px: 'var(--layout-dashboard-content-px)', mb: 1.5, flexWrap: 'wrap', gap: 1 }}
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

        <Box sx={{ flex: 1 }} />

        {/* Board selector */}
        <Select
          value={selectedBoardId ?? ''}
          onChange={(e) => setSelectedBoardId(e.target.value)}
          size="small"
          sx={{
            minWidth: 140,
            maxWidth: 200,
            '& .MuiSelect-select': {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            },
          }}
        >
          {boards.map((b) => (
            <MenuItem key={b.id} value={b.id}>
              {b.name}
            </MenuItem>
          ))}
        </Select>
      </Stack>

      {/* Empty board: no columns yet */}
      {boardIsEmpty ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            gap: 2,
            minHeight: 300,
          }}
        >
          <Iconify icon="solar:kanban-bold-duotone" width={64} sx={{ color: 'text.disabled' }} />
          <Typography variant="body2" color="text.secondary">
            Este tablero no tiene columnas todavía.
          </Typography>
          {canManageColumns && (
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:add-bold" />}
              onClick={() => {
                setEditingColumn(null);
                setColumnDrawerOpen(true);
              }}
            >
              {t('detail.tasks.column.addColumn')}
            </Button>
          )}
        </Box>
      ) : (
        <KanbanBoard
          board={displayBoard}
          boardLoading={false}
          readonlyColumns={!canManageColumns}
          disableTaskDnd={!canManageTasks}
          disableColumnAdd
          taskTotals={hasFilter ? taskTotals : undefined}
          dndCallbacks={
            canManageTasks
              ? { onMoveTask: handleMoveTask, onMoveColumn: canManageColumns ? handleMoveColumn : undefined }
              : undefined
          }
          onAddTask={canManageTasks ? handleAddTask : undefined}
          onUpdateColumn={canManageColumns ? handleUpdateColumn : undefined}
          onDeleteColumn={canManageColumns ? handleDeleteColumn : undefined}
          onEditColumn={canManageColumns ? handleEditColumn : undefined}
          onAddColumn={canManageColumns ? () => { setEditingColumn(null); setColumnDrawerOpen(true); } : undefined}
          addColumnLabel={t('detail.tasks.column.addColumn')}
          onTaskClick={handleTaskClick}
          taskAddPlaceholder={t('detail.tasks.namePlaceholder')}
          taskAddHelperText={t('detail.tasks.taskAddHelper')}
        />
      )}

      <ActivityDetailsDrawer
        open={drawerOpen}
        task={selectedTask}
        projectId={projectId}
        boardId={selectedBoardId}
        readOnly={!canManageTasks}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedTask(null);
        }}
        onSuccess={silentFetchBoard}
      />

      {canManageColumns && selectedBoardId && (
        <BoardColumnDrawer
          open={columnDrawerOpen}
          boardId={Number(selectedBoardId)}
          column={editingColumn}
          nextOrder={nextColumnOrder}
          onClose={() => {
            setColumnDrawerOpen(false);
            setEditingColumn(null);
          }}
          onSuccess={handleColumnDrawerSuccess}
        />
      )}
    </Box>
  );
}
