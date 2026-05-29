'use client';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';

import { GetConfigureTestsByIdService } from 'src/services/performance/configure-tests.service';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  templateId: string | number | null;
};

// ----------------------------------------------------------------------

export function TemplatePreviewDrawer({ open, onClose, templateId }: Props) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState<any>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const fetchTemplate = useCallback(async () => {
    if (!templateId) return;
    setLoading(true);
    try {
      const response = await GetConfigureTestsByIdService(templateId);
      // Service returns the template directly in response.data
      const raw = response?.data;
      setTemplate(raw?.data ?? raw ?? null);
    } catch (error) {
      console.error('Error fetching template preview:', error);
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    if (open && templateId) {
      setExpandedIds(new Set());
      fetchTemplate();
    }
  }, [open, templateId, fetchTemplate]);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isObjectiveType = template?.type === 'OBJECTIVES';

  // ── Competences ────────────────────────────────────────────────────────────
  const renderCompetences = () => {
    const competences: any[] = template?.competences || [];

    if (competences.length === 0) {
      return (
        <Typography variant="body2" color="text.disabled" textAlign="center" sx={{ py: 4 }}>
          No hay competencias en esta plantilla
        </Typography>
      );
    }

    return (
      <Stack spacing={1.5}>
        {competences.map((comp, idx) => {
          const color =
            comp.skillColor || comp.competency?.color || theme.palette.primary.main;
          const name =
            comp.competency?.name || comp.competenceName || `Competencia #${comp.competencyId}`;
          const questions: any[] = comp.questions || [];
          const expanded = expandedIds.has(comp.competencyId ?? idx);

          return (
            <Box
              key={comp.competencyId ?? idx}
              sx={{
                borderRadius: 1.5,
                border: `1px solid ${alpha(color, 0.3)}`,
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{
                  px: 2,
                  py: 1.5,
                  bgcolor: alpha(color, 0.06),
                  cursor: questions.length > 0 ? 'pointer' : 'default',
                }}
                onClick={() => questions.length > 0 && toggleExpand(comp.competencyId ?? idx)}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: color,
                    flexShrink: 0,
                  }}
                />
                <Typography variant="subtitle2" sx={{ flex: 1 }}>
                  {name}
                </Typography>
                <Chip
                  label={`${comp.weight}%`}
                  size="small"
                  sx={{ bgcolor: alpha(color, 0.12), color, fontWeight: 600 }}
                />
                {questions.length > 0 && (
                  <IconButton size="small" sx={{ color }} disableRipple>
                    <Iconify
                      icon={
                        expanded ? 'solar:alt-arrow-up-bold' : 'solar:alt-arrow-down-bold'
                      }
                      width={16}
                    />
                  </IconButton>
                )}
              </Stack>

              {/* Questions */}
              <Collapse in={expanded}>
                <Stack divider={<Divider />} sx={{ px: 2 }}>
                  {questions.map((q: any, qIdx: number) => (
                    <Box key={qIdx} sx={{ py: 1.5 }}>
                      <Stack direction="row" alignItems="flex-start" spacing={1}>
                        <Typography
                          variant="caption"
                          color="text.disabled"
                          sx={{ pt: 0.3, flexShrink: 0 }}
                        >
                          {qIdx + 1}.
                        </Typography>
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {q.description || '(Sin descripción)'}
                        </Typography>
                        <Chip
                          label={`${q.weight}%`}
                          size="small"
                          variant="outlined"
                          sx={{ flexShrink: 0 }}
                        />
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </Collapse>
            </Box>
          );
        })}
      </Stack>
    );
  };

  // ── Objectives ─────────────────────────────────────────────────────────────
  const renderObjectives = () => {
    const objectives: any[] = template?.objectives || [];

    if (objectives.length === 0) {
      return (
        <Typography variant="body2" color="text.disabled" textAlign="center" sx={{ py: 4 }}>
          No hay objetivos en esta plantilla
        </Typography>
      );
    }

    return (
      <Stack spacing={1.5}>
        {objectives.map((obj: any, idx: number) => (
          <Box
            key={obj.objectiveId ?? idx}
            sx={{
              p: 2,
              borderRadius: 1.5,
              border: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              <Typography variant="subtitle2" sx={{ flex: 1 }}>
                {obj.objective?.name || obj.objectiveName || `Objetivo #${obj.objectiveId}`}
              </Typography>
              <Chip label={`${obj.weight}%`} size="small" />
            </Stack>
            {obj.targetValue !== undefined && obj.targetValue !== null && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Valor objetivo: {obj.targetValue}
              </Typography>
            )}
          </Box>
        ))}
      </Stack>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 600, md: 680 },
          display: 'flex',
          flexDirection: 'column',
          zIndex: (t) => t.zIndex.drawer + 1,
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
          flexShrink: 0,
        }}
      >
        <Button
          startIcon={<Iconify icon="solar:reply-bold" />}
          variant="outlined"
          color="inherit"
          size="small"
          onClick={onClose}
        >
          Volver
        </Button>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" noWrap>
            {template?.name || 'Vista previa de plantilla'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isObjectiveType ? 'Objetivos de la plantilla' : 'Competencias y preguntas'}
          </Typography>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          isObjectiveType ? renderObjectives() : renderCompetences()
        )}
      </Box>
    </Drawer>
  );
}
