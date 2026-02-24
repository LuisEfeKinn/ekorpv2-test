'use client';

import type { Theme, SxProps } from '@mui/material/styles';
import type { OrganizationalUnitFlowNode } from 'src/services/organization/organizationalUnit.service';

import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';

import { GetOrganizationalUnitFlowService } from 'src/services/organization/organizationalUnit.service';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { useSettingsContext } from 'src/components/settings';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ZoomPanWrapper } from 'src/components/zoom-pan-wrapper/zoom-pan-wrapper';
import { OrganizationalChart } from 'src/components/organizational-chart/organizational-chart';

import { OrganizationalStructureDiagram } from '../organizational-structure-diagram';
import { OrganizationalUnitFeedbacksTableView } from '../feedbacks/organizational-unit-feedbacks-table-view';

type Props = { id?: string };

type FlowResponse = { data?: unknown };

type OrganizationalUnitChartNode = OrganizationalUnitFlowNode & {
  name: string;
  children: OrganizationalUnitChartNode[];
  hasChildren: boolean;
};

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

const normalizeFlowChildren = (nodes: OrganizationalUnitFlowNode[]): OrganizationalUnitChartNode[] =>
  nodes
    .filter((node) => node && typeof node === 'object')
    .map((node) => ({
      ...node,
      name: node.data?.name || node.label || '',
      children: normalizeFlowChildren(node.children ?? []),
      hasChildren: (node.children?.length ?? 0) > 0,
    }));

type NodeProps = {
  node: OrganizationalUnitChartNode;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
};

function OrganizationalUnitChartNode({ node, isCollapsed, onToggleCollapse }: NodeProps) {
  const theme = useTheme();
  
  // Safe access to palette colors with fallback
  const primaryMain = theme.palette?.primary?.main || '#000';
  const color = node.data?.color || primaryMain;
  const bgColor = alpha(color, 0.16);
  const code = node.data?.code || '';
  const name = node.data?.name || node.label || '';

  return (
    <Box sx={{ position: 'relative', display: 'inline-block', margin: '10px' }}>
      <Card
        sx={{
          p: 2,
          minWidth: 280,
          maxWidth: 340,
          borderRadius: 2,
          cursor: 'default',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: color,
            boxShadow: theme.customShadows.z20,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: bgColor,
              color,
              border: `2px solid ${color}`,
            }}
          >
            <Iconify icon={"solar:buildings-2-bold-duotone" as any} width={24} />
          </Avatar>

          <Box sx={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
            {code && (
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                {code}
              </Typography>
            )}

            <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600 }}>
              {name}
            </Typography>
          </Box>

          {node.hasChildren && (
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                onToggleCollapse();
              }}
              sx={{
                width: 28,
                height: 28,
                color: 'text.secondary',
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  bgcolor: 'action.hover',
                  borderColor: 'primary.main',
                  color: 'primary.main',
                },
              }}
            >
              <Iconify
                icon={isCollapsed ? 'eva:arrow-ios-forward-fill' : 'eva:arrow-ios-downward-fill'}
                width={14}
              />
            </IconButton>
          )}
        </Box>
      </Card>
    </Box>
  );
}

export function OrganizationalStructureMapView({ id, sx, ...other }: Props & { sx?: SxProps<Theme> }) {
  const settings = useSettingsContext();
  const organizationalUnitId = id ?? '';
  const hasOrganizationalUnitId = Boolean(id);
  const theme = useTheme();
  
  const divider = theme.palette?.divider || '#000000';
  const primaryLight = theme.palette?.primary?.light || '#000000';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OrganizationalUnitChartNode[]>([]);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

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

  const visibleData = useMemo(() => {
    const applyCollapsed = (nodes: OrganizationalUnitChartNode[]): OrganizationalUnitChartNode[] =>
      nodes.map((node) => ({
        ...node,
        children: collapsedNodes.has(String(node.id)) ? [] : applyCollapsed(node.children),
      }));

    return applyCollapsed(data);
  }, [collapsedNodes, data]);

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
                <EmptyContent title="No hay datos disponibles" />
              </Box>
            ) : (
              <ZoomPanWrapper fitOnInit>
                <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start', pt: 5, px: 3 }}>
                  {visibleData.map((rootNode) => (
                    <Box key={rootNode.id} sx={{ flexShrink: 0 }}>
                      <OrganizationalChart
                        data={rootNode}
                        lineColor={primaryLight}
                        nodeItem={(props: OrganizationalUnitChartNode) => (
                          <OrganizationalUnitChartNode
                            node={props}
                            isCollapsed={collapsedNodes.has(String(props.id))}
                            onToggleCollapse={() => handleToggleCollapse(String(props.id))}
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

      {hasOrganizationalUnitId && (
        <Box sx={{ mt: 5 }}>
          <OrganizationalUnitFeedbacksTableView orgUnitId={organizationalUnitId} />
        </Box>
      )}
    </Container>
  );
}
