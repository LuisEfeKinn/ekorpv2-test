import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { SaveFeedbackToProcessService } from 'src/services/architecture/process/processFeedbacks.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  processId: string;
  isLesson: boolean; // true for Lesson, false for Proposal
};

export function ProcessFeedbackCreateModal({ open, onClose, onSuccess, processId, isLesson }: Props) {
  const { t } = useTranslate('architecture');
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
      toast.error(t('process.feedbacks.descriptionRequired'));
      return;
    }

    try {
      setLoading(true);

      // 1. Create Feedback
      // The user specified that for lessons only the date fields are filled with current date
      // But we also need description and other required fields from the form
      const feedbackPayload = {
        date: new Date().toISOString(),
        improvementLesson: isLesson,
        description,
        problem: "",
        rootCause: "",
        proposedStrategy: "",
        estimatedResourceCosts: "",
        expectedResults: "",
        effectivenessIndicators: "",
        proposedWorkTeam: "",
        statusDate: new Date().toISOString(),
        file: "",
        type: "",
        link: "",
        originalFile: "",
        rejectionReason: "",
        reportReceiver: 1
      };

      await SaveFeedbackToProcessService(processId, feedbackPayload);

      toast.success(t('process.feedbacks.success'));
      onSuccess();
      onClose();

    } catch (error) {
      console.error('Error saving feedback:', error);
      toast.error(t('process.feedbacks.error'));
    } finally {
      setLoading(false);
    }
  };

  const title = isLesson ? t('process.feedbacks.titleLesson') : t('process.feedbacks.titleProposal');

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          
          {/* User Field (Read Only) */}
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
              {t('process.feedbacks.user')}
            </Typography>
            <Box sx={{ 
              p: 1.5, 
              borderRadius: 1, 
              bgcolor: 'action.hover', 
              color: 'text.primary',
              typography: 'body2'
            }}>
              {user?.displayName || t('process.feedbacks.currentUser')}
            </Box>
          </Box>

          {/* Date Field (Read Only) */}
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
              {t('process.feedbacks.date')}
            </Typography>
            <Typography variant="body1">
              {dateStr}
            </Typography>
          </Box>

          {/* Description Field */}
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
              {isLesson ? t('process.feedbacks.descriptionLesson') : t('process.feedbacks.descriptionProposal')}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('process.feedbacks.placeholder')}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.paper',
                }
              }}
            />
          </Box>

          {/* File Attachment Button (Visual Only for now as per prompt instructions regarding specific payload) */}
          <Box>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<Iconify icon="eva:plus-fill" />}
              sx={{ textTransform: 'none' }}
            >
              {t('process.feedbacks.attachFile')}
            </Button>
          </Box>

        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined" color="inherit">
          {t('process.feedbacks.cancel')}
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading}
          startIcon={loading && <CircularProgress size={18} color="inherit" />}
        >
          {t('process.feedbacks.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
