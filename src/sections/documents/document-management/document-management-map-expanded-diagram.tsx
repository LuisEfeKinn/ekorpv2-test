'use client';

import type { Theme, SxProps } from '@mui/material/styles';
import type { DocumentMapNode, DocumentMapResponse } from 'src/services/documents/documents.service';

import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { GetDocumentMapByIdService, GetDocumentMapExpandService } from 'src/services/documents/documents.service';

import { toast } from 'src/components/snackbar';
import {
  type ExpandibleMapNode,
  NodesExpandibleMapExpanded,
} from 'src/components/expandible-map';

type Props = {
  documentId: string;
  nodeId: string;
  height?: number;
  sx?: SxProps<Theme>;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const normalizeMapResponse = (value: unknown, fallbackId: string): DocumentMapResponse => {
  if (!isRecord(value)) return { id: fallbackId, label: `Nodo ${fallbackId}`, children: [] };
  const id = 'id' in value ? (value.id as string | number) : fallbackId;
  const label = typeof value.label === 'string' ? value.label : `Nodo ${fallbackId}`;
  const children = Array.isArray(value.children) ? (value.children as DocumentMapNode[]) : [];
  return { id, label, children, data: value.data };
};

export function DocumentManagementMapExpandedDiagram({ documentId, nodeId, height, sx }: Props) {
  const router = useRouter();
  const { t } = useTranslate('documents');

  const [loading, setLoading] = useState(true);
  const [documentLabel, setDocumentLabel] = useState('');
  const [expandedData, setExpandedData] = useState<DocumentMapResponse | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [drawerTarget, setDrawerTarget] = useState<ExpandibleMapNode | null>(null);

  useEffect(() => {
    if (!documentId || !nodeId) {
      setLoading(false);
      setDocumentLabel('');
      setExpandedData(null);
      return;
    }

    const fetchExpanded = async () => {
      try {
        setLoading(true);

        try {
          const root = await GetDocumentMapByIdService(documentId);
          const normalizedRoot = normalizeMapResponse(root.data as unknown, documentId);
          setDocumentLabel(normalizedRoot.label);
        } catch {
          setDocumentLabel('');
        }

        const expanded = await GetDocumentMapExpandService(documentId, nodeId);
        const normalizedExpanded = normalizeMapResponse(expanded.data as unknown, nodeId);
        setExpandedData(normalizedExpanded);
      } catch {
        toast.error(t('documentManagement.map.messages.expandNotAvailable'));
        setExpandedData({ id: nodeId, label: `Nodo ${nodeId}`, children: [] });
      } finally {
        setLoading(false);
      }
    };

    void fetchExpanded();
  }, [documentId, nodeId, t]);

  const items = useMemo<ExpandibleMapNode[]>(
    () =>
      (expandedData?.children ?? []).map((child) => ({
        id: child.id,
        label: child.label,
        payload: child.data,
      })),
    [expandedData?.children]
  );

  const headerTitle = documentLabel || t('documentManagement.map.title');

  const handleBackToMap = useCallback(() => {
    router.push(paths.dashboard.documents.documentManagementMap(String(documentId)));
  }, [documentId, router]);

  const handleBackToTable = useCallback(() => {
    router.push(paths.dashboard.documents.documentManagement);
  }, [router]);

  const handleOpenDrawer = useCallback((mode: 'create' | 'edit', target: ExpandibleMapNode | null) => {
    setDrawerMode(mode);
    setDrawerTarget(target);
    setDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setDrawerTarget(null);
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          width: '100%',
          minHeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...sx,
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="body2" color="text.secondary">
            {t('documentManagement.map.messages.loading')}
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (!expandedData) {
    return (
      <Box
        sx={{
          width: '100%',
          minHeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...sx,
        }}
      >
        <Typography variant="body1" color="text.secondary">
          {t('documentManagement.map.messages.empty')}
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <NodesExpandibleMapExpanded
        headerTitle={headerTitle}
        centerSubtitle={expandedData.label}
        center={{ id: expandedData.id, label: expandedData.label }}
        items={items}
        onBackToMap={handleBackToMap}
        onBackToTable={handleBackToTable}
        onOpenFormDrawer={() => handleOpenDrawer('create', null)}
        onItemClick={(item) => {
          router.push(paths.dashboard.documents.documentManagementMapExpand(String(documentId), String(item.id)));
        }}
        onItemEdit={(item) => handleOpenDrawer('edit', item)}
        onItemDelete={() => {
          toast.info(t('documentManagement.map.messages.deleteNotAvailable'));
        }}
        height={height}
        sx={sx}
      />

      <Drawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        anchor="right"
        PaperProps={{ sx: { width: { xs: '100%', sm: 420 } } }}
      >
        <Stack spacing={2} sx={{ p: 3 }}>
          <Typography variant="h6">
            {drawerMode === 'create' ? t('documentManagement.map.drawer.createTitle') : t('documentManagement.map.drawer.editTitle')}
          </Typography>
          {drawerTarget ? (
            <Typography variant="body2" color="text.secondary">
              {drawerTarget.label}
            </Typography>
          ) : null}
          <Button variant="outlined" onClick={handleCloseDrawer}>
            {t('documentManagement.actions.cancel')}
          </Button>
        </Stack>
      </Drawer>
    </>
  );
}
