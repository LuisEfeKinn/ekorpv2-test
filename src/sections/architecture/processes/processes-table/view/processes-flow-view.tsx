'use client';

import type { Theme, SxProps } from '@mui/material/styles';

import { useState, useCallback } from 'react';
import { useBoolean } from 'minimal-shared/hooks';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ProcessesFlow } from '../processes-flow';
import { ProcessCreateEditDrawer } from '../process-create-edit-drawer';

// ----------------------------------------------------------------------

type ProcessesFlowViewProps = {
  sx?: SxProps<Theme>;
};

// ----------------------------------------------------------------------

export function ProcessesFlowView({ sx }: ProcessesFlowViewProps) {
  const { t } = useTranslate('architecture');
  const createEditDrawer = useBoolean();
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [reloadKey, setReloadKey] = useState(0);

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
            },
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

        <ProcessesFlow sx={sx} onEditProcess={openEdit} reloadKey={reloadKey} />
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
