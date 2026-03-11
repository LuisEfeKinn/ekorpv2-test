'use client';

import type { Theme, SxProps } from '@mui/material/styles';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { alpha } from '@mui/material/styles';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { InfrastructureDiagramFlow } from '../infrastructure-diagram-flow';

// ----------------------------------------------------------------------

type InfrastructureDiagramViewProps = {
  sx?: SxProps<Theme>;
};

// ----------------------------------------------------------------------

export function InfrastructureDiagramView({ sx }: InfrastructureDiagramViewProps) {
  const { t } = useTranslate('architecture');
  const [filterType, setFilterType] = useState<'domains' | 'types'>('domains');

  const handleToggleFilterType = () => {
    setFilterType((prev) => (prev === 'domains' ? 'types' : 'domains'));
  };

  return (
    <Container maxWidth="xl">
      <Stack spacing={3}>
        {/* Breadcrumbs con Switch */}
        <CustomBreadcrumbs
          heading={t('infrastructure.diagram.title')}
          links={[
            {
              name: t('infrastructure.table.breadcrumbs.dashboard'),
              href: paths.dashboard.root,
            },
            {
              name: t('infrastructure.diagram.title'),
            },
          ]}
          action={
            <Stack direction="row" spacing={2} alignItems="center">
              {/* Switch personalizado */}
              <Box
                onClick={handleToggleFilterType}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  position: 'relative',
                  width: 180,
                  height: 40,
                  borderRadius: '20px',
                  bgcolor: (theme) => alpha(theme.palette.grey[500], 0.12),
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.grey[500], 0.16),
                    boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
                  },
                }}
              >
                {/* Slider */}
                <Box
                  sx={{
                    position: 'absolute',
                    width: 90,
                    height: 32,
                    borderRadius: '16px',
                    bgcolor: 'primary.main',
                    boxShadow: (theme) => `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: filterType === 'domains' ? 'translateX(4px)' : 'translateX(86px)',
                  }}
                />

                {/* Labels */}
                <Stack
                  direction="row"
                  sx={{
                    width: '100%',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: filterType === 'domains' ? 'primary.contrastText' : 'text.secondary',
                        transition: 'color 0.3s ease',
                        fontSize: '0.75rem',
                      }}
                    >
                      {t('common.filters.domains')}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: filterType === 'types' ? 'primary.contrastText' : 'text.secondary',
                        transition: 'color 0.3s ease',
                        fontSize: '0.75rem',
                      }}
                    >
                      {t('common.filters.types')}
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <Button
                href={paths.dashboard.architecture.infrastructureTable}
                variant="contained"
                startIcon={<Iconify icon="solar:eye-bold" />}
              >
                {t('infrastructure.diagram.actions.viewTable')}
              </Button>
              <Button
                href={paths.dashboard.architecture.infrastructureTimeline}
                variant="contained"
                startIcon={<Iconify icon="solar:eye-bold" />}
              >
                {t('infrastructure.diagram.actions.viewTimeline')}
              </Button>
            </Stack>
          }
          sx={{
            mb: { xs: 2, md: 3 },
          }}
        />

        {/* Diagrama de flujo */}
        <InfrastructureDiagramFlow
          filterType={filterType}
          sx={sx}
        />
      </Stack>
    </Container>
  );
}