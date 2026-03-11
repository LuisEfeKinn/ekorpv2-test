import * as z from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import {
  VerifyPhoneCodeService,
  SendPhoneVerificationCodeService,
  BiometricValidationUpdateDataService,
} from 'src/services/auth/biometricRegister.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

type RegisterFormData = {
  phone: string;
  confirmPhone: string;
  password: string;
  confirmPassword: string;
};

// ----------------------------------------------------------------------

interface PersonalInfoFormProps {
  documentId: string;
  biometricValidationId: string;
  onSuccess: () => void;
}

export function PersonalInfoForm({ documentId, biometricValidationId, onSuccess }: PersonalInfoFormProps) {
  const { t } = useTranslate('common');

  // Schema de validación con traducciones
  const getValidationSchema = () => z.object({
    phone: z
      .string()
      .min(10, t('personalInfo.validation.phoneMin'))
      .max(20, t('personalInfo.validation.phoneMax')),
    confirmPhone: z
      .string()
      .min(10, t('personalInfo.validation.phoneMin'))
      .max(20, t('personalInfo.validation.phoneMax')),
    password: z
      .string()
      .min(8, t('personalInfo.validation.passwordMin'))
      .regex(/[A-Z]/, t('personalInfo.validation.passwordUppercase'))
      .regex(/[a-z]/, t('personalInfo.validation.passwordLowercase'))
      .regex(/[0-9]/, t('personalInfo.validation.passwordNumber'))
      .regex(/[^A-Za-z0-9]/, t('personalInfo.validation.passwordSpecial')),
    confirmPassword: z.string().min(1, t('personalInfo.validation.confirmPasswordRequired')),
  }).refine((data) => data.phone === data.confirmPhone, {
    message: t('personalInfo.validation.phonesNotMatch'),
    path: ['confirmPhone'],
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('personalInfo.validation.passwordsNotMatch'),
    path: ['confirmPassword'],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutos en segundos
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const methods = useForm<RegisterFormData>({
    resolver: zodResolver(getValidationSchema()),
    defaultValues: {
      phone: '',
      confirmPhone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const { handleSubmit, watch } = methods;
  const phone = watch('phone');
  const confirmPhone = watch('confirmPhone');

  // Formatear tiempo restante
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Iniciar temporizador
  const startTimer = () => {
    if (timerInterval) clearInterval(timerInterval);
    
    setTimeLeft(600);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setTimerInterval(interval);
  };

  // Enviar código de verificación
  const handleSendVerificationCode = async () => {
    if (!documentId) {
      toast.error(t('personalInfo.errors.noDocumentId'));
      return;
    }

    if (!confirmPhone || confirmPhone.length < 10) {
      toast.error(t('personalInfo.errors.invalidPhone'));
      return;
    }

    // Verificar que ambos teléfonos coincidan antes de enviar código
    if (phone !== confirmPhone) {
      toast.error(t('personalInfo.errors.phonesNotMatch'));
      return;
    }

    setIsSendingCode(true);

    try {
      const response = await SendPhoneVerificationCodeService({
        documentId,
        phoneNumber: confirmPhone,
      });

      if (response.status === 200 || response.data?.statusCode === 200) {
        toast.success(t('personalInfo.success.codeSent'));
        setShowVerificationModal(true);
        startTimer();
      } else {
        throw new Error(response.data?.message || t('personalInfo.errors.sendCode'));
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || t('personalInfo.errors.sendCode');
      toast.error(errorMessage);
    } finally {
      setIsSendingCode(false);
    }
  };

  // Verificar código
  const handleVerifyCode = async () => {
    if (!documentId) {
      toast.error(t('personalInfo.errors.noDocumentId'));
      return;
    }

    if (!verificationCode || verificationCode.length < 4) {
      toast.error(t('personalInfo.errors.invalidCode'));
      return;
    }

    setIsVerifyingCode(true);

    try {
      const response = await VerifyPhoneCodeService({
        documentId,
        phoneNumber: confirmPhone,
        verificationCode,
      });

      if (response.status === 200 || response.data?.statusCode === 200) {
        toast.success(t('personalInfo.success.phoneVerified'));
        setIsPhoneVerified(true);
        setShowVerificationModal(false);
        if (timerInterval) clearInterval(timerInterval);
      } else {
        throw new Error(response.data?.message || t('personalInfo.errors.verifyCode'));
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || t('personalInfo.errors.verifyCode');
      toast.error(errorMessage);
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Reenviar código
  const handleResendCode = async () => {
    setVerificationCode('');
    await handleSendVerificationCode();
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setShowVerificationModal(false);
    setVerificationCode('');
    if (timerInterval) clearInterval(timerInterval);
  };

  // Enviar formulario
  const handleFormSubmit = handleSubmit(async (data) => {
    if (!isPhoneVerified) {
      toast.error(t('personalInfo.errors.phoneNotVerified'));
      return;
    }

    if (!documentId) {
      toast.error(t('personalInfo.errors.noDocumentId'));
      return;
    }

    setIsSubmitting(true);

    try {
      const dataSend = {
        cellPhone: data.confirmPhone,
        password: data.password,
      };

      const response = await BiometricValidationUpdateDataService(biometricValidationId, dataSend);

      if (response.status === 200 || response.data?.statusCode === 200) {
        toast.success(t('personalInfo.success.dataSaved'));
        onSuccess();
      } else {
        throw new Error(response.data?.message || t('personalInfo.errors.saveData'));
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || t('personalInfo.errors.saveData');
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <>
      <Card
        sx={{
          p: 3,
          maxWidth: 700,
          mx: 'auto',
        }}
      >
        <Typography variant="h5" sx={{ mb: 1 }}>
          {t('personalInfo.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('personalInfo.subtitle')}
        </Typography>

        <Form methods={methods} onSubmit={handleFormSubmit}>
          <Grid container spacing={3}>
            {/* Teléfono */}
            <Grid size={{ xs: 12 }}>
              <Field.Phone
                name="phone"
                label={t('personalInfo.fields.phone')}
                placeholder={t('personalInfo.placeholders.phone')}
                helperText={t('personalInfo.helpers.phoneWithCode')}
              />
            </Grid>

            {/* Confirmar Teléfono */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Field.Phone
                name="confirmPhone"
                label={t('personalInfo.fields.confirmPhone')}
                placeholder={t('personalInfo.placeholders.confirmPhone')}
                helperText={t('personalInfo.helpers.confirmPhone')}
              />
            </Grid>

            {/* Botón de verificar */}
            <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', alignItems: 'flex-start', pt: { md: 1 } }}>
              {isPhoneVerified ? (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    color: 'success.main',
                    width: '100%',
                    justifyContent: 'center',
                    py: 1.5,
                  }}
                >
                  <Iconify icon="solar:check-circle-bold" width={24} />
                  <Typography variant="body2" fontWeight="medium">
                    {t('personalInfo.buttons.verified')}
                  </Typography>
                </Box>
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleSendVerificationCode}
                  disabled={isSendingCode || !confirmPhone || confirmPhone.length < 10 || phone !== confirmPhone}
                  startIcon={isSendingCode ? <CircularProgress size={16} color="inherit" /> : <Iconify icon="solar:shield-check-bold" />}
                >
                  {isSendingCode ? t('personalInfo.buttons.sending') : t('personalInfo.buttons.verify')}
                </Button>
              )}
            </Grid>

            {/* Mensaje de verificación requerida */}
            {!isPhoneVerified && (
              <Grid size={{ xs: 12 }}>
                <Alert severity="info" sx={{ mb: 0 }}>
                  {t('personalInfo.alerts.verificationRequired')}
                </Alert>
              </Grid>
            )}

            {/* Contraseña */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Field.Text
                name="password"
                label={t('personalInfo.fields.password')}
                type={showPassword ? 'text' : 'password'}
                placeholder={t('personalInfo.placeholders.password')}
                helperText={t('personalInfo.helpers.password')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="solar:lock-password-outline" width={20} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        <Iconify icon={showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Confirmar Contraseña */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Field.Text
                name="confirmPassword"
                label={t('personalInfo.fields.confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder={t('personalInfo.placeholders.confirmPassword')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="solar:lock-password-outline" width={20} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        <Iconify icon={showConfirmPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Botón de envío */}
            <Grid size={{ xs: 12 }}>
              <Button
                fullWidth
                size="large"
                type="submit"
                variant="contained"
                disabled={isSubmitting || !isPhoneVerified}
                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <Iconify icon="solar:check-circle-bold" />}
              >
                {isSubmitting ? t('personalInfo.buttons.saving') : t('personalInfo.buttons.submit')}
              </Button>
            </Grid>
          </Grid>
        </Form>
      </Card>

      {/* Modal de verificación de código */}
      <Dialog 
        open={showVerificationModal} 
        onClose={handleCloseModal}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">{t('personalInfo.modal.title')}</Typography>
            <IconButton onClick={handleCloseModal} size="small">
              <Iconify icon="solar:close-circle-bold" />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('personalInfo.modal.subtitle', { phone: confirmPhone })}
            </Typography>

            {/* Timer */}
            <Box 
              sx={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1,
                borderRadius: 1,
                bgcolor: timeLeft > 0 ? 'primary.lighter' : 'error.lighter',
                color: timeLeft > 0 ? 'primary.main' : 'error.main',
              }}
            >
              <Iconify icon="solar:clock-circle-bold" width={20} />
              <Typography variant="subtitle2" fontWeight="bold">
                {formatTime(timeLeft)}
              </Typography>
            </Box>

            {timeLeft === 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {t('personalInfo.modal.expired')}
              </Alert>
            )}
          </Box>

          {/* Input de código */}
          <TextField
            fullWidth
            autoFocus
            label={t('personalInfo.modal.codeLabel')}
            placeholder={t('personalInfo.modal.codePlaceholder')}
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9A-Fa-f]/g, ''))}
            disabled={timeLeft === 0}
            inputProps={{
              maxLength: 6,
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="solar:shield-check-bold" width={20} />
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          {timeLeft === 0 ? (
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleResendCode}
              disabled={isSendingCode}
              startIcon={isSendingCode ? <CircularProgress size={20} color="inherit" /> : <Iconify icon="solar:restart-bold" />}
            >
              {isSendingCode ? t('personalInfo.buttons.sending') : t('personalInfo.modal.resend')}
            </Button>
          ) : (
            <>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleCloseModal}
                disabled={isVerifyingCode}
              >
                {t('personalInfo.buttons.cancel')}
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={handleVerifyCode}
                disabled={isVerifyingCode || !verificationCode || verificationCode.length < 4}
                startIcon={isVerifyingCode ? <CircularProgress size={20} color="inherit" /> : <Iconify icon="solar:check-circle-bold" />}
              >
                {isVerifyingCode ? t('personalInfo.buttons.verifying') : t('personalInfo.modal.verify')}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
