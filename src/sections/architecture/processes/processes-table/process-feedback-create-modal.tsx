import { useTranslate } from 'src/locales';
import { SaveFeedbackToProcessService } from 'src/services/architecture/process/processFeedbacks.service';

import { toast } from 'src/components/snackbar';

import { SharedFeedbackCreateDrawer } from 'src/sections/architecture/common/feedback-create-drawer';

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

  const handleSave = async (description: string) => {
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

    try {
      await SaveFeedbackToProcessService(processId, feedbackPayload);
      toast.success(t('process.feedbacks.success'));
    } catch (error) {
      toast.error(t('process.feedbacks.error') || 'Error al guardar');
      throw error;
    }
  };

  const title = isLesson ? t('process.feedbacks.titleLesson') : t('process.feedbacks.titleProposal');
  const descriptionLabel = isLesson ? t('process.feedbacks.descriptionLesson') : t('process.feedbacks.descriptionProposal');

  return (
    <SharedFeedbackCreateDrawer
      open={open}
      onClose={onClose}
      onSuccess={onSuccess}
      title={title}
      onSubmit={handleSave}
      descriptionLabel={descriptionLabel}
      descriptionPlaceholder={t('process.feedbacks.placeholder')}
    />
  );
}
