'use client';

import type { Theme, SxProps } from '@mui/material/styles';

import React from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ProcessTableDiagram } from '../processes-table-diagram';

type Props = { id: string };

export function ProcessTableMapView({ id, sx, ...other }: Props & { sx?: SxProps<Theme> }) {
  const { t } = useTranslate('architecture');
  const settings = useSettingsContext();
  const processId = id as string;

  return (
    <Container
      maxWidth={settings.state.compactLayout ? 'xl' : false}
      sx={{ display: 'flex', flexDirection: 'column', py: 0, px: { xs: 2, sm: 3, md: 4 }, ...sx }}
      {...other}
    >
      <CustomBreadcrumbs
        heading={t('process.map.title')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: t('process.table.title'), href: paths.dashboard.architecture.processesTable },
          { name: t('process.map.breadcrumb') },
        ]}
        action={
          <Stack direction="row" spacing={1}>
            <Button
              component={RouterLink}
              href={paths.dashboard.architecture.processesRasciMatrix}
              variant="outlined"
              startIcon={<Iconify icon="solar:list-bold" />}
            >
              {t('rasciMatrix.title')}
            </Button>

            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
              onClick={() => { window.location.href = paths.dashboard.architecture.processesTable; }}
            >
              {t('process.table.actions.cancel')}
            </Button>
          </Stack>
        }
        sx={{ mb: 3 }}
      />

      <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', pb: { xs: 8, sm: 10, md: 12 } }}>
        <ProcessTableDiagram processId={processId} />
      </Box>
    </Container>
  );
}
