'use client';

import type { CSSObject } from '@mui/material/styles';
import type { IKanban, IKanbanTask } from 'src/types/kanban';
import type { UseBoardDndCallbacks } from '../hooks/use-board-dnd';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import GlobalStyles from '@mui/material/GlobalStyles';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useGetBoard } from 'src/actions/kanban';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

import { kanbanClasses } from '../classes';
import { useBoardDnd } from '../hooks/use-board-dnd';
import { KanbanColumn } from '../column/kanban-column';
import { KanbanColumnAdd } from '../column/kanban-column-add';
import { KanbanColumnSkeleton } from '../components/kanban-skeleton';

// ----------------------------------------------------------------------

const inputGlobalStyles = () => (
  <GlobalStyles
    styles={{
      body: {
        '--kanban-item-gap': '16px',
        '--kanban-item-radius': '12px',
        '--kanban-column-gap': '24px',
        '--kanban-column-width': '280px',
        '--kanban-column-radius': '16px',
        '--kanban-column-pt': '8px',
        '--kanban-column-pb': '12px',
        '--kanban-column-px': '10px',
      },
    }}
  />
);

// ----------------------------------------------------------------------

type KanbanBoardProps = {
  board: IKanban;
  boardLoading?: boolean;
  readonlyColumns?: boolean;
  disableTaskDnd?: boolean;
  disableColumnAdd?: boolean;
  taskTotals?: Record<string, number>;
  dndCallbacks?: UseBoardDndCallbacks;
  onAddTask?: (columnId: string, taskData: IKanbanTask) => void;
  onDeleteTask?: (taskId: string) => void;
  onUpdateTask?: (task: IKanbanTask) => void;
  onTaskClick?: (task: IKanbanTask) => void;
  onUpdateColumn?: (id: string, name: string) => void;
  onDeleteColumn?: (id: string) => void;
  onEditColumn?: (id: string) => void;
  onAddColumn?: () => void;
  addColumnLabel?: string;
  taskAddPlaceholder?: string;
  taskAddHelperText?: string;
};

export function KanbanBoard({
  board,
  boardLoading,
  readonlyColumns,
  disableTaskDnd,
  disableColumnAdd,
  taskTotals,
  dndCallbacks,
  onAddTask,
  onDeleteTask,
  onUpdateTask,
  onTaskClick,
  onUpdateColumn,
  onDeleteColumn,
  onEditColumn,
  onAddColumn,
  addColumnLabel = 'Add column',
  taskAddPlaceholder,
  taskAddHelperText,
}: KanbanBoardProps) {
  const { boardRef } = useBoardDnd(board, dndCallbacks, disableTaskDnd);

  const renderLoading = () => (
    <Box sx={{ gap: 'var(--kanban-column-gap)', display: 'flex', alignItems: 'flex-start' }}>
      <KanbanColumnSkeleton />
    </Box>
  );

  const renderEmpty = () => <EmptyContent filled sx={{ py: 10, maxHeight: { md: 480 } }} />;

  const renderList = () => (
    <FlexibleColumnContainer>
      <AnimatePresence>
        {board.columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={board.tasks[column.id] ?? []}
            taskTotal={taskTotals?.[column.id]}
            readonlyColumns={readonlyColumns}
            disableTaskDnd={disableTaskDnd}
            onAddTask={onAddTask}
            onDeleteTask={onDeleteTask}
            onUpdateTask={onUpdateTask}
            onTaskClick={onTaskClick}
            onUpdateColumnExt={onUpdateColumn}
            onDeleteColumnExt={onDeleteColumn}
            onEditColumnExt={onEditColumn}
            taskAddPlaceholder={taskAddPlaceholder}
            taskAddHelperText={taskAddHelperText}
          />
        ))}
      </AnimatePresence>

      {!readonlyColumns && (
        onAddColumn ? (
          <>
            <Box
              component="li"
              sx={{ flex: '0 0 auto', width: 'var(--kanban-column-width)', alignSelf: 'flex-start' }}
            >
              <Button
                fullWidth
                size="large"
                color="inherit"
                variant="outlined"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={onAddColumn}
              >
                {addColumnLabel}
              </Button>
            </Box>
            <Box component="li" sx={{ width: '1px', flexShrink: 0 }} />
          </>
        ) : (
          !disableColumnAdd && <KanbanColumnAdd />
        )
      )}
    </FlexibleColumnContainer>
  );

  const boardEmpty = !boardLoading && board.columns.length === 0;

  return (
    <>
      {inputGlobalStyles()}
      <ScrollContainer ref={boardRef}>
        {boardLoading ? renderLoading() : <>{boardEmpty ? renderEmpty() : renderList()}</>}
      </ScrollContainer>
    </>
  );
}

