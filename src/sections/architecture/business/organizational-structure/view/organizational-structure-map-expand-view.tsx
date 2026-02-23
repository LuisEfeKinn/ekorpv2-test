'use client';

import type { Theme, SxProps } from '@mui/material/styles';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { OrganizationalStructureExpandedDiagram } from '../organizational-structure-expanded-diagram';

type Props = { id: string; nodeId: string };

export function OrganizationalStructureMapExpandView({ id, nodeId, sx, ...other }: Props & { sx?: SxProps<Theme> }) {
  const settings = useSettingsContext();
  const organizationalUnitId = id as string;

  return (
    <Container
      maxWidth={settings.state.compactLayout ? 'xl' : false}
      sx={{ display: 'flex', flexDirection: 'column', py: 0, px: { xs: 2, sm: 3, md: 4 }, ...sx }}
      {...other}
    >
      <CustomBreadcrumbs
        heading="Mapa de estructura organizacional"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Estructura organizacional', href: paths.dashboard.architecture.organizationalStructureTable },
          { name: 'Mapa', href: paths.dashboard.architecture.organizationalStructureTableMap(String(organizationalUnitId)) },
          { name: `Expandir: ${nodeId}` },
        ]}
        action={
          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
            onClick={() => {
              window.location.href = paths.dashboard.architecture.organizationalStructureTableMap(String(organizationalUnitId));
            }}
          >
            Atrás
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
