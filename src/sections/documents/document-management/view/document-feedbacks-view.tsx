'use client';

import type { Theme, SxProps } from '@mui/material/styles';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { DocumentMapFeedbacksDiagramContainer } from '../document-map-feedbacks-container';

type Props = { id: string };

export function DocumentFeedbacksView({ id, sx, ...other }: Props & { sx?: SxProps<Theme> }) {
  const { t } = useTranslate('documents');
  const settings = useSettingsContext();

  return (
    <Container
      maxWidth={settings.state.compactLayout ? 'xl' : false}
      sx={{ display: 'flex', flexDirection: 'column', py: 0, px: { xs: 2, sm: 3, md: 4 }, ...sx }}
      {...other}
    >
      <CustomBreadcrumbs
        heading={t('documentManagement.feedbacks.title')}
        links={[
          { name: t('documentManagement.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('documentManagement.breadcrumbs.documents') },
          { name: t('documentManagement.title'), href: paths.dashboard.documents.documentManagement },
          { name: t('documentManagement.feedbacks.title') },
        ]}
        action={
          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
            onClick={() => {
              window.location.href = paths.dashboard.documents.documentManagement;
            }}
          >
            {t('documentManagement.feedbacks.actions.back')}
          </Button>
        }
        sx={{ mb: 3 }}
      />

      <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', pb: { xs: 8, sm: 10, md: 12 } }}>
        <DocumentMapFeedbacksDiagramContainer documentId={id} />
      </Box>
    </Container>
  );
}
