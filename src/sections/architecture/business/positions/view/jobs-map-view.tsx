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

import { JobsMapDiagram } from '../jobs-map-diagram';

type Props = { id: string };

export function JobsMapView({ id, sx, ...other }: Props & { sx?: SxProps<Theme> }) {
  const { t } = useTranslate('business');
  const settings = useSettingsContext();

  return (
    <Container
      maxWidth={settings.state.compactLayout ? 'xl' : false}
      sx={{ display: 'flex', flexDirection: 'column', py: 0, px: { xs: 2, sm: 3, md: 4 }, ...sx }}
      {...other}
    >
      <CustomBreadcrumbs
        heading={t('positions.title')}
        links={[
          { name: t('positions.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('positions.breadcrumbs.positions'), href: paths.dashboard.architecture.positionsTable },
          { name: t('positions.breadcrumbs.map') },
        ]}
        action={
          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
            onClick={() => {
              window.location.href = paths.dashboard.architecture.positionsTable;
            }}
          >
            {t('positions.back')}
          </Button>
        }
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
        <JobsMapDiagram jobId={String(id)} />
      </Box>
    </Container>
  );
}

