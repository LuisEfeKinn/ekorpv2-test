'use client';

import type { Theme, SxProps } from '@mui/material/styles';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ProcessesFlow } from '../processes-flow';

// ----------------------------------------------------------------------

type ProcessesFlowViewProps = {
  sx?: SxProps<Theme>;
};

// ----------------------------------------------------------------------

export function ProcessesFlowView({ sx }: ProcessesFlowViewProps) {
  const { t } = useTranslate('architecture');

  return (
    <Container maxWidth="xl">
      <Stack spacing={3}>
        <CustomBreadcrumbs
          heading={t('process.table.title')}
          links={[
            {
              name: t('process.table.breadcrumbs.dashboard'),
              href: paths.dashboard.root,
            },
            {
              name: t('process.table.title'),
              href: paths.dashboard.architecture.processesTable,
            },
            {
              name: t('process.map.title'),
            },
          ]}
          action={
            <Button
              href={paths.dashboard.architecture.processesTable}
              variant="contained"
              startIcon={<Iconify icon="solar:list-bold" />}
            >
              {t('process.table.title')}
            </Button>
          }
          sx={{
            mb: { xs: 2, md: 3 },
          }}
        />

        <ProcessesFlow sx={sx} />
      </Stack>
    </Container>
  );
}
