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

import { OrganizationalStructureExpandedDiagram } from '../organizational-structure-expanded-diagram';

type Props = { id: string; nodeId: string };

export function OrganizationalStructureMapExpandView({ id, nodeId, sx, ...other }: Props & { sx?: SxProps<Theme> }) {
  const { t } = useTranslate('organization');
  const settings = useSettingsContext();
  const organizationalUnitId = id as string;

  return (
    <Container
      maxWidth={settings.state.compactLayout ? 'xl' : false}
      sx={{ display: 'flex', flexDirection: 'column', py: 0, px: { xs: 2, sm: 3, md: 4 }, ...sx }}
      {...other}
    >
      <CustomBreadcrumbs
        heading={t('organization.view.mapTitle')}
        links={[
          { name: t('organization.view.dashboard'), href: paths.dashboard.root },
          { name: t('organization.view.list'), href: paths.dashboard.architecture.organizationalStructureTable },
          { name: t('organization.view.map'), href: paths.dashboard.architecture.organizationalStructureTableMap(String(organizationalUnitId)) },
          { name: nodeId },
        ]}
        action={
          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
            onClick={() => {
              window.location.href = paths.dashboard.architecture.organizationalStructureTable;
            }}
          >
            {t('organization.view.back')}
          </Button>
        }
        sx={{ mb: 3 }}
      />

      <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', pb: { xs: 8, sm: 10, md: 12 } }}>
        <OrganizationalStructureExpandedDiagram organizationalUnitId={organizationalUnitId} nodeId={nodeId} />
      </Box>
    </Container>
  );
}
