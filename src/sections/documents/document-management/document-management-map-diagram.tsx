'use client';

import type { Theme, SxProps } from '@mui/material/styles';
import type { DocumentMapNode, DocumentMapResponse } from 'src/services/documents/documents.service';

import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { GetDocumentMapByIdService } from 'src/services/documents/documents.service';

import { toast } from 'src/components/snackbar';
import {
  NodesExpandibleMapInitial,
  type ExpandibleMapSection,
} from 'src/components/expandible-map';

type Props = {
  documentId: string;
  height?: number;
  sx?: SxProps<Theme>;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const normalizeMapResponse = (value: unknown, fallbackId: string): DocumentMapResponse => {
  if (!isRecord(value)) return { id: fallbackId, label: `Documento ${fallbackId}`, children: [] };
  const id = 'id' in value ? (value.id as string | number) : fallbackId;
  const label = typeof value.label === 'string' ? value.label : `Documento ${fallbackId}`;
  const children = Array.isArray(value.children) ? (value.children as DocumentMapNode[]) : [];
  return { id, label, children, data: value.data };
};

export function DocumentManagementMapDiagram({ documentId, height, sx }: Props) {
  const router = useRouter();
  const { t } = useTranslate('documents');
  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState<DocumentMapResponse | null>(null);

  useEffect(() => {
    if (!documentId) {
      setLoading(false);
      setMapData(null);
      return;
    }

    const fetchMap = async () => {
      try {
        setLoading(true);
        const response = await GetDocumentMapByIdService(documentId);
        const normalized = normalizeMapResponse(response.data as unknown, documentId);
        setMapData(normalized);
      } catch {
        setMapData(null);
        toast.error(t('documentManagement.messages.error.loading'));
      } finally {
        setLoading(false);
      }
    };

    void fetchMap();
  }, [documentId, t]);

  const sections = useMemo<ExpandibleMapSection[]>(
    () =>
      (mapData?.children ?? []).map((child) => ({
        id: child.id,
        label: child.label,
        payload: child.data,
      })),
    [mapData?.children]
  );

  const handleSectionClick = useCallback(
    (section: ExpandibleMapSection) => {
      router.push(paths.dashboard.documents.documentManagementMapExpand(String(documentId), String(section.id)));
    },
    [documentId, router]
  );

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

  if (!mapData) {
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
    <NodesExpandibleMapInitial
      center={{ id: mapData.id, label: mapData.label }}
      sections={sections}
      onSectionClick={handleSectionClick}
      centerSubtitle={t('documentManagement.map.subtitle')}
      uiVariant="card"
      height={height}
      sx={sx}
    />
  );
}
