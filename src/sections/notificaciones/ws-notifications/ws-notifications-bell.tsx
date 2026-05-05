'use client';

import type { WsNotification } from 'src/hooks/use-notifications-ws';

import { m } from 'framer-motion';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Badge from '@mui/material/Badge';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';

import { fToNow } from 'src/utils/format-time';

import { useNotificationsWs } from 'src/hooks/use-notifications-ws';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { varTap, varHover, transitionTap } from 'src/components/animate';

// ----------------------------------------------------------------------

function eventLabel(event: string): string {
  const map: Record<string, string> = {
    'document:created': 'Documento creado',
    'document:updated': 'Documento actualizado',
    'document:deleted': 'Documento eliminado',
  };
  return map[event] ?? event;
}

// ----------------------------------------------------------------------

function NotificationRow({
  item,
  onRead,
}: {
  item: WsNotification;
  onRead: (id: string) => void;
}) {
  return (
    <ListItemButton
      onClick={() => onRead(item.id)}
      sx={{
        py: 1.5,
        px: 2.5,
        gap: 2,
        alignItems: 'flex-start',
        ...(!item.isRead && { bgcolor: 'action.selected' }),
      }}
    >
      <Box
        sx={{
          width: 8,
          height: 8,
          mt: 1,
          flexShrink: 0,
          borderRadius: '50%',
          bgcolor: item.isRead ? 'transparent' : 'primary.main',
        }}
      />

      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              size="small"
              label={eventLabel(item.event)}
              color="primary"
              variant="soft"
              sx={{ height: 20, fontSize: 11 }}
            />
            <Typography variant="body2" sx={{ fontWeight: item.isRead ? 400 : 600 }}>
              {item.data.name}
            </Typography>
          </Box>
        }
        secondary={
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {fToNow(item.receivedAt)}
            </Typography>
            {item.data.code && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                · {item.data.code}
              </Typography>
            )}
          </Box>
        }
        primaryTypographyProps={{ component: 'div' }}
        secondaryTypographyProps={{ component: 'div' }}
      />
    </ListItemButton>
  );
}

// ----------------------------------------------------------------------

export function WsNotificationsBell() {
  const { value: open, onFalse: onClose, onTrue: onOpen } = useBoolean();
  const { notifications, unreadCount, connected, markAllAsRead, markAsRead, clearAll } =
    useNotificationsWs();

  return (
    <>
      <Tooltip title="Notificaciones">
        <IconButton
          component={m.button}
          whileTap={varTap(0.96)}
          whileHover={varHover(1.04)}
          transition={transitionTap()}
          aria-label="Notificaciones"
          onClick={onOpen}
        >
          <Badge badgeContent={unreadCount} color="error">
            <Iconify width={24} icon="solar:bell-bing-bold-duotone" />
          </Badge>
        </IconButton>
      </Tooltip>

      <Drawer
        open={open}
        onClose={onClose}
        anchor="right"
        slotProps={{
          backdrop: { invisible: true },
          paper: { sx: { width: 1, maxWidth: 420, display: 'flex', flexDirection: 'column' } },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            py: 2,
            pr: 1,
            pl: 2.5,
            minHeight: 68,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Notificaciones
          </Typography>

          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: connected ? 'success.main' : 'error.main',
              mr: 1.5,
              flexShrink: 0,
            }}
          />

          {unreadCount > 0 && (
            <Tooltip title="Marcar todo como leído">
              <IconButton color="primary" onClick={markAllAsRead}>
                <Iconify icon="eva:done-all-fill" />
              </IconButton>
            </Tooltip>
          )}

          <IconButton onClick={onClose}>
            <Iconify icon="mingcute:close-line" />
          </IconButton>
        </Box>

        <Divider />

        {/* List */}
        <Scrollbar sx={{ flex: 1 }}>
          {notifications.length === 0 ? (
            <Box
              sx={{
                py: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1.5,
                color: 'text.disabled',
              }}
            >
              <Iconify icon="solar:bell-off-bold" width={48} />
              <Typography variant="body2">Sin notificaciones</Typography>
            </Box>
          ) : (
            <Box component="ul" sx={{ p: 0, m: 0, listStyle: 'none' }}>
              {notifications.map((item) => (
                <Box component="li" key={item.id}>
                  <NotificationRow item={item} onRead={markAsRead} />
                  <Divider sx={{ borderStyle: 'dashed' }} />
                </Box>
              ))}
            </Box>
          )}
        </Scrollbar>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Divider />
            <Box sx={{ p: 1 }}>
              <Button fullWidth size="large" color="inherit" onClick={clearAll}>
                Limpiar todo
              </Button>
            </Box>
          </>
        )}
      </Drawer>
    </>
  );
}
