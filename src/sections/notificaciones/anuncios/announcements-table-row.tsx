'use client';

import type { Announcement } from 'src/types/notifications';

import { useState, useCallback } from 'react';
import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { fDateTime } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';
import { GetAnnouncementFileViewService } from 'src/services/notifications/announcements.service';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { FileThumbnail } from 'src/components/file-thumbnail';
import { CustomPopover } from 'src/components/custom-popover';

type Props = {
  row: Announcement;
  onEdit: () => void;
  onDelete: () => void;
};

export function AnnouncementsTableRow({ row, onEdit, onDelete }: Props) {
  const { t } = useTranslate('notifications');
  const confirm = useBoolean();
  const popover = usePopover();

  const [viewLoading, setViewLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const handleViewImage = useCallback(async () => {
    setPreviewOpen(true);
    setPreviewUrl('');
    setViewLoading(true);
    try {
      const url = await GetAnnouncementFileViewService(row.id);
      setPreviewUrl(url);
    } catch {
      toast.error(t('announcements.messages.error.loadingImage', { defaultValue: 'No se pudo cargar la imagen.' }));
      setPreviewOpen(false);
    } finally {
      setViewLoading(false);
    }
  }, [row.id, t]);

  const handleClosePreview = useCallback(() => {
    setPreviewOpen(false);
    setPreviewUrl('');
  }, []);

  const hasStatus = row.status !== null && row.status !== undefined;
  const statusValue = Number(row.status ?? 0);
  const statusLabel = !hasStatus
    ? '-'
    : statusValue === 1
      ? t('announcements.status.active')
      : statusValue === 2
        ? t('announcements.status.deleted')
        : t('announcements.status.inactive');
  const statusColor =
    !hasStatus ? 'default' : statusValue === 1 ? 'success' : statusValue === 2 ? 'warning' : 'error';

  const typeLabel =
    row.type === 'NOTICIA'
      ? t('announcements.types.news')
      : row.type === 'EVENTO'
        ? t('announcements.types.event')
        : row.type === 'ARTICULO'
          ? t('announcements.types.article')
          : row.type || '-';

  return (
    <>
      <TableRow hover>
        <TableCell padding="checkbox">
          <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>

        <TableCell>
          <Typography variant="subtitle2" noWrap>
            {row.id}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="subtitle2" noWrap>
            {row.title}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2" noWrap>
            {typeLabel}
          </Typography>
        </TableCell>

        <TableCell>
          <Label variant="soft" color={statusColor}>
            {statusLabel}
          </Label>
        </TableCell>

        <TableCell align="center">
          <Typography variant="body2" noWrap>
            {row.order}
          </Typography>
        </TableCell>

        <TableCell>
          {row.file ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FileThumbnail file={row.file} tooltip showImage sx={{ width: 36, height: 36 }} />
              <Button
                size="small"
                variant="text"
                onClick={handleViewImage}
                disabled={viewLoading}
                sx={{ textTransform: 'none', p: 0, minWidth: 0 }}
              >
                {t('announcements.actions.view')}
              </Button>
            </Box>
          ) : (
            '-'
          )}
        </TableCell>

        <TableCell>
          <Typography variant="body2" noWrap>
            {row.deadlineDate ? fDateTime(row.deadlineDate) : '-'}
          </Typography>
        </TableCell>
      </TableRow>

      <Dialog open={previewOpen} onClose={handleClosePreview} fullWidth maxWidth="lg">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" noWrap>
              {row.title}
            </Typography>
          </Box>
          <IconButton onClick={handleClosePreview}>
            <Iconify icon="mingcute:close-line" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {viewLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
              <CircularProgress />
            </Box>
          ) : previewUrl ? (
            <Box sx={{ height: '80vh' }}>
              <Box
                component="img"
                src={previewUrl}
                alt={row.title}
                sx={{ width: 1, height: 1, objectFit: 'contain', bgcolor: 'background.default' }}
              />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
              <Typography variant="body2" color="text.secondary">
                {t('announcements.messages.error.loadingImage', { defaultValue: 'No se pudo cargar la imagen.' })}
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              popover.onClose();
              onEdit();
            }}
          >
            <Iconify icon="solar:pen-bold" />
            {t('announcements.actions.edit')}
          </MenuItem>

          <MenuItem
            onClick={() => {
              popover.onClose();
              confirm.onTrue();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            {t('announcements.actions.delete')}
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title={t('announcements.confirmDelete.title')}
        content={t('announcements.confirmDelete.content')}
        action={
          <Button variant="contained" color="error" onClick={onDelete}>
            {t('announcements.actions.delete')}
          </Button>
        }
      />
    </>
  );
}
