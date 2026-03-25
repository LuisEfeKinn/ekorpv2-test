'use client';

import type { CardProps } from '@mui/material/Card';
import type {
  ElementDragType,
  BaseEventPayload,
} from '@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types';
import type { IconifyName } from 'src/components/iconify/register-icons';

import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { preserveOffsetOnSource } from '@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import {
  draggable,
  monitorForElements,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { alpha , useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type CatalogConfig = {
  color: string;
  descriptionKey: string;
  icon: IconifyName;
  id: string;
  labelKey: string;
  path: string;
};

type CatalogId = (typeof CATALOGS_CONFIG)[number]['id'];

type CatalogItem = {
  color: string;
  description: string;
  icon: IconifyName;
  id: CatalogId;
  name: string;
  path: string;
};

const CATALOGS_ORDER_STORAGE_KEY = 'ekorp:architecture:catalogs:order';

const CATALOG_DND_ITEM_KEY = Symbol('catalog-dnd-item');

type CatalogDndItemData = {
  [CATALOG_DND_ITEM_KEY]: true;
  id: CatalogId;
};

function getCatalogDndItemData(data: Omit<CatalogDndItemData, typeof CATALOG_DND_ITEM_KEY>) {
  return { [CATALOG_DND_ITEM_KEY]: true, ...data } satisfies CatalogDndItemData;
}

function isCatalogDndItemData(value: Record<string | symbol, unknown>): value is CatalogDndItemData {
  return Boolean(value[CATALOG_DND_ITEM_KEY]);
}

function parseJsonStringArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

function moveItem<T>(list: readonly T[], fromIndex: number, toIndex: number): T[] {
  const next = [...list];
  const [moved] = next.splice(fromIndex, 1);
  if (moved === undefined) return next;
  next.splice(toIndex, 0, moved);
  return next;
}

const CATALOGS_CONFIG = [
  {
    id: 'actionTypes',
    labelKey: 'main.items.actionTypes.label',
    descriptionKey: 'main.items.actionTypes.description',
    icon: 'solar:play-circle-bold',
    path: paths.dashboard.architecture.catalogs.actionType,
    color: '#6366F1',
  },
  {
    id: 'competenciesClasses',
    labelKey: 'main.items.competenciesClasses.label',
    descriptionKey: 'main.items.competenciesClasses.description',
    icon: 'solar:cup-star-bold',
    path: paths.dashboard.architecture.catalogs.competenciesClasses,
    color: '#F59E0B',
  },
  {
    id: 'competencies',
    labelKey: 'main.items.competencies.label',
    descriptionKey: 'main.items.competencies.description',
    icon: 'solar:user-rounded-bold',
    path: paths.dashboard.architecture.catalogs.competencies,
    color: '#8B5CF6',
  },
  {
    id: 'dataTypes',
    labelKey: 'main.items.dataTypes.label',
    descriptionKey: 'main.items.dataTypes.description',
    icon: 'solar:file-text-bold',
    path: paths.dashboard.architecture.catalogs.dataTypes,
    color: '#3B82F6',
  },
  {
    id: 'jobTypes',
    labelKey: 'main.items.jobTypes.label',
    descriptionKey: 'main.items.jobTypes.description',
    icon: 'solar:case-minimalistic-bold',
    path: paths.dashboard.architecture.catalogs.jobTypes,
    color: '#EC4899',
  },
  {
    id: 'measureActionTypes',
    labelKey: 'main.items.measureActionTypes.label',
    descriptionKey: 'main.items.measureActionTypes.description',
    icon: 'solar:chart-square-outline',
    path: paths.dashboard.architecture.catalogs.measureActionTypes,
    color: '#10B981',
  },
  {
    id: 'objectiveTypes',
    labelKey: 'main.items.objectiveTypes.label',
    descriptionKey: 'main.items.objectiveTypes.description',
    icon: 'solar:flag-bold',
    path: paths.dashboard.architecture.catalogs.objectiveTypes,
    color: '#EF4444',
  },
  {
    id: 'organizationalUnitTypes',
    labelKey: 'main.items.organizationalUnitTypes.label',
    descriptionKey: 'main.items.organizationalUnitTypes.description',
    icon: 'solar:users-group-rounded-bold',
    path: paths.dashboard.architecture.catalogs.organizationalUnitTypes,
    color: '#14B8A6',
  },
  {
    id: 'processTypes',
    labelKey: 'main.items.processTypes.label',
    descriptionKey: 'main.items.processTypes.description',
    icon: 'solar:restart-bold',
    path: paths.dashboard.architecture.catalogs.processTypes,
    color: '#06B6D4',
  },
  {
    id: 'providers',
    labelKey: 'main.items.providers.label',
    descriptionKey: 'main.items.providers.description',
    icon: 'solar:users-group-rounded-bold',
    path: paths.dashboard.architecture.catalogs.providers,
    color: '#6366F1',
  },
  {
    id: 'riskTypes',
    labelKey: 'main.items.riskTypes.label',
    descriptionKey: 'main.items.riskTypes.description',
    icon: 'solar:danger-triangle-bold',
    path: paths.dashboard.architecture.catalogs.riskTypes,
    color: '#F97316',
  },
  {
    id: 'systemTypes',
    labelKey: 'main.items.systemTypes.label',
    descriptionKey: 'main.items.systemTypes.description',
    icon: 'solar:monitor-bold',
    path: paths.dashboard.architecture.catalogs.systemTypes,
    color: '#8B5CF6',
  },
  {
    id: 'technologyTypes',
    labelKey: 'main.items.technologyTypes.label',
    descriptionKey: 'main.items.technologyTypes.description',
    icon: 'solar:settings-bold',
    path: paths.dashboard.architecture.catalogs.technologyTypes,
    color: '#0EA5E9',
  },
  {
    id: 'toolTypes',
    labelKey: 'main.items.toolTypes.label',
    descriptionKey: 'main.items.toolTypes.description',
    icon: 'solar:box-minimalistic-bold',
    path: paths.dashboard.architecture.catalogs.toolTypes,
    color: '#84CC16',
  },
  {
    id: 'topics',
    labelKey: 'main.items.topics.label',
    descriptionKey: 'main.items.topics.description',
    icon: 'solar:bill-list-bold',
    path: paths.dashboard.architecture.catalogs.topics,
    color: '#A855F7',
  },
  {
    id: 'domains',
    labelKey: 'main.items.domains.label',
    descriptionKey: 'main.items.domains.description',
    icon: 'solar:map-point-bold',
    path: paths.dashboard.architecture.catalogs.domains,
    color: '#EC4899',
  },
  {
    id: 'dateControls',
    labelKey: 'main.items.dateControls.label',
    descriptionKey: 'main.items.dateControls.description',
    icon: 'solar:calendar-date-bold',
    path: paths.dashboard.architecture.catalogs.dateControls,
    color: '#8f8829ff',
  },
] as const satisfies readonly CatalogConfig[];

// ----------------------------------------------------------------------

export function CatalogsView() {
  const { t } = useTranslate('catalogs');
  const catalogById = useMemo(() => {
    const map = new Map<CatalogId, (typeof CATALOGS_CONFIG)[number]>();
    CATALOGS_CONFIG.forEach((item) => {
      map.set(item.id, item);
    });
    return map;
  }, []);

  const defaultOrder = useMemo(() => CATALOGS_CONFIG.map((item) => item.id), []);

  const [order, setOrder] = useState<CatalogId[]>(defaultOrder);

  const persistOrder = useCallback((nextOrder: readonly CatalogId[]) => {
    window.localStorage.setItem(CATALOGS_ORDER_STORAGE_KEY, JSON.stringify(nextOrder));
  }, []);

  const handleResetOrder = useCallback(() => {
    window.localStorage.removeItem(CATALOGS_ORDER_STORAGE_KEY);
    setOrder(defaultOrder);
  }, [defaultOrder]);

  const handleItemDrop = useCallback(
    ({ source, location }: BaseEventPayload<ElementDragType>) => {
      const dropTarget = location.current.dropTargets[0];
      if (!dropTarget) return;

      const sourceData = source.data;
      const targetData = dropTarget.data;
      if (!isCatalogDndItemData(sourceData) || !isCatalogDndItemData(targetData)) return;

      const sourceIndex = order.indexOf(sourceData.id);
      const targetIndex = order.indexOf(targetData.id);
      if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return;

      const nextOrder = moveItem(order, sourceIndex, targetIndex);
      setOrder(nextOrder);
      persistOrder(nextOrder);
    },
    [order, persistOrder]
  );

  useEffect(() => {
    const itemMonitor = monitorForElements({
      canMonitor: ({ source }) => isCatalogDndItemData(source.data),
      onDrop: handleItemDrop,
    });

    return itemMonitor;
  }, [handleItemDrop]);

  useEffect(() => {
    const saved = parseJsonStringArray(window.localStorage.getItem(CATALOGS_ORDER_STORAGE_KEY));
    if (saved.length === 0) return;

    const validIds = new Set<string>(defaultOrder);

    const savedUniqueValid = Array.from(new Set(saved)).filter((id) => validIds.has(id));
    const savedIds = savedUniqueValid as CatalogId[];

    const savedSet = new Set(savedIds);
    const remainingIds = defaultOrder.filter((id) => !savedSet.has(id));

    const nextOrder = [...savedIds, ...remainingIds];
    setOrder(nextOrder);
  }, [defaultOrder]);

  const catalogs = useMemo<CatalogItem[]>(() => order
      .map((id) => catalogById.get(id))
      .filter((item): item is (typeof CATALOGS_CONFIG)[number] => Boolean(item))
      .map((catalog) => ({
        id: catalog.id,
        path: catalog.path,
        color: catalog.color,
        icon: catalog.icon,
        name: t(catalog.labelKey),
        description: t(catalog.descriptionKey),
      })), [catalogById, order, t]);

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" sx={{ mb: 1 }}>
              {t('main.catalogsManagement')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('main.subtitle')}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.75, color: 'text.disabled' }}>
              {t('main.actions.reorderHint')}
            </Typography>
          </Box>

          <Button
            color="inherit"
            onClick={handleResetOrder}
            startIcon={<Iconify icon="ic:round-power-settings-new" />}
            sx={{ flexShrink: 0, mt: 0.5 }}
          >
            {t('main.actions.resetOrder')}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {catalogs.map((catalog) => (
          <Grid key={catalog.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <CatalogCard catalog={catalog} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

// ----------------------------------------------------------------------

type CatalogCardProps = CardProps & {
  catalog: CatalogItem;
};

function CatalogCard({ catalog, sx, ...other }: CatalogCardProps) {
  const { t } = useTranslate('catalogs');
  const theme = useTheme();

  const cardRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLButtonElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    const cardEl = cardRef.current;
    const dragHandleEl = dragHandleRef.current;
    if (!cardEl || !dragHandleEl) return undefined;

    const dragItem = draggable({
      element: cardEl,
      dragHandle: dragHandleEl,
      getInitialData: () => getCatalogDndItemData({ id: catalog.id }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
      onGenerateDragPreview: ({ location, nativeSetDragImage }) => {
        setCustomNativeDragPreview({
          nativeSetDragImage,
          getOffset: preserveOffsetOnSource({
            element: dragHandleEl,
            input: location.current.input,
          }),
          render: ({ container }) => {
            const rect = cardEl.getBoundingClientRect();
            const previewEl = cardEl.cloneNode(true);
            if (!(previewEl instanceof HTMLElement)) return;

            Object.assign(previewEl.style, {
              width: `${rect.width}px`,
              height: `${rect.height}px`,
              backgroundColor: theme.palette.background.paper,
              pointerEvents: 'none',
            });

            container.appendChild(previewEl);
          },
        });
      },
    });

    const dropTarget = dropTargetForElements({
      element: cardEl,
      getData: () => getCatalogDndItemData({ id: catalog.id }),
      getIsSticky: () => true,
      canDrop: ({ source }) => source.element !== cardEl && isCatalogDndItemData(source.data),
      onDragEnter: () => setIsOver(true),
      onDragLeave: () => setIsOver(false),
      onDrop: () => setIsOver(false),
    });

    return combine(dragItem, dropTarget);
  }, [catalog.id, theme.palette.background.paper]);

  return (
    <Card
      ref={cardRef}
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: isOver ? alpha(catalog.color, 0.55) : 'divider',
        opacity: isDragging ? 0.6 : 1,
        transition: (muiTheme) =>
          muiTheme.transitions.create(['all'], {
            duration: muiTheme.transitions.duration.standard,
            easing: muiTheme.transitions.easing.easeInOut,
          }),
        '&:hover': {
          boxShadow: (muiTheme) => muiTheme.customShadows.z24,
          transform: 'translateY(-8px) scale(1.02)',
          borderColor: alpha(catalog.color, 0.5),
          '& .catalog-icon-box': {
            transform: 'scale(1.1) rotate(5deg)',
            bgcolor: catalog.color,
            '& svg': {
              color: '#fff',
            },
          },
          '& .catalog-arrow': {
            transform: 'translateX(4px)',
            opacity: 1,
          },
          '& .catalog-overlay': {
            opacity: 1,
          },
        },
        ...sx,
      }}
      {...other}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 2,
        }}
      >
        <Tooltip title={t('main.actions.reorderHint')}>
          <IconButton
            ref={dragHandleRef}
            size="small"
            sx={{
              bgcolor: alpha(theme.palette.background.paper, 0.72),
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                bgcolor: theme.palette.background.paper,
              },
            }}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            <Iconify icon="custom:drag-dots-fill" width={18} />
          </IconButton>
        </Tooltip>
      </Box>

      <Box
        className="catalog-overlay"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, ${alpha(catalog.color, 0.05)} 0%, ${alpha(catalog.color, 0.02)} 100%)`,
          opacity: 0,
          transition: (muiTheme) =>
            muiTheme.transitions.create(['opacity'], {
              duration: muiTheme.transitions.duration.standard,
            }),
          pointerEvents: 'none',
        }}
      />

      <Box
        component={RouterLink}
        href={catalog.path}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          p: 3,
          position: 'relative',
          textDecoration: 'none',
          color: 'inherit',
        }}
      >
        <Box
          className="catalog-icon-box"
          sx={{
            width: 64,
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 2.5,
            bgcolor: alpha(catalog.color, 0.08),
            mb: 2.5,
            transition: (muiTheme) =>
              muiTheme.transitions.create(['all'], {
                duration: muiTheme.transitions.duration.standard,
                easing: muiTheme.transitions.easing.easeInOut,
              }),
            '& svg': {
              color: catalog.color,
              transition: (muiTheme) =>
                muiTheme.transitions.create(['color'], {
                  duration: muiTheme.transitions.duration.standard,
                }),
            },
          }}
        >
          <Iconify icon={catalog.icon} width={36} />
        </Box>

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography
            variant="h6"
            sx={{
              mb: 1,
              fontWeight: 600,
              lineHeight: 1.3,
            }}
          >
            {catalog.name}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              lineHeight: 1.6,
              mb: 2,
              flex: 1,
            }}
          >
            {catalog.description}
          </Typography>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mt: 'auto',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: catalog.color,
              }}
            >
              {t('main.viewAction')}
            </Typography>
            <Iconify
              icon="solar:forward-bold"
              width={18}
              className="catalog-arrow"
              sx={{
                color: catalog.color,
                transition: (muiTheme) =>
                  muiTheme.transitions.create(['transform', 'opacity'], {
                    duration: muiTheme.transitions.duration.shorter,
                  }),
                opacity: 0.7,
              }}
            />
          </Box>
        </Box>
      </Box>
    </Card>
  );
}
