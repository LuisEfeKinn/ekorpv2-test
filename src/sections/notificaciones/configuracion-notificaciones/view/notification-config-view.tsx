'use client';

import type { NotificationConfigEvent, NotificationConfigGroup } from 'src/types/notifications';

import { useState, useEffect, useCallback } from 'react';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetNotificationConfigurationsService } from 'src/services/notifications/notification-configurations.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { NotificationConfigEditDrawer } from '../notification-config-edit-drawer';
import { NotificationConfigAddDrawer } from '../notification-config-add-drawer';

// ----------------------------------------------------------------------

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
  const [selectedNotifiableId, setSelectedNotifiableId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await GetNotificationConfigurationsService();
      setGroups(Array.isArray(res.data) ? res.data : []);
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
    // notifiableId viene del primer notifiable ya registrado en el evento
    const notifiableId = event.notifications?.[0]?.notifiable?.id ?? null;
    setSelectedNotifiableId(notifiableId);
    addDrawer.onTrue();
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
          groups.map((group) => {
            const panelKey = `group-${group.auditableObject.id}`;
            const isExpanded = expanded.includes(panelKey);

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
                    {formatObjectKey(group.auditableObject.objectKey)}
                  </Typography>
                </AccordionSummary>

                <AccordionDetails sx={{ p: 0 }}>
                  <Scrollbar>
                    <Table size="small" sx={{ minWidth: 720 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ width: 340, color: 'text.secondary' }}>
                            {t('config.columns.event')}
                          </TableCell>
                          <TableCell sx={{ color: 'text.secondary' }}>
                            {t('config.columns.notifications')}
                          </TableCell>
                          <TableCell align="right" sx={{ width: 120, color: 'text.secondary' }}>
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
                              onEdit={() => handleEdit(group, event)}
                              onAdd={() => handleAdd(group, event)}
                              addLabel={t('config.actions.addNotification')}
                              editLabel={t('config.actions.editEvent')}
                              activeLabel={t('config.status.active')}
                              inactiveLabel={t('config.status.inactive')}
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
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

type EventRowProps = {
  event: NotificationConfigEvent;
  onEdit: () => void;
  onAdd: () => void;
  addLabel: string;
  editLabel: string;
  activeLabel: string;
  inactiveLabel: string;
};

function EventRow({ event, onEdit, onAdd, addLabel, editLabel, activeLabel, inactiveLabel }: EventRowProps) {
  return (
    <TableRow hover>
      <TableCell>
        <Typography variant="body2" sx={{ color: 'text.primary' }}>
          {event.notificationEventKey}
        </Typography>
      </TableCell>

      <TableCell>
        <Stack direction="row" flexWrap="wrap" gap={0.75}>
          {event.notifications?.length ? (
            event.notifications.map((notif) => (
              <Chip
                key={notif.id}
                label={notif.name}
                size="small"
                color={notif.status === 1 ? 'success' : 'default'}
                variant="soft"
              />
            ))
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
