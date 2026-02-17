
'use client';

import type { JobFlowNode } from 'src/types/job-flow';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { JobFlowService } from 'src/services/architecture/business/job-flow.service';

import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ZoomPanWrapper } from 'src/components/zoom-pan-wrapper/zoom-pan-wrapper';
import { OrganizationalChart } from 'src/components/organizational-chart/organizational-chart';

import { JobFlowChartNode } from '../job-flow-chart-node';

// ----------------------------------------------------------------------

export function JobFlowMapView() {
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<JobFlowNode | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await JobFlowService.getFlow();
        if (Array.isArray(response.data) && response.data.length > 0) {
          setData(response.data[0]);
        }
      } catch (error) {
        console.error('Error loading job flow:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!data) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Organigrama de Cargos"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Arquitectura', href: '' },
            { name: 'Cargos', href: paths.dashboard.architecture.positionsTable },
            { name: 'Organigrama' },
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
        heading="Organigrama de Cargos"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Arquitectura', href: '' },
          { name: 'Cargos', href: paths.dashboard.architecture.positionsTable },
          { name: 'Organigrama' },
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
          <Box sx={{ pt: 5 }}>
            <OrganizationalChart
              data={data}
              lineColor={theme.vars.palette.primary.light}
              nodeItem={(props: JobFlowNode) => <JobFlowChartNode node={props} />}
            />
          </Box>
        </ZoomPanWrapper>
      </Box>
    </DashboardContent>
  );
}
