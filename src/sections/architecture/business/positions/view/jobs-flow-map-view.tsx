
'use client';

import type { JobFlowNode } from 'src/types/job-flow';

import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { JobFlowService } from 'src/services/architecture/business/job-flow.service';

import { Iconify } from 'src/components/iconify';
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
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<JobFlowNode[]>([]);

  const focusedNode = history.length > 0 ? history[history.length - 1] : null;

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

  const handleToggleCollapse = useCallback((nodeId: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleNodeDoubleClick = useCallback((node: JobFlowNode) => {
    setHistory((prev) => [...prev, node]);
    // Expand the node when focused to ensure children are visible
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(String(node.id))) {
        next.delete(String(node.id));
      }
      return next;
    });
  }, []);

  const handleGoBack = useCallback(() => {
    setHistory((prev) => prev.slice(0, -1));
  }, []);

  const handleResetView = useCallback(() => {
    setHistory([]);
  }, []);

  const visibleData = useMemo(() => {
    if (!data) return null;

    const applyCollapsed = (nodes: JobFlowNode[]): JobFlowNode[] =>
      nodes.map((node) => ({
        ...node,
        children: collapsedNodes.has(String(node.id)) ? [] : applyCollapsed(node.children ?? []),
      }));

    if (focusedNode) {
      return applyCollapsed([focusedNode])[0];
    }

    return applyCollapsed([data])[0];
  }, [collapsedNodes, data, focusedNode]);

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
          { name: 'Organigrama', onClick: history.length > 0 ? handleResetView : undefined },
          ...history.map((node, index) => ({
            name: node.data.name,
            onClick:
              index < history.length - 1
                ? () => setHistory((prev) => prev.slice(0, index + 1))
                : undefined,
          })),
        ]}
        action={
          history.length > 0 ? (
            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
              onClick={handleGoBack}
            >
              Atrás
            </Button>
          ) : undefined
        }
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
            {visibleData && (
              <OrganizationalChart
                data={visibleData}
                lineColor={theme.vars.palette.primary.light}
                nodeItem={(props: JobFlowNode) => (
                  <JobFlowChartNode
                    node={props}
                    isCollapsed={collapsedNodes.has(String(props.id))}
                    onToggleCollapse={() => handleToggleCollapse(String(props.id))}
                    onDoubleClick={() => handleNodeDoubleClick(props)}
                  />
                )}
              />
            )}
          </Box>
        </ZoomPanWrapper>
      </Box>
    </DashboardContent>
  );
}