// ----------------------------------------------------------------------

export function KanbanView() {
  const { board, boardLoading, boardEmpty } = useGetBoard();
  const { boardRef } = useBoardDnd(board);

  const [columnFixed, setColumnFixed] = useState(false);

  const renderLoading = () => (
    <Box sx={{ gap: 'var(--kanban-column-gap)', display: 'flex', alignItems: 'flex-start' }}>
      <KanbanColumnSkeleton />
    </Box>
  );

  const renderEmpty = () => <EmptyContent filled sx={{ py: 10, maxHeight: { md: 480 } }} />;

  const renderList = () => (
    <FlexibleColumnContainer columnFixed={columnFixed}>
      <AnimatePresence>
        {board.columns.map((column) => (
          <KanbanColumn key={column.id} column={column} tasks={board.tasks[column.id]} />
        ))}
      </AnimatePresence>
      <KanbanColumnAdd />
    </FlexibleColumnContainer>
  );

  const renderHead = () => (
    <Box
      sx={{
        mb: 3,
        pr: { sm: 3 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Typography variant="h4">Kanban</Typography>

      <FormControlLabel
        label="Fixed column"
        labelPlacement="start"
        control={
          <Switch
            checked={columnFixed}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setColumnFixed(event.target.checked);
            }}
            slotProps={{ input: { id: 'fixed-column-switch' } }}
          />
        }
      />
    </Box>
  );

  return (
    <>
      {inputGlobalStyles()}

      <DashboardContent
        maxWidth={false}
        sx={{
          pb: 0,
          pl: { sm: 3 },
          pr: { sm: 0 },
          minHeight: 0,
          flex: '1 1 0',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {renderHead()}

        <ScrollContainer ref={boardRef}>
          {boardLoading ? renderLoading() : <>{boardEmpty ? renderEmpty() : renderList()}</>}
        </ScrollContainer>
      </DashboardContent>
    </>
  );
}

// ----------------------------------------------------------------------

const flexStyles: CSSObject = {
  minHeight: 0,
  flex: '1 1 auto',
};

const ScrollContainer = styled('div')(({ theme }) => ({
  ...theme.mixins.scrollbarStyles(theme),
  ...flexStyles,
  display: 'flex',
  overflowX: 'auto',
  overflowY: 'auto',
  flexDirection: 'column',
  userSelect: 'none',
}));

const FlexibleColumnContainer = styled('ul', {
  shouldForwardProp: (prop: string) => !['columnFixed', 'sx'].includes(prop),
})<{ columnFixed?: boolean }>(({ theme }) => ({
  display: 'flex',
  gap: 'var(--kanban-column-gap)',
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  paddingLeft: 'var(--kanban-board-pl, 0px)',
  '&::after': {
    content: '""',
    minWidth: 'var(--kanban-board-pr, 0px)',
    flexShrink: 0,
  },
  variants: [
    {
      props: { columnFixed: true },
      style: {
        ...flexStyles,
        [`& .${kanbanClasses.column.root}`]: { ...flexStyles },
        [`& .${kanbanClasses.column.list}`]: {
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
        },
      },
    },
  ],
}));
