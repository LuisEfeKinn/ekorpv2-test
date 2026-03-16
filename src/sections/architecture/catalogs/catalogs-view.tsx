'use client';

import type { CardProps } from '@mui/material/Card';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import { alpha } from '@mui/material/styles';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type CatalogItem = {
  color: string;
  description: string;
  icon: string;
  name: string;
  path: string;
};

// ----------------------------------------------------------------------

export function CatalogsView() {
  const { t } = useTranslate('catalogs');
  const CATALOGS_DATA: CatalogItem[] = [
    {
      name: t('main.items.actionTypes.label'),
      description: t('main.items.actionTypes.description'),
      icon: 'solar:play-circle-bold',
      path: paths.dashboard.architecture.catalogs.actionType,
      color: '#6366F1', // Indigo
    },
    {
      name: t('main.items.competenciesClasses.label'),
      description: t('main.items.competenciesClasses.description'),
      icon: 'solar:cup-star-bold',
      path: paths.dashboard.architecture.catalogs.competenciesClasses,
      color: '#F59E0B', // Amber
    },
    {
      name: t('main.items.competencies.label'),
      description: t('main.items.competencies.description'),
      icon: 'solar:user-rounded-bold',
      path: paths.dashboard.architecture.catalogs.competencies,
      color: '#8B5CF6', // Purple
    },
    {
      name: t('main.items.dataTypes.label'),
      description: t('main.items.dataTypes.description'),
      icon: 'solar:file-text-bold',
      path: paths.dashboard.architecture.catalogs.dataTypes,
      color: '#3B82F6', // Blue
    },
    {
      name: t('main.items.jobTypes.label'),
      description: t('main.items.jobTypes.description'),
      icon: 'solar:case-minimalistic-bold',
      path: paths.dashboard.architecture.catalogs.jobTypes,
      color: '#EC4899', // Pink
    },
    {
      name: t('main.items.measureActionTypes.label'),
      description: t('main.items.measureActionTypes.description'),
      icon: 'solar:chart-square-outline',
      path: paths.dashboard.architecture.catalogs.measureActionTypes,
      color: '#10B981', // Emerald
    },
    {
      name: t('main.items.objectiveTypes.label'),
      description: t('main.items.objectiveTypes.description'),
      icon: 'solar:flag-bold',
      path: paths.dashboard.architecture.catalogs.objectiveTypes,
      color: '#EF4444', // Red
    },
    {
      name: t('main.items.organizationalUnitTypes.label'),
      description: t('main.items.organizationalUnitTypes.description'),
      icon: 'solar:users-group-rounded-bold',
      path: paths.dashboard.architecture.catalogs.organizationalUnitTypes,
      color: '#14B8A6', // Teal
    },
    {
      name: t('main.items.processTypes.label'),
      description: t('main.items.processTypes.description'),
      icon: 'solar:restart-bold',
      path: paths.dashboard.architecture.catalogs.processTypes,
      color: '#06B6D4', // Cyan
    },
    {
      name: t('main.items.providers.label'),
      description: t('main.items.providers.description'),
      icon: 'solar:users-group-rounded-bold',
      path: paths.dashboard.architecture.catalogs.providers,
      color: '#6366F1', // Indigo
    },
    {
      name: t('main.items.riskTypes.label'),
      description: t('main.items.riskTypes.description'),
      icon: 'solar:danger-triangle-bold',
      path: paths.dashboard.architecture.catalogs.riskTypes,
      color: '#F97316', // Orange
    },
    {
      name: t('main.items.systemTypes.label'),
      description: t('main.items.systemTypes.description'),
      icon: 'solar:monitor-bold',
      path: paths.dashboard.architecture.catalogs.systemTypes,
      color: '#8B5CF6', // Purple
    },
    {
      name: t('main.items.technologyTypes.label'),
      description: t('main.items.technologyTypes.description'),
      icon: 'solar:settings-bold',
      path: paths.dashboard.architecture.catalogs.technologyTypes,
      color: '#0EA5E9', // Sky
    },
    {
      name: t('main.items.toolTypes.label'),
      description: t('main.items.toolTypes.description'),
      icon: 'solar:box-minimalistic-bold',
      path: paths.dashboard.architecture.catalogs.toolTypes,
      color: '#84CC16', // Lime
    },
    {
      name: t('main.items.topics.label'),
      description: t('main.items.topics.description'),
      icon: 'solar:bill-list-bold',
      path: paths.dashboard.architecture.catalogs.topics,
      color: '#A855F7', // Purple
    },
    {
      name: t('main.items.domains.label'),
      description: t('main.items.domains.description'),
      icon: 'solar:map-point-bold',
      path: paths.dashboard.architecture.catalogs.domains,
      color: '#EC4899', // Pink
    },
        {
      name: t('main.items.dateControls.label'),
      description: t('main.items.dateControls.description'),
      icon: 'solar:calendar-date-bold',
      path: paths.dashboard.architecture.catalogs.dateControls,
      color: '#8f8829ff', // Yellow
    },
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          {t('main.catalogsManagement')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('main.subtitle')}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {CATALOGS_DATA.map((catalog) => (
          <Grid key={catalog.path} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
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
  return (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        transition: (theme) =>
          theme.transitions.create(['all'], {
            duration: theme.transitions.duration.standard,
            easing: theme.transitions.easing.easeInOut,
          }),
        '&:hover': {
          boxShadow: (theme) => theme.customShadows.z24,
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
        className="catalog-overlay"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, ${alpha(catalog.color, 0.05)} 0%, ${alpha(catalog.color, 0.02)} 100%)`,
          opacity: 0,
          transition: (theme) =>
            theme.transitions.create(['opacity'], {
              duration: theme.transitions.duration.standard,
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
            transition: (theme) =>
              theme.transitions.create(['all'], {
                duration: theme.transitions.duration.standard,
                easing: theme.transitions.easing.easeInOut,
              }),
            '& svg': {
              color: catalog.color,
              transition: (theme) =>
                theme.transitions.create(['color'], {
                  duration: theme.transitions.duration.standard,
                }),
            },
          }}
        >
          <Iconify icon={catalog.icon as any} width={36} />
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
                transition: (theme) =>
                  theme.transitions.create(['transform', 'opacity'], {
                    duration: theme.transitions.duration.shorter,
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
