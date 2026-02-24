import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title: string;
  onSubmit: (description: string) => Promise<void>;
  descriptionLabel?: string;
  descriptionPlaceholder?: string;
};

export function SharedFeedbackCreateDrawer({ 
  open, 
  onClose, 
  onSuccess, 
  title, 
  onSubmit,
  descriptionLabel,
  descriptionPlaceholder
}: Props) {
  const { t } = useTranslate('architecture'); // Using architecture namespace as it seems common
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  
  // Format current date as DD/MM/YYYY for display
  const today = new Date();
  const dateStr = today.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

  useEffect(() => {
    if (open) {
      setDescription('');
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error(t('process.feedbacks.descriptionRequired') || 'La descripción es obligatoria');
      return;
    }

    try {
      setLoading(true);
      await onSubmit(description);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving feedback:', error);
      // Toast should be handled by the parent or here if generic error
      // But typically parent knows better context. 
      // However, to match previous behavior, we can show a generic error if parent didn't throw with message?
      // For now, let's assume parent handles specific error toasts or we show generic here.
      // The original code showed error toast in the catch block.
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 420 } }}>
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {title}
        </Typography>

        <Stack spacing={2} sx={{ pt: 1 }}>
          
          {/* User Field (Read Only) */}
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
              {t('process.feedbacks.user') || 'Usuario'}
            </Typography>
            <Box sx={{ 
              p: 1.5, 
              borderRadius: 1, 
              bgcolor: 'action.hover', 
              color: 'text.primary',
              typography: 'body2'
            }}>
              {user?.displayName || 'Usuario Actual'}
            </Box>
          </Box>

          {/* Date Field (Read Only) */}
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
              {t('process.feedbacks.date') || 'Fecha'}
            </Typography>
            <Typography variant="body1">
              {dateStr}
            </Typography>
          </Box>

          {/* Description Field */}
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
              {descriptionLabel || t('process.feedbacks.descriptionLesson') || 'Descripción'}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={descriptionPlaceholder || t('process.feedbacks.placeholder') || 'Escriba aquí...'}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.paper',
                }
              }}
            />
          </Box>

          {/* File Attachment Button (Visual Only for now) */}
          <Box>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<Iconify icon="eva:plus-fill" />}
              sx={{ textTransform: 'none' }}
            >
              {t('process.feedbacks.attachFile') || 'Adjuntar archivo'}
            </Button>
          </Box>

          <Stack direction="row" spacing={1} sx={{ pt: 1, justifyContent: 'flex-end' }}>
            <Button onClick={onClose} variant="outlined" color="inherit">
              {t('process.feedbacks.cancel') || 'Cancelar'}
            </Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained" 
              color="primary"
              disabled={loading}
              startIcon={loading && <CircularProgress size={18} color="inherit" />}
            >
              {t('process.feedbacks.save') || 'Guardar'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
}
