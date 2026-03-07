'use client';

import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Box,
  Stack,
  Drawer,
  Button,
  Typography,
  CircularProgress,
} from '@mui/material';

import { useTranslate } from 'src/locales';
import { SaveToolFeedbackService } from 'src/services/architecture/tools/tools-feedbacks.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { SharedFeedbackCreateDrawer } from 'src/sections/architecture/common/feedback-create-drawer';

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  toolId: string;
  isLessonLearned: boolean;
};

const getLessonProposalSchema = (t: (key: string) => string) => zod.object({
  description: zod.string().min(1, { message: 'La descripción es obligatoria' }),
  problem: zod.string().optional(),
  rootCause: zod.string().optional(),
  proposedStrategy: zod.string().optional(),
  estimatedResourceCosts: zod.string().optional(),
  expectedResults: zod.string().optional(),
  effectivenessIndicators: zod.string().optional(),
  proposedWorkTeam: zod.string().optional(),
  link: zod.string().url({ message: 'URL inválida' }).optional().or(zod.literal('')),
});

export function ToolsLessonsProposalsDrawer({ open, onClose, onSuccess, toolId, isLessonLearned }: Props) {
  const { t } = useTranslate('architecture');
  const [loading, setLoading] = useState(false);

  const LessonProposalSchema = getLessonProposalSchema(t);
  type LessonProposalSchemaType = zod.infer<typeof LessonProposalSchema>;

  const methods = useForm<LessonProposalSchemaType>({
    resolver: zodResolver(LessonProposalSchema),
    defaultValues: {
      description: '',
      problem: '',
      rootCause: '',
      proposedStrategy: '',
      estimatedResourceCosts: '',
      expectedResults: '',
      effectivenessIndicators: '',
      proposedWorkTeam: '',
      link: '',
    },
  });

  const { reset, handleSubmit } = methods;

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const handleSaveLesson = async (description: string) => {
    if (!toolId) {
      toast.error('ID de herramienta inválido');
      return;
    }

    try {
      const payload = {
        date: new Date().toISOString(),
        improvementLesson: true,
        description,
        problem: '',
        rootCause: '',
        proposedStrategy: '',
        estimatedResourceCosts: '',
        expectedResults: '',
        effectivenessIndicators: '',
        proposedWorkTeam: '',
        statusDate: new Date().toISOString(),
        link: '',
        file: '',
        type: '',
        originalFile: '',
        rejectionReason: '',
        reportReceiver: 0,
      };

      await SaveToolFeedbackService(toolId, payload);
      toast.success('Lección aprendida guardada correctamente');
    } catch (error) {
      toast.error('Error al guardar la lección aprendida');
      throw error;
    }
  };

  const onSubmitProposal = handleSubmit(async (data) => {
    if (!toolId) {
      toast.error('ID de herramienta inválido');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        date: new Date().toISOString(),
        improvementLesson: false,
        description: data.description,
        problem: data.problem || '',
        rootCause: data.rootCause || '',
        proposedStrategy: data.proposedStrategy || '',
        estimatedResourceCosts: data.estimatedResourceCosts || '',
        expectedResults: data.expectedResults || '',
        effectivenessIndicators: data.effectivenessIndicators || '',
        proposedWorkTeam: data.proposedWorkTeam || '',
        statusDate: new Date().toISOString(),
        link: data.link || '',
        file: '',
        type: '',
        originalFile: '',
        rejectionReason: '',
        reportReceiver: 0,
      };

      await SaveToolFeedbackService(toolId, payload);

      toast.success('Propuesta de mejora guardada correctamente');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Error al guardar la propuesta de mejora');
    } finally {
      setLoading(false);
    }
  });

  if (isLessonLearned) {
    return (
      <SharedFeedbackCreateDrawer
        open={open}
        onClose={onClose}
        onSuccess={onSuccess}
        title="Nueva Lección Aprendida"
        onSubmit={handleSaveLesson}
        descriptionLabel="Descripción"
        descriptionPlaceholder="Describa el detalle..."
      />
    );
  }

  const title = 'Nueva Propuesta de Mejora';

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 520 } }}>
      <Box sx={{ px: 3, py: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          {title}
        </Typography>

        <Form methods={methods} onSubmit={onSubmitProposal}>
          <Stack spacing={2.5}>
            <Field.Text
              name="description"
              label="Descripción *"
              multiline
              minRows={3}
              placeholder="Describa el detalle..."
            />

            <Field.Text
              name="problem"
              label="Problema Identificado"
              multiline
              minRows={2}
              placeholder="Describa el problema..."
            />

            <Field.Text
              name="rootCause"
              label="Causa Raíz"
              multiline
              minRows={2}
              placeholder="Describa la causa raíz..."
            />

            <Field.Text
              name="proposedStrategy"
              label="Estrategia Propuesta"
              multiline
              minRows={2}
              placeholder="Describa la estrategia..."
            />

            <Field.Text
              name="estimatedResourceCosts"
              label="Recursos y Costos Estimados"
              placeholder="Ej: 5000 USD, 2 Ingenieros..."
            />

            <Field.Text
              name="expectedResults"
              label="Resultados Esperados"
              multiline
              minRows={2}
              placeholder="Describa los resultados..."
            />

            <Field.Text
              name="effectivenessIndicators"
              label="Indicadores de Efectividad"
              multiline
              minRows={2}
              placeholder="KPIs, métricas..."
            />

            <Field.Text
              name="proposedWorkTeam"
              label="Equipo de Trabajo Propuesto"
              multiline
              minRows={2}
              placeholder="Roles o personas..."
            />

            <Field.Text
              name="link"
              label="Enlace de Referencia"
              placeholder="https://..."
            />

            <Stack direction="row" spacing={1.5} sx={{ pt: 2 }}>
              <Button
                variant="outlined"
                onClick={onClose}
                disabled={loading}
                fullWidth
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                fullWidth
                startIcon={
                  loading ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <Iconify icon="mingcute:add-line" />
                  )
                }
              >
                Guardar Propuesta
              </Button>
            </Stack>
          </Stack>
        </Form>
      </Box>
    </Drawer>
  );
}
