'use client';

import type { NotificationConfigItem, NotificationConfigEvent, NotificationConfigGroup } from 'src/types/notifications';

import { useBoolean } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Accordion from '@mui/material/Accordion';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';

import { paths } from 'src/routes/paths';

import axios, { endpoints } from 'src/utils/axios';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  AssignRoleToNotificationService,
  ActivateNotificationConfigService,
  DeactivateNotificationConfigService,
  GetNotificationConfigurationsService,
} from 'src/services/notifications/notification-configurations.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { NotificationConfigAddDrawer } from '../notification-config-add-drawer';
import { NotificationConfigEditDrawer } from '../notification-config-edit-drawer';

// ----------------------------------------------------------------------

type Role = { id: number; name: string };

function formatObjectKey(key: string): string {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// ----------------------------------------------------------------------

export function NotificationConfigView() {
  const { t } = useTranslate('notifications');

  const editDrawer = useBoolean();
  const addDrawer = useBoolean();

  const [groups, setGroups] = useState<NotificationConfigGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<NotificationConfigEvent | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<NotificationConfigGroup | null>(null);
  const [selectedNotifiableId] = useState<number | null>(null);
  const [toggling, setToggling] = useState<Set<number>>(new Set());
  const [roles, setRoles] = useState<Role[]>([]);

  // Role delete confirm
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ notifiableId: number; roleName: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    axios.get<any>(endpoints.security.roles.all)
      .then((res) => {
        const raw: any[] = Array.isArray(res.data?.data) ? res.data.data : [];
        setRoles(raw.map((r: any) => ({ id: Number(r.id), name: r.name ?? String(r.id) })));
      })
      .catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await GetNotificationConfigurationsService();

      const raw = res.data as any;

      // Normalize to flat array regardless of response shape
      let items: any[] = [];
      if (Array.isArray(raw) && raw.length > 0 && Array.isArray(raw[0])) {
        items = raw[0]; // [[items...], count] tuple
      } else if (Array.isArray(raw)) {
        items = raw; // direct array
      } else if (raw?.data && Array.isArray(raw.data)) {
        items = raw.data; // { data: [...] } wrapper
      }

      if (items.length === 0) {
        setGroups([]);
        return;
      }

      // Pre-grouped: each item has an `events` array
      if (Array.isArray(items[0]?.events)) {
        setGroups(items as NotificationConfigGroup[]);
        return;
      }

      // Flat events — group by auditableObject.id
      const groupMap = new Map<string | number, NotificationConfigGroup>();
      items.forEach((event: any) => {
        const obj = event?.auditableObject;
        const key = obj?.id ?? '__ungrouped__';
        if (!groupMap.has(key)) {
          groupMap.set(key, {
            auditableObject: obj ?? { id: 0, objectKey: 'Sin categoría' },
            events: [],
          });
        }
        const g = groupMap.get(key)!;
        const notifRaw = event.notifications;
        const notifications: NotificationConfigItem[] = Array.isArray(notifRaw)
          ? notifRaw
          : Object.values(notifRaw ?? {});
        g.events.push({
          id: event.id,
          notificationEventKey: event.notificationEventKey ?? '',
          subjectTemplate: event.subjectTemplate ?? '',
          messageTemplate: event.messageTemplate ?? '',
          notifications,
        });
      });

      setGroups(Array.from(groupMap.values()));
    } catch (err: any) {
      toast.error(err?.message || 'Error al cargar las configuraciones');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggle = (key: string) => {
    setExpanded((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleEdit = (group: NotificationConfigGroup, event: NotificationConfigEvent) => {
    setSelectedGroup(group);
    setSelectedEvent(event);
    editDrawer.onTrue();
  };

  const handleAdd = (group: NotificationConfigGroup, event: NotificationConfigEvent) => {
    setSelectedGroup(group);
    setSelectedEvent(event);
    addDrawer.onTrue();
  };

  const handleToggleStatus = useCallback(
    async (notif: NotificationConfigItem) => {
      if (toggling.has(notif.id)) return;
      setToggling((prev) => new Set([...prev, notif.id]));
      try {
        if (notif.status === 1) {
          await DeactivateNotificationConfigService(notif.id);
        } else {
          await ActivateNotificationConfigService(notif.id);
        }
        await loadData();
      } catch (err: any) {
        toast.error(err?.message || 'Error al cambiar el estado');
      } finally {
        setToggling((prev) => {
          const next = new Set(prev);
          next.delete(notif.id);
          return next;
        });
      }
    },
    [toggling, loadData]
  );

  const handleOpenDeleteRole = useCallback(
    (notifiableId: number, roleName: string) => {
      setPendingDelete({ notifiableId, roleName });
      setConfirmOpen(true);
    },
    []
  );

  const handleConfirmDeleteRole = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await AssignRoleToNotificationService(pendingDelete.notifiableId, null);
      await DeactivateNotificationConfigService(pendingDelete.notifiableId);
      toast.success('Rol eliminado y notificación desactivada');
      setConfirmOpen(false);
      setPendingDelete(null);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Error al eliminar el rol');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('config.title')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Notificaciones', href: paths.dashboard.notifications.root },
          { name: t('config.title'), href: paths.dashboard.notifications.config },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card sx={{ overflow: 'hidden' }}>
        {loading ? (
          <LoadingSkeleton />
        ) : groups.length === 0 ? (
          <EmptyState label={t('config.noData')} />
        ) : (
          groups.map((group, idx) => {
            const groupId = group?.auditableObject?.id ?? `idx-${idx}`;
            const panelKey = `group-${groupId}`;
            const isExpanded = expanded.includes(panelKey);
            const groupLabel = group?.auditableObject?.objectKey
              ? formatObjectKey(group.auditableObject.objectKey)
              : `Grupo ${idx + 1}`;

            return (
              <Accordion
                key={panelKey}
                expanded={isExpanded}
                onChange={() => handleToggle(panelKey)}
                disableGutters
                elevation={0}
                sx={{
                  '&:not(:last-child)': { borderBottom: (theme) => `1px solid ${theme.palette.divider}` },
                  '&::before': { display: 'none' },
                }}
              >
                <AccordionSummary
                  expandIcon={
                    <Iconify
                      icon={isExpanded ? 'eva:minus-fill' : 'eva:plus-fill'}
                      width={18}
                      sx={{ color: 'text.secondary' }}
                    />
                  }
                  sx={{
                    px: 3,
                    py: 1.5,
                    bgcolor: (theme) => (isExpanded ? 'action.hover' : 'background.paper'),
                    '& .MuiAccordionSummary-content': { my: 0 },
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {groupLabel}
                  </Typography>
                </AccordionSummary>

                <AccordionDetails sx={{ p: 0 }}>
                  <Scrollbar>
                    <Table size="small" sx={{ minWidth: 720 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ width: 300, color: 'text.secondary' }}>
                            {t('config.columns.event')}
                          </TableCell>
                          <TableCell sx={{ color: 'text.secondary' }}>
                            {t('config.columns.notifications')}
                          </TableCell>
                          <TableCell align="right" sx={{ width: 100, color: 'text.secondary' }}>
                            {t('config.columns.options')}
                          </TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {group.events.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.disabled' }}>
                              {t('config.noData')}
                            </TableCell>
                          </TableRow>
                        ) : (
                          group.events.map((event) => (
                            <EventRow
                              key={event.id}
                              event={event}
                              roles={roles}
                              toggling={toggling}
                              onDeleteRole={handleOpenDeleteRole}
                              onToggleNotif={handleToggleStatus}
                              onEdit={() => handleEdit(group, event)}
                              onAdd={() => handleAdd(group, event)}
                              addLabel={t('config.actions.addNotification')}
                              editLabel={t('config.actions.editEvent')}
                            />
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </Scrollbar>
                </AccordionDetails>
              </Accordion>
            );
          })
        )}
      </Card>

      <NotificationConfigEditDrawer
        open={editDrawer.value}
        onClose={editDrawer.onFalse}
        event={selectedEvent}
        group={selectedGroup}
        onSaved={loadData}
      />

      <NotificationConfigAddDrawer
        open={addDrawer.value}
        onClose={addDrawer.onFalse}
        event={selectedEvent}
        group={selectedGroup}
        notifiableId={selectedNotifiableId}
        onSaved={loadData}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setPendingDelete(null); }}
        title="Quitar rol y desactivar"
        content={`¿Quitar el rol "${pendingDelete?.roleName}" y desactivar esta notificación? La notificación seguirá existiendo pero sin rol ni estado activo.`}
        action={
          <LoadingButton
            color="error"
            variant="contained"
            loading={deleting}
            onClick={handleConfirmDeleteRole}
          >
            Eliminar
          </LoadingButton>
        }
      />
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

type EventRowProps = {
  event: NotificationConfigEvent;
  roles: Role[];
  toggling: Set<number>;
  onDeleteRole: (notificationId: number, roleName: string) => void;
  onToggleNotif: (notif: NotificationConfigItem) => void;
  onEdit: () => void;
  onAdd: () => void;
  addLabel: string;
  editLabel: string;
};

function EventRow({ event, roles, toggling, onDeleteRole, onToggleNotif, onEdit, onAdd, addLabel, editLabel }: EventRowProps) {
  return (
    <TableRow hover>
      <TableCell>
        <Typography variant="body2" sx={{ color: 'text.primary' }}>
          {event.notificationEventKey}
        </Typography>
        {event.subjectTemplate && (
          <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
            {event.subjectTemplate}
          </Typography>
        )}
      </TableCell>

      <TableCell>
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {event.notifications?.length ? (
            event.notifications.map((notif) => {
              const roleName = notif.roleId != null
                ? (roles.find((r) => r.id === Number(notif.roleId))?.name ?? `Rol ${notif.roleId}`)
                : null;
              const isActive = notif.status === 1;
              const isToggling = toggling.has(notif.id);

              return (
                <Box
                  key={notif.id}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      display: 'inline-flex',
                      alignItems: 'center',
                      '&:hover .notif-delete-btn': { opacity: 1 },
                    }}
                  >
                    <Chip
                      label={roleName ?? notif.name}
                      size="small"
                      color={isActive && roleName ? 'success' : 'default'}
                      variant="soft"
                    />
                    {roleName && (
                      <Tooltip title="Quitar rol y desactivar">
                        <IconButton
                          className="notif-delete-btn"
                          size="small"
                          onClick={() => onDeleteRole(notif.id, roleName)}
                          sx={{
                            opacity: 0,
                            transition: 'opacity 0.15s',
                            position: 'absolute',
                            right: -8,
                            top: -8,
                            width: 18,
                            height: 18,
                            bgcolor: 'error.main',
                            color: 'common.white',
                            '&:hover': { bgcolor: 'error.dark', opacity: '1 !important' },
                          }}
                        >
                          <Iconify icon="mingcute:close-line" width={10} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>

                  <Tooltip title={isActive ? 'Desactivar' : 'Activar'}>
                    <span>
                      <IconButton
                        size="small"
                        disabled={isToggling}
                        onClick={() => onToggleNotif(notif)}
                        sx={{ width: 22, height: 22 }}
                      >
                        {isToggling ? (
                          <CircularProgress size={12} />
                        ) : (
                          <Iconify
                            icon={isActive ? 'solar:pause-bold' : 'solar:play-bold'}
                            width={14}
                            sx={{ color: isActive ? 'warning.main' : 'success.main' }}
                          />
                        )}
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              );
            })
          ) : (
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              —
            </Typography>
          )}
        </Stack>
      </TableCell>

      <TableCell align="right">
        <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
          <Tooltip title={addLabel}>
            <IconButton
              size="small"
              color="primary"
              onClick={onAdd}
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                width: 28,
                height: 28,
                '&:hover': { bgcolor: 'primary.dark' },
              }}
            >
              <Iconify icon="eva:plus-fill" width={16} />
            </IconButton>
          </Tooltip>

          <Tooltip title={editLabel}>
            <IconButton
              size="small"
              color="primary"
              onClick={onEdit}
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                width: 28,
                height: 28,
                '&:hover': { bgcolor: 'primary.dark' },
              }}
            >
              <Iconify icon="solar:pen-bold" width={16} />
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

// ----------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <Stack spacing={0}>
      {[1, 2, 3, 4].map((i) => (
        <Box key={i} sx={{ px: 3, py: 2, borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
          <Skeleton variant="text" width={200} height={28} />
        </Box>
      ))}
    </Stack>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
      <Iconify icon="solar:bell-off-bold" width={48} sx={{ color: 'text.disabled', mb: 1.5 }} />
      <Typography variant="body2" sx={{ color: 'text.disabled' }}>
        {label}
      </Typography>
    </Stack>
  );
}
