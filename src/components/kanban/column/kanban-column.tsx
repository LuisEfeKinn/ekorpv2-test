import type { IKanbanTask, IKanbanColumn } from 'src/types/kanban';

import { toast } from 'sonner';
import { memo, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useBoolean } from 'minimal-shared/hooks';
import { mergeClasses } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { createTask, updateColumn, deleteColumn } from 'src/actions/kanban';

import { kanbanClasses } from '../classes';
import { DropIndicator } from '../item/styles';
import { useColumnDnd } from '../hooks/use-column-dnd';
import { KanbanTaskItem } from '../item/kanban-task-item';
import { KanbanColumnToolBar } from './kanban-column-toolbar';
import { KanbanTaskAdd } from '../components/kanban-task-add';
import { getAttr, columnMotionOptions } from '../utils/helpers';
import { ColumnRoot, ColumnList, ColumnWrapper } from './styles';

// ----------------------------------------------------------------------

type ColumnProps = React.ComponentProps<typeof ColumnRoot> & {
  column: IKanbanColumn;
  tasks: IKanbanTask[];
  taskTotal?: number;
  readonlyColumns?: boolean;
  disableTaskDnd?: boolean;
  onAddTask?: (columnId: string, taskData: IKanbanTask) => void;
  onDeleteTask?: (taskId: string) => void;
  onUpdateTask?: (task: IKanbanTask) => void;
  onTaskClick?: (task: IKanbanTask) => void;
  onUpdateColumnExt?: (id: string, name: string) => Promise<void> | void;
  onDeleteColumnExt?: (id: string) => void;
  onEditColumnExt?: (id: string) => void;
  taskAddPlaceholder?: string;
  taskAddHelperText?: string;
};

type TaskListProps = Pick<ColumnProps, 'column' | 'tasks' | 'disableTaskDnd' | 'onDeleteTask' | 'onUpdateTask' | 'onTaskClick'>;

const TaskList = memo(({ column, tasks, disableTaskDnd, onDeleteTask, onUpdateTask, onTaskClick }: TaskListProps) =>
  tasks.map((task) => (
    <KanbanTaskItem
      key={task.id}
      task={task}
      columnId={column.id}
      disableDnd={disableTaskDnd}
      isCompleted={column.isCompletion}
      onDeleteTask={onDeleteTask}
      onUpdateTask={onUpdateTask}
      onTaskClick={onTaskClick}
    />
  ))
);

// ----------------------------------------------------------------------

export function KanbanColumn({ column, tasks, taskTotal, readonlyColumns, disableTaskDnd, onAddTask, onDeleteTask, onUpdateTask, onTaskClick, onUpdateColumnExt, onDeleteColumnExt, onEditColumnExt, taskAddPlaceholder, taskAddHelperText, sx, ...other }: ColumnProps) {
  const { t } = useTranslate('project-management');
  const { taskListRef, dragHandleRef, columnRef, columnWrapperRef, state } = useColumnDnd(column);

  const openAddTask = useBoolean();

  const handleUpdateColumn = useCallback(
    async (columnName: string) => {
      if (column.name === columnName) return;
      if (onUpdateColumnExt) {
        await onUpdateColumnExt(column.id, columnName);
      } else {
        updateColumn(column.id, columnName);
        toast.success('Update success!', { position: 'top-center' });
      }
    },
    [column.id, column.name, onUpdateColumnExt]
  );

  const handleDeleteColumn = useCallback(async () => {
    try {
      if (onDeleteColumnExt) {
        onDeleteColumnExt(column.id);
      } else {
        deleteColumn(column.id);
        toast.success('Delete success!', { position: 'top-center' });
      }
    } catch (error) {
      console.error(error);
    }
  }, [column.id, onDeleteColumnExt]);

  const handleAddTask = useCallback(
    async (taskData: IKanbanTask) => {
      try {
        if (onAddTask) {
          onAddTask(column.id, taskData);
        } else {
          createTask(column.id, taskData);
        }
        openAddTask.onFalse();
      } catch (error) {
        console.error(error);
      }
    },
    [column.id, openAddTask, onAddTask]
  );

  const renderHeader = () => (
    <KanbanColumnToolBar
      dragHandleRef={dragHandleRef}
      totalTasks={taskTotal ?? tasks.length}
      filteredCount={taskTotal !== undefined ? tasks.length : undefined}
      columnName={column.name}
      isCompletion={column.isCompletion}
      readonlyColumns={readonlyColumns}
      onUpdateColumn={handleUpdateColumn}
      onDeleteColumn={handleDeleteColumn}
      onToggleAddTask={onAddTask ? openAddTask.onToggle : undefined}
      onEditColumn={onEditColumnExt ? () => onEditColumnExt(column.id) : undefined}
      editLabel={t('detail.tasks.column.edit')}
      deleteLabel={t('detail.tasks.column.delete')}
      deleteConfirmTitle={t('detail.tasks.column.deleteConfirmTitle')}
      deleteConfirmContent={t('detail.tasks.column.deleteConfirmContent')}
    />
  );

  const renderAddTaskBox = () => (
    <KanbanTaskAdd
      status={column.name}
      openAddTask={openAddTask.value}
      onAddTask={handleAddTask}
      onCloseAddTask={openAddTask.onFalse}
      placeholder={taskAddPlaceholder}
      helperText={taskAddHelperText}
    />
  );

  const renderDropIndicator = () =>
    state.type === kanbanClasses.state.taskOver && !state.isOverChildTask ? (
      <DropIndicator sx={{ height: state.dragRect.height }} />
    ) : null;

  const renderTaskList = () => (
    <ColumnList ref={taskListRef} className={kanbanClasses.column.list}>
      <AnimatePresence>
        <TaskList column={column} tasks={tasks} disableTaskDnd={disableTaskDnd} onDeleteTask={onDeleteTask} onUpdateTask={onUpdateTask} onTaskClick={onTaskClick} />
      </AnimatePresence>
      {renderDropIndicator()}
      {taskTotal !== undefined && taskTotal > 0 && tasks.length === 0 && (
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
            Sin resultados
          </Typography>
        </Box>
      )}
    </ColumnList>
  );

  return (
    <ColumnWrapper
      {...columnMotionOptions(column.id)}
      {...{
        [getAttr('dataColumnId')]: column.id,
      }}
      ref={columnWrapperRef}
      className={kanbanClasses.column.wrapper}
    >
      <ColumnRoot
        {...{
          [getAttr('blockBoardPanning')]: true,
        }}
        ref={columnRef}
        sx={sx}
        {...other}
        className={mergeClasses([kanbanClasses.column.root], {
          [kanbanClasses.state.dragging]: state.type === kanbanClasses.state.dragging,
          [kanbanClasses.state.taskOver]: state.type === kanbanClasses.state.taskOver,
          [kanbanClasses.state.columnOver]: state.type === kanbanClasses.state.columnOver,
        })}
      >
        {renderHeader()}
        {renderAddTaskBox()}
        {renderTaskList()}
      </ColumnRoot>
    </ColumnWrapper>
  );
}
