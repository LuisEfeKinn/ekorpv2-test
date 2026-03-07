
'use client';

import type { ActionMeasureNode } from 'src/types/action-measure-chart';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { ActionMeasureChartService } from 'src/services/architecture/action-measure-chart.service';

import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ZoomPanWrapper } from 'src/components/zoom-pan-wrapper/zoom-pan-wrapper';
import { OrganizationalChart } from 'src/components/organizational-chart/organizational-chart';

import { ActionMeasureChartNode } from '../action-measure-chart-node';

// ----------------------------------------------------------------------

export function ActionMeasureMapView() {
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ActionMeasureNode[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await ActionMeasureChartService.getFlow();
        if (Array.isArray(response.data)) {
          setData(response.data);
        }
      } catch (error) {
        console.error('Error loading action measure flow:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  if (data.length === 0) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Mapa de Medidas de Acción"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Arquitectura', href: '' },
            { name: 'Medidas de Acción', href: paths.dashboard.architecture.actionsTable },
            { name: 'Mapa' },
          ]}
          sx={{ mb: 3 }}
        />
        <EmptyContent title="No hay datos disponibles" />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent maxWidth={false}>
      <CustomBreadcrumbs
        heading="Mapa de Medidas de Acción"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Arquitectura', href: '' },
          { name: 'Medidas de Acción', href: paths.dashboard.architecture.actionsTable },
          { name: 'Mapa' },
        ]}
        sx={{ mb: 3 }}
      />

      <Box
        sx={{
          height: '75vh',
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: 'background.neutral',
          border: `1px dashed ${theme.vars.palette.divider}`,
        }}
      >
        <ZoomPanWrapper>
          <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start', pt: 5, px: 3 }}>
            {data.map((rootNode) => (
              <Box key={rootNode.id} sx={{ flexShrink: 0 }}>
                <OrganizationalChart
                  data={rootNode}
                  lineColor={theme.vars.palette.primary.light}
                  nodeItem={(props: ActionMeasureNode) => <ActionMeasureChartNode node={props} />}
                />
              </Box>
            ))}
          </Box>
        </ZoomPanWrapper>
      </Box>
    </DashboardContent>
  );
}
