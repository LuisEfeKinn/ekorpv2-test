'use client';

import type { Theme, SxProps } from '@mui/material/styles';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';

import { useSettingsContext } from 'src/components/settings';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { DocumentManagementMapExpandedDiagram } from '../document-management-map-expanded-diagram';

type Props = { id: string; nodeId: string };

export function DocumentManagementMapExpandView({ id, nodeId, sx, ...other }: Props & { sx?: SxProps<Theme> }) {
  const { t } = useTranslate('documents');
  const settings = useSettingsContext();

  return (
    <Container
      maxWidth={settings.state.compactLayout ? 'xl' : false}
      sx={{ display: 'flex', flexDirection: 'column', py: 0, px: { xs: 2, sm: 3, md: 4 }, ...sx }}
      {...other}
    >
      <CustomBreadcrumbs
        heading={t('documentManagement.map.title')}
        links={[
          { name: t('documentManagement.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('documentManagement.breadcrumbs.documents') },
          { name: t('documentManagement.title'), href: paths.dashboard.documents.documentManagement },
          { name: t('documentManagement.map.title'), href: paths.dashboard.documents.documentManagementMap(String(id)) },
          { name: nodeId },
        ]}
        sx={{ mb: 3 }}
      />

      <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', pb: { xs: 8, sm: 10, md: 12 } }}>
        <DocumentManagementMapExpandedDiagram documentId={id} nodeId={nodeId} />
      </Box>
    </Container>
  );
}

