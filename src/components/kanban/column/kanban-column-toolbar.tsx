import type { BoxProps } from '@mui/material/Box';
import type { UseColumnDndReturn } from '../hooks/use-column-dnd';

import { varAlpha } from 'minimal-shared/utils';
import { useBoolean, usePopover } from 'minimal-shared/hooks';
import { useId, useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

import { KanbanInputName } from '../components/kanban-input-name';

// ----------------------------------------------------------------------

type Props = BoxProps & {
  totalTasks?: number;
  filteredCount?: number;
  columnName: string;
  isCompletion?: boolean;
  readonlyColumns?: boolean;
  dragHandleRef?: UseColumnDndReturn['dragHandleRef'];
  onDeleteColumn?: () => void;
  onToggleAddTask?: () => void;
  onUpdateColumn?: (inputName: string) => Promise<void> | void;
  onEditColumn?: () => void;
  editLabel?: string;
  deleteLabel?: string;
  deleteConfirmTitle?: string;
  deleteConfirmContent?: string;
};

export function KanbanColumnToolBar({
  sx,
  dragHandleRef,
  columnName,
  totalTasks,
  filteredCount,
  isCompletion,
  readonlyColumns,
  onDeleteColumn,
  onUpdateColumn,
  onToggleAddTask,
  onEditColumn,
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  deleteConfirmTitle = 'Delete column',
  deleteConfirmContent = 'Are you sure you want to delete this column?',
  ...other
}: Props) {
  const uniqueId = useId();

  const renameRef = useRef<HTMLInputElement>(null);

  const menuActions = usePopover();
  const confirmDialog = useBoolean();

  const [name, setName] = useState(columnName);
  const [isRenaming, setIsRenaming] = useState(false);
  const committedNameRef = useRef(columnName);

  useEffect(() => {
    if (!isRenaming) {
      setName(columnName);
      committedNameRef.current = columnName;
    }
  }, [columnName, isRenaming]);

  useEffect(() => {
    if (isRenaming && !menuActions.open && renameRef.current) {
      renameRef.current.focus();
    }
  }, [isRenaming, menuActions.open]);

  const handleChangeName = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value.slice(0, 100));
  }, []);

  const handleKeyUpUpdateColumn = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        renameRef.current?.blur();
      }
    },
    []
  );

  const handleEdit = useCallback(() => {
    onEditColumn?.();
    menuActions.onClose();
  }, [menuActions, onEditColumn]);

  const handleDelete = useCallback(() => {
    confirmDialog.onTrue();
    menuActions.onClose();
  }, [confirmDialog, menuActions]);

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
    >
      <MenuList>
        {onEditColumn && (
          <MenuItem onClick={handleEdit}>
            <Iconify icon="solar:pen-bold" />
            {editLabel}
          </MenuItem>
        )}

        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Iconify icon="solar:trash-bin-trash-bold" />
          {deleteLabel}
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title={deleteConfirmTitle}
      content={deleteConfirmContent}
      action={
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            onDeleteColumn?.();
            confirmDialog.onFalse();
          }}
        >
          {deleteLabel}
        </Button>
      }
    />
  );

  const renderDragHandle = () => (
    <Box
      ref={dragHandleRef}
      component="span"
      sx={{
        top: 0,
        left: 0,
        width: 1,
        height: 1,
        cursor: 'grab',
        position: 'absolute',
      }}
    />
  );

  return (
    <>
      <Box
        sx={[
          (theme) => ({
            display: 'flex',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 2,
            pt: 'var(--kanban-column-pt)',
            px: 'var(--kanban-column-px)',
            bgcolor: theme.vars.palette.background.neutral,
            borderRadius: 'var(--kanban-column-radius) var(--kanban-column-radius) 0 0',
          }),
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...other}
      >
        {!readonlyColumns && renderDragHandle()}

        <Label
          color={isCompletion ? 'success' : 'default'}
          sx={[
            (theme) => ({
              borderRadius: filteredCount !== undefined ? undefined : '50%',
              borderColor: varAlpha(theme.vars.palette.grey['500Channel'], 0.24),
            }),
          ]}
        >
          {filteredCount !== undefined ? `${filteredCount}/${totalTasks}` : totalTasks}
        </Label>

        {isRenaming ? (
          <KanbanInputName
            inputRef={renameRef}
            placeholder="Column name"
            value={name}
            onChange={handleChangeName}
            onKeyUp={handleKeyUpUpdateColumn}
            onBlur={async () => {
              const prev = committedNameRef.current;
              setIsRenaming(false);
              try {
                await onUpdateColumn?.(name);
                committedNameRef.current = name;
              } catch {
                setName(prev);
              }
            }}
            inputProps={{ id: `${columnName}-${uniqueId}-column-input`, maxLength: 100 }}
            typographyVariant="subtitle1"
            sx={{ mx: 1, flex: '1 1 auto', minWidth: 0 }}
          />
        ) : (
          <Typography
            variant="subtitle1"
            onClick={() => !readonlyColumns && setIsRenaming(true)}
            sx={{
              mx: 1,
              flex: '1 1 auto',
              minWidth: 0,
              cursor: readonlyColumns ? 'default' : 'text',
              position: 'relative',
              zIndex: 1,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              wordBreak: 'break-word',
            }}
          >
            {name}
          </Typography>
        )}

        {onToggleAddTask && (
          <IconButton size="small" color="inherit" onClick={onToggleAddTask}>
            <Iconify icon="solar:add-circle-bold" />
          </IconButton>
        )}

        {!readonlyColumns && (
          <>
            <IconButton
              size="small"
              color={menuActions.open ? 'inherit' : 'default'}
              onClick={menuActions.onOpen}
            >
              <Iconify icon="solar:menu-dots-bold-duotone" />
            </IconButton>

            <IconButton size="small" sx={{ pointerEvents: 'none' }}>
              <Iconify icon="custom:drag-dots-fill" />
            </IconButton>
          </>
        )}
      </Box>

      {renderMenuActions()}
      {renderConfirmDialog()}
    </>
  );
}
