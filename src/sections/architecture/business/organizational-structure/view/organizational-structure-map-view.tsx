'use client';

import type { Theme, SxProps } from '@mui/material/styles';
import type { OrganizationalUnitFlowNode } from 'src/services/organization/organizationalUnit.service';

import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import { useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { GetOrganizationalUnitFlowService } from 'src/services/organization/organizationalUnit.service';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { useSettingsContext } from 'src/components/settings';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ZoomPanWrapper } from 'src/components/zoom-pan-wrapper/zoom-pan-wrapper';
import { OrganizationalChart } from 'src/components/organizational-chart/organizational-chart';

import { OrganizationalStructureDiagram } from '../organizational-structure-diagram';
import {
  OrganizationalUnitChartNode,
  type OrganizationalUnitChartNodeProps,
} from '../organizational-structure-chart-node';

type Props = { id?: string };

type FlowResponse = { data?: unknown };

const normalizeFlowData = (raw: unknown): OrganizationalUnitFlowNode[] => {
  if (Array.isArray(raw)) {
    return raw.filter((item) => item && typeof item === 'object') as OrganizationalUnitFlowNode[];
  }
  if (raw && typeof raw === 'object' && Array.isArray((raw as FlowResponse).data)) {
    return ((raw as FlowResponse).data as OrganizationalUnitFlowNode[]).filter(
      (item) => item && typeof item === 'object'
    );
  }
  return [];
};

const normalizeFlowChildren = (nodes: OrganizationalUnitFlowNode[]): OrganizationalUnitChartNodeProps[] =>
  nodes
    .filter((node) => node && typeof node === 'object')
    .map((node) => ({
      ...node,
      name: node.data?.name || node.label || '',
      children: normalizeFlowChildren(node.children ?? []),
      hasChildren: (node.children?.length ?? 0) > 0,
    }));
export function OrganizationalStructureMapView({ id, sx, ...other }: Props & { sx?: SxProps<Theme> }) {
  const { t } = useTranslate('organization');
  const settings = useSettingsContext();
  const organizationalUnitId = id ?? '';
  const hasOrganizationalUnitId = Boolean(id);
  const theme = useTheme();
  
  const divider = theme.palette?.divider || '#000000';
  const primaryLight = theme.palette?.primary?.light || '#000000';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OrganizationalUnitChartNodeProps[]>([]);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<OrganizationalUnitChartNodeProps[]>([]);

  const focusedNode = history.length > 0 ? history[history.length - 1] : null;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await GetOrganizationalUnitFlowService();
      const list = normalizeFlowChildren(normalizeFlowData(response?.data));
      setData(list);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasOrganizationalUnitId) {
      setLoading(false);
      return;
    }

    loadData();
  }, [hasOrganizationalUnitId, loadData]);

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

  const handleNodeDoubleClick = useCallback((node: OrganizationalUnitChartNodeProps) => {
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
    const applyCollapsed = (nodes: OrganizationalUnitChartNodeProps[]): OrganizationalUnitChartNodeProps[] =>
      nodes.map((node) => ({
        ...node,
        children: collapsedNodes.has(String(node.id)) ? [] : applyCollapsed(node.children),
      }));

    if (focusedNode) {
      return applyCollapsed([focusedNode]);
    }

    return applyCollapsed(data);
  }, [collapsedNodes, data, focusedNode]);

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
          {
            name: t('organization.view.list'),
            href: paths.dashboard.architecture.organizationalStructureTable,
          },
          { name: t('organization.view.map'), onClick: history.length > 0 ? handleResetView : undefined },
          ...history.map((node, index) => ({
            name: node.name,
            onClick: index < history.length - 1 
              ? () => setHistory((prev) => prev.slice(0, index + 1)) 
              : undefined,
          })),
        ]}
        action={
          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
            onClick={() => {
              if (history.length > 0) {
                handleGoBack();
              } else {
                window.location.href = paths.dashboard.architecture.organizationalStructureTable;
              }
            }}
          >
            {t('organization.view.back')}
          </Button>
        }
        sx={{ mb: 3 }}
      />

      {hasOrganizationalUnitId ? (
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
      ) : (
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pb: { xs: 8, sm: 10, md: 12 },
          }}
        >
          <Box
            sx={{
              width: '100%',
              height: '75vh',
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: 'background.neutral',
              border: `1px dashed ${divider}`,
            }}
          >
            {loading ? (
              <LoadingScreen />
            ) : data.length === 0 ? (
              <Box sx={{ py: 6 }}>
                <EmptyContent title={t('organization.map.noData')} />
              </Box>
            ) : (
              <ZoomPanWrapper fitOnInit>
                <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start', pt: 5, px: 3 }}>
                  {visibleData.map((rootNode) => (
                    <Box key={rootNode.id} sx={{ flexShrink: 0 }}>
                      <OrganizationalChart
                        data={rootNode}
                        lineColor={primaryLight}
                        nodeItem={(props: OrganizationalUnitChartNodeProps) => (
                          <OrganizationalUnitChartNode
                            node={props}
                            isCollapsed={collapsedNodes.has(String(props.id))}
                            onToggleCollapse={() => handleToggleCollapse(String(props.id))}
                            onDoubleClick={() => handleNodeDoubleClick(props)}
                          />
                        )}
                      />
                    </Box>
                  ))}
                </Box>
              </ZoomPanWrapper>
            )}
          </Box>
        </Box>
      )}
    </Container>
  );
}
