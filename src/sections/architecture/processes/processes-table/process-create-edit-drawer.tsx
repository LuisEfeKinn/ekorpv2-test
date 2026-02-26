'use client';

import type { IProcessTable } from 'src/types/architecture/process';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { GetProcessTableByIdService } from 'src/services/architecture/process/processTable.service';

import { toast } from 'src/components/snackbar';

import { ProcessCreateEditForm } from './processes-create-edit-form';

type Props = {
  open: boolean;
  onClose: () => void;
  processId?: string | number;
  onSaved?: () => void;
};

export function ProcessCreateEditDrawer({ open, onClose, processId, onSaved }: Props) {
  const { t } = useTranslate('architecture');
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState<IProcessTable | undefined>(undefined);

  const loadData = useCallback(async () => {
    if (!processId) {
      setCurrent(undefined);
      return;
    }
    try {
      setLoading(true);
      const res = await GetProcessTableByIdService(String(processId));
      if (res?.status === 200 && res.data) {
        setCurrent(res.data as unknown as IProcessTable);
      } else {
        setCurrent(undefined);
      }
    } catch (e) {
      console.error(e);
      toast.error(t('process.table.messages.loadError'));
      setCurrent(undefined);
    } finally {
      setLoading(false);
    }
  }, [processId, t]);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, loadData]);

  const handleClose = useCallback(() => {
    onClose();
    if (onSaved) onSaved();
  }, [onClose, onSaved]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="right"
      slotProps={{ backdrop: { invisible: true } }}
      PaperProps={{ sx: { width: { xs: 1, md: 560 } } }}
    >
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
          <CircularProgress />
        </Box>
      ) : (
        <ProcessCreateEditForm currentProcess={current} onClose={handleClose} />
      )}
    </Drawer>
  );
}

