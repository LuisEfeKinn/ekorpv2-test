'use client';

import type { Theme, SxProps } from '@mui/material/styles';

import { useBoolean } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { GetProcessFlowService } from 'src/services/architecture/process/processTable.service';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ProcessesFlow, type ProcessFlowNode } from '../processes-flow';
import { ProcessCreateEditDrawer } from '../process-create-edit-drawer';

// ----------------------------------------------------------------------

type ProcessesFlowViewProps = {
  sx?: SxProps<Theme>;
};

// ----------------------------------------------------------------------

export function ProcessesFlowView({ sx }: ProcessesFlowViewProps) {
  const { t } = useTranslate('architecture');
  const createEditDrawer = useBoolean();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProcessFlowNode[]>([]);
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [reloadKey, setReloadKey] = useState(0);

  const [history, setHistory] = useState<ProcessFlowNode[]>([]);

  const openCreate = useCallback(() => {
    setEditingId(undefined);
    createEditDrawer.onTrue();
  }, [createEditDrawer]);

  const openEdit = useCallback((id: number) => {
    setEditingId(id);
    createEditDrawer.onTrue();
  }, [createEditDrawer]);

  const handleSaved = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await GetProcessFlowService();
      if (response?.data) {
         setData(response.data);
      }
    } catch (error) {
      console.error('Error loading process flow:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, reloadKey]);

  const handleNodeDoubleClick = useCallback((node: ProcessFlowNode) => {
    setHistory((prev) => [...prev, node]);
  }, []);

  const handleGoBack = useCallback(() => {
    setHistory((prev) => prev.slice(0, -1));
  }, []);

  const handleResetView = useCallback(() => {
    setHistory([]);
  }, []);

  const focusedNode = history.length > 0 ? history[history.length - 1] : null;

  const visibleData = useMemo(() => {
    if (focusedNode) {
      // If we are focused on a node, we show its children as roots
      return focusedNode.children || [];
    }
    // Otherwise we show the root data
    return data;
  }, [data, focusedNode]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Container maxWidth="xl">
      <Stack spacing={3}>
        <CustomBreadcrumbs
          heading={t('process.table.title')}
          links={[
            {
              name: t('process.table.breadcrumbs.dashboard'),
              href: paths.dashboard.root,
            },
            {
              name: t('process.table.title'),
              href: paths.dashboard.architecture.processesTable,
            },
            {
              name: t('process.map.title'),
              onClick: history.length > 0 ? handleResetView : undefined,
            },
            ...history.map((node, index) => ({
              name: node.data.name || node.label,
              onClick:
                index < history.length - 1
                  ? () => setHistory((prev) => prev.slice(0, index + 1))
                  : undefined,
            })),
          ]}
          action={
            <Stack direction="row" spacing={1}>
              <Button
                href={paths.dashboard.architecture.processesTable}
                variant="outlined"
                startIcon={<Iconify icon="solar:list-bold" />}
              >
                {t('process.table.title')}
              </Button>
              <Button
                onClick={openCreate}
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
              >
                {t('process.table.actions.add')}
              </Button>
            </Stack>
          }
          sx={{
            mb: { xs: 2, md: 3 },
          }}
        />

        {visibleData.length > 0 ? (
            <ProcessesFlow
                data={visibleData}
                onEditProcess={openEdit}
                onNodeDoubleClick={handleNodeDoubleClick}
                reloadKey={reloadKey}
                sx={sx}
                onBack={history.length > 0 ? handleGoBack : undefined}
                parentLabel={focusedNode ? (focusedNode.data.name || focusedNode.label) : undefined}
            />
        ) : (
             <EmptyContent title="No processes found" />
        )}
      </Stack>

      <ProcessCreateEditDrawer
        open={createEditDrawer.value}
        onClose={createEditDrawer.onFalse}
        processId={editingId}
        onSaved={handleSaved}
      />
    </Container>
  );
}
