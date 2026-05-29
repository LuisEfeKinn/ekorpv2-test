'use client';

import type { Theme, SxProps } from '@mui/material/styles';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';

import { useSettingsContext } from 'src/components/settings';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ApplicationTableDiagram } from '../application-table-diagram';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function ApplicationTableMapView({ id, sx, ...other }: Props & { sx?: SxProps<Theme> }) {
  const { t } = useTranslate('architecture');
  const settings = useSettingsContext();

  const applicationId = id as string;

  return (
    <Container
      maxWidth={settings.state.compactLayout ? 'xl' : false}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        py: 0,
        px: { xs: 2, sm: 3, md: 4 },
        ...sx,
      }}
      {...other}
    >
      <CustomBreadcrumbs
        heading={t('application.map.title')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: t('application.diagram.title'), href: paths.dashboard.architecture.applicationsDiagram },
          { name: t('application.table.title'), href: paths.dashboard.architecture.applicationsTable },
          { name: t('application.map.title') },
        ]}
        sx={{ mb: 3 }}
      />

      <Box
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pb: { xs: 8, sm: 10, md: 12 },
        }}
      >
        <ApplicationTableDiagram applicationId={applicationId} />
      </Box>
    </Container>
  );
}
