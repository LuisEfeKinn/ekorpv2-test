'use client';

import type { IBoard, IProjectDetail } from 'src/types/project-management';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { UpdateProjectPermissionsService } from 'src/services/project-management/project.service';
import {
  GetBoardsService,
  CreateBoardService,
  UpdateBoardService,
  DeleteBoardService,
  CreateBoardColumnService,
} from 'src/services/project-management/board.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  projectId: string;
  project: IProjectDetail;
  onProjectUpdated: () => void;
};

// ----------------------------------------------------------------------

export function ProjectConfigTab({ projectId, project, onProjectUpdated }: Props) {
  const { t } = useTranslate('project-management');
  const [boards, setBoards] = useState<IBoard[]>([]);
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editingBoardName, setEditingBoardName] = useState('');
  const [newBoardName, setNewBoardName] = useState('');
  const [showNewBoardInput, setShowNewBoardInput] = useState(false);

  const [restrictVisibility, setRestrictVisibility] = useState(
    project.restrictActivityVisibility ?? false
  );
  const [isEditable, setIsEditable] = useState(project.isEditable ?? true);
  const [savingPerms, setSavingPerms] = useState(false);

  const loadBoards = useCallback(async () => {
    setLoadingBoards(true);
    try {
      const response = await GetBoardsService(Number(projectId));
      setBoards(Array.isArray(response.data) ? response.data : []);
    } catch {
      toast.error(t('detail.config.boards.errorLoad'));
    } finally {
      setLoadingBoards(false);
    }
  }, [projectId, t]);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  // Sync permission state when project prop changes
  useEffect(() => {
    setRestrictVisibility(project.restrictActivityVisibility ?? false);
    setIsEditable(project.isEditable ?? true);
  }, [project.restrictActivityVisibility, project.isEditable]);

  // ----------------------------------------------------------------------
  // Board handlers

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return;
    try {
      const response = await CreateBoardService({ projectId: Number(projectId), name: newBoardName.trim() });
      const boardId = response.data?.data?.rowId ?? response.data?.rowId;
      if (boardId) {
        await Promise.all([
          CreateBoardColumnService({ boardId, name: 'Por hacer', color: '#3B82F6', order: 0, isCompletion: false }),
          CreateBoardColumnService({ boardId, name: 'En progreso', color: '#F59E0B', order: 1, isCompletion: false }),
          CreateBoardColumnService({ boardId, name: 'Finalizado', color: '#22C55E', order: 2, isCompletion: true }),
        ]);
      }
      setNewBoardName('');
      setShowNewBoardInput(false);
      await loadBoards();
      toast.success(t('detail.config.boards.created'));
    } catch (error: any) {
      toast.error(error?.message || t('detail.config.boards.errorCreate'));
    }
  };

  const handleStartRename = (board: IBoard) => {
    setEditingBoardId(board.id);
    setEditingBoardName(board.name);
  };

  const handleRenameBoard = async (boardId: string) => {
    if (!editingBoardName.trim()) return;
    try {
      await UpdateBoardService(Number(boardId), { name: editingBoardName.trim() });
      setEditingBoardId(null);
      await loadBoards();
    } catch (error: any) {
      toast.error(error?.message || t('detail.config.boards.errorRename'));
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    try {
      await DeleteBoardService(Number(boardId));
      await loadBoards();
      toast.success(t('detail.config.boards.deleted'));
    } catch (error: any) {
      toast.error(error?.message || t('detail.config.boards.errorDelete'));
    }
  };

  // ----------------------------------------------------------------------
  // Permission handlers

  const handlePermissionChange = async (
    field: 'restrictActivityVisibility' | 'isEditable',
    value: boolean
  ) => {
    const prevRestrict = restrictVisibility;
    const prevEditable = isEditable;

    if (field === 'restrictActivityVisibility') setRestrictVisibility(value);
    else setIsEditable(value);

    setSavingPerms(true);
    try {
      await UpdateProjectPermissionsService(projectId, { [field]: value });
      onProjectUpdated();
    } catch (error: any) {
      if (field === 'restrictActivityVisibility') setRestrictVisibility(prevRestrict);
      else setIsEditable(prevEditable);
      toast.error(error?.message || t('detail.config.permissions.errorSave'));
    } finally {
      setSavingPerms(false);
    }
  };

  // ----------------------------------------------------------------------

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 640 }}>
      {/* Boards section */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            {t('detail.config.boards.title')}
          </Typography>
          <Button
            size="small"
            startIcon={<Iconify icon="solar:add-bold" />}
            onClick={() => setShowNewBoardInput(true)}
            disabled={showNewBoardInput}
          >
            {t('detail.config.boards.newBoard')}
          </Button>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('detail.config.boards.subtitle')}
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {loadingBoards ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Stack spacing={1}>
            {boards.map((board) =>
              editingBoardId === board.id ? (
                <Stack key={board.id} direction="row" alignItems="center" spacing={1}>
                  <TextField
                    size="small"
                    value={editingBoardName}
                    onChange={(e) => setEditingBoardName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameBoard(board.id);
                      if (e.key === 'Escape') setEditingBoardId(null);
                    }}
                    autoFocus
                    sx={{ flex: 1 }}
                  />
                  <IconButton size="small" color="primary" onClick={() => handleRenameBoard(board.id)}>
                    <Iconify icon="solar:check-bold" width={18} />
                  </IconButton>
                  <IconButton size="small" onClick={() => setEditingBoardId(null)}>
                    <Iconify icon="mingcute:close-line" width={18} />
                  </IconButton>
                </Stack>
              ) : (
                <Stack
                  key={board.id}
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{
                    px: 1.5,
                    py: 1,
                    borderRadius: 1,
                    border: (theme) => `1px solid ${theme.vars.palette.divider}`,
                  }}
                >
                  <Iconify icon="solar:clipboard-list-bold-duotone" width={18} sx={{ color: 'text.secondary', flexShrink: 0 }} />
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {board.name}
                  </Typography>
                  <IconButton size="small" onClick={() => handleStartRename(board)}>
                    <Iconify icon="solar:pen-bold" width={16} />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDeleteBoard(board.id)}>
                    <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                  </IconButton>
                </Stack>
              )
            )}

            {showNewBoardInput && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <TextField
                  size="small"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateBoard();
                    if (e.key === 'Escape') {
                      setShowNewBoardInput(false);
                      setNewBoardName('');
                    }
                  }}
                  placeholder={t('detail.config.boards.namePlaceholder')}
                  autoFocus
                  sx={{ flex: 1 }}
                />
                <IconButton size="small" color="primary" onClick={handleCreateBoard}>
                  <Iconify icon="solar:check-bold" width={18} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => {
                    setShowNewBoardInput(false);
                    setNewBoardName('');
                  }}
                >
                  <Iconify icon="mingcute:close-line" width={18} />
                </IconButton>
              </Stack>
            )}

            {boards.length === 0 && !showNewBoardInput && (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                {t('detail.config.boards.empty')}
              </Typography>
            )}
          </Stack>
        )}
      </Paper>

      {/* Permissions section */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
          {t('detail.config.permissions.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('detail.config.permissions.subtitle')}
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Stack spacing={2.5}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                {t('detail.config.permissions.restrictVisibility')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('detail.config.permissions.restrictVisibilityDesc')}
              </Typography>
            </Box>
            <Switch
              checked={restrictVisibility}
              disabled={savingPerms}
              onChange={(e) => handlePermissionChange('restrictActivityVisibility', e.target.checked)}
            />
          </Stack>

          <Divider />

          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                {t('detail.config.permissions.isEditable')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('detail.config.permissions.isEditableDesc')}
              </Typography>
            </Box>
            <Switch
              checked={isEditable}
              disabled={savingPerms}
              onChange={(e) => handlePermissionChange('isEditable', e.target.checked)}
            />
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
