'use client';

import type { Theme, SxProps } from '@mui/material/styles';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { OrganizationalStructureDiagram } from '../organizational-structure-diagram';

type Props = { id: string };

export function OrganizationalStructureMapView({ id, sx, ...other }: Props & { sx?: SxProps<Theme> }) {
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
          {
            name: 'Estructura organizacional',
            href: paths.dashboard.architecture.organizationalStructureTable,
          },
          { name: 'Mapa' },
        ]}
        action={
          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
            onClick={() => {
              window.location.href = paths.dashboard.architecture.organizationalStructureTable;
            }}
          >
            Atrás
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
        <OrganizationalStructureDiagram organizationalUnitId={organizationalUnitId} />
      </Box>
    </Container>
  );
}
