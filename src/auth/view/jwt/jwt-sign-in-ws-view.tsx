'use client';

import * as z from 'zod';
import { m } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { varAlpha } from 'minimal-shared/utils';
import { useBoolean } from 'minimal-shared/hooks';
import { useRef, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Backdrop from '@mui/material/Backdrop';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { useColorScheme } from '@mui/material/styles';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { useSearchParams } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import axios, { endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaUtils } from 'src/components/hook-form';
import { Recaptcha, type RecaptchaRef } from 'src/components/recaptcha';
import { varFade, varScale, MotionContainer } from 'src/components/animate';

import { getErrorMessage } from '../../utils';

// ----------------------------------------------------------------------

const N8N_WEBHOOK_URL = 'https://n8n-test.kamilainnovation.co/webhook/login';

// ----------------------------------------------------------------------

export type SignInWsSchemaType = z.infer<typeof SignInWsSchema>;

export const SignInWsSchema = z.object({
  email: schemaUtils.email(),
  password: z
    .string()
    .min(1, { error: 'Password is required!' })
    .min(6, { error: 'Password must be at least 6 characters!' }),
});

// ----------------------------------------------------------------------

export function JwtSignInWsView() {
  const { t } = useTranslate();
  const searchParams = useSearchParams();
  const { colorScheme } = useColorScheme();

  const showPassword = useBoolean();

  const recaptchaRef = useRef<RecaptchaRef>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(5);

  // Capturar params desde la URL
  const userId = searchParams.get('userId');
  const senderId = searchParams.get('senderId'); // opcional — destinatario del mensaje

  // senderId tiene prioridad para la redirección (es el destinatario del chat)
  // Si no hay senderId, no se redirige automáticamente
  const redirectPhone = senderId
    ? senderId.split('@')[0]
    : userId
      ? userId.split('@')[0]
      : null;
  const whatsAppUrl = redirectPhone ? `https://wa.me/${redirectPhone}` : null;

  // Cuenta regresiva de 5s y auto-redirect — solo cuando senderId está presente
  useEffect(() => {
    if (!successMessage || !senderId || !whatsAppUrl) return undefined;
    setCountdown(5);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          window.location.href = whatsAppUrl;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [successMessage, senderId, whatsAppUrl]);

  const defaultValues: SignInWsSchemaType = {
    email: '',
    password: '',
  };

  const methods = useForm({
    resolver: zodResolver(SignInWsSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  // Reset reCAPTCHA token when theme changes
  useEffect(() => {
    setRecaptchaToken(null);
  }, [colorScheme]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Validar reCAPTCHA
      if (!recaptchaToken) {
        setErrorMessage(t('auth.recaptchaRequired'));
        return;
      }

      // Validar que el userId esté presente
      if (!userId) {
        setErrorMessage(t('auth.wsLogin.errors.userIdRequired'));
        return;
      }

      // Llamar al servicio de login directamente (sin guardar sesión)
      const res = await axios.post(endpoints.auth.login, {
        email: data.email,
        password: data.password,
      });

      const { accessToken } = res.data;

      if (!accessToken) {
        throw new Error('Access token not found in response');
      }

      // Enviar accessToken + userId al webhook de n8n y esperar respuesta
      const n8nRes = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, userId }),
      });

      if (!n8nRes.ok) {
        throw new Error(t('auth.wsLogin.errors.whatsappService'));
      }

      // Mostrar mensaje de éxito
      setSuccessMessage(true);
    } catch (error) {
      console.error(error);
      const feedbackMessage = getErrorMessage(error);
      setErrorMessage(feedbackMessage);

      // Reset reCAPTCHA en caso de error
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
    }
  });

  const handleRecaptchaChange = (token: string | null) => {
    setRecaptchaToken(token);
    if (token && errorMessage?.includes('reCAPTCHA')) {
      setErrorMessage(null);
    }
  };

  const handleRecaptchaExpired = () => {
    setRecaptchaToken(null);
    setErrorMessage(t('auth.recaptchaExpired'));
  };

  const handleRecaptchaError = () => {
    setRecaptchaToken(null);
    setErrorMessage(t('auth.recaptchaError'));
  };

  // Enhanced input styles with glassmorphism effect
  const inputStyles = {
    backgroundColor: 'transparent',
    borderRadius: 2,
    '& .MuiOutlinedInput-input': {
      backgroundColor: 'transparent !important',
      py: 1.75,
      '&:-webkit-autofill': {
        WebkitBoxShadow: '0 0 0 1000px transparent inset !important',
        WebkitTextFillColor: 'inherit !important',
        backgroundColor: 'transparent !important',
      },
      '&:-webkit-autofill:hover, &:-webkit-autofill:focus, &:-webkit-autofill:active': {
        WebkitBoxShadow: '0 0 0 1000px transparent inset !important',
        backgroundColor: 'transparent !important',
      },
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: (theme: any) => varAlpha(theme.vars.palette.primary.mainChannel, 0.3),
      borderWidth: 1.5,
      transition: 'all 0.3s ease',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'primary.main',
      borderWidth: 2,
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: 'primary.main',
      borderWidth: 2,
      boxShadow: (theme: any) =>
        `0 0 0 3px ${varAlpha(theme.vars.palette.primary.mainChannel, 0.15)}`,
    },
  };

  const renderForm = () => (
    <Box sx={{ gap: 2.5, display: 'flex', flexDirection: 'column' }}>
      {/* Email Field with Icon */}
      <Box component={m.div} variants={varFade('inUp', { distance: 24 })}>
        <Field.Text
          name="email"
          label={t('auth.login.email')}
          slotProps={{
            inputLabel: { shrink: true },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify
                    icon="solar:letter-bold"
                    width={22}
                    sx={{ color: 'primary.main', opacity: 0.7 }}
                  />
                </InputAdornment>
              ),
              sx: inputStyles,
            },
          }}
        />
      </Box>

      {/* Password Section */}
      <Box
        component={m.div}
        variants={varFade('inUp', { distance: 24 })}
        sx={{ gap: 1.5, display: 'flex', flexDirection: 'column' }}
      >
        <Field.Text
          name="password"
          label={t('auth.login.password')}
          placeholder=""
          type={showPassword.value ? 'text' : 'password'}
          slotProps={{
            inputLabel: { shrink: true },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify
                    icon="solar:shield-keyhole-bold-duotone"
                    width={22}
                    sx={{ color: 'primary.main', opacity: 0.7 }}
                  />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={showPassword.onToggle}
                    edge="end"
                    sx={{
                      color: 'text.secondary',
                      '&:hover': { color: 'primary.main' },
                    }}
                  >
                    <Iconify
                      icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                    />
                  </IconButton>
                </InputAdornment>
              ),
              sx: inputStyles,
            },
          }}
        />
      </Box>

      {/* reCAPTCHA */}
      <Box
        component={m.div}
        variants={varFade('inUp', { distance: 24 })}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mt: 1,
        }}
      >
        <Recaptcha
          key={`recaptcha-${colorScheme}`}
          ref={recaptchaRef}
          onChange={handleRecaptchaChange}
          onExpired={handleRecaptchaExpired}
          onError={handleRecaptchaError}
          size="normal"
          theme={colorScheme === 'dark' ? 'dark' : 'light'}
        />
      </Box>

      {/* Submit Button */}
      <Box component={m.div} variants={varScale('inX')}>
        <Button
          fullWidth
          color="primary"
          size="large"
          type="submit"
          variant="contained"
          loading={isSubmitting}
          loadingIndicator={t('auth.login.signInLoader')}
          disabled={!recaptchaToken}
          sx={{
            py: 1.5,
            mt: 1,
            fontSize: '1rem',
            fontWeight: 600,
            borderRadius: 2,
            textTransform: 'none',
            boxShadow: (theme) =>
              `0 8px 16px 0 ${varAlpha(theme.vars.palette.primary.mainChannel, 0.24)}`,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: (theme) =>
                `0 12px 24px 0 ${varAlpha(theme.vars.palette.primary.mainChannel, 0.32)}`,
            },
            '&:active': {
              transform: 'translateY(0)',
            },
            '&.Mui-disabled': {
              backgroundColor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.24),
            },
          }}
          startIcon={<Iconify icon="solar:inbox-in-bold-duotone" width={22} />}
        >
          {t('auth.login.submit')}
        </Button>
      </Box>
    </Box>
  );

  return (
    <MotionContainer>
      <Box component={m.div} variants={varFade('inUp', { distance: 40 })} sx={{ position: 'relative' }}>
        <Backdrop
          open={isSubmitting}
          sx={(theme) => ({
            position: 'absolute',
            zIndex: 10,
            color: 'primary.main',
            borderRadius: 2,
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            backgroundColor: varAlpha(theme.vars.palette.background.defaultChannel, 0.68),
            flexDirection: 'column',
            gap: 2,
          })}
        >
          <CircularProgress size={72} thickness={4.4} color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {t('auth.wsLogin.loading')}
          </Typography>
        </Backdrop>

        {/* Header Section */}
        <Box
          component={m.div}
          variants={varFade('inDown', { distance: 24 })}
          sx={{ mb: 4, textAlign: 'center' }}
        >
          {/* Animated Icon */}
          <Box
            component={m.div}
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            sx={(theme) => ({
              width: 72,
              height: 72,
              mx: 'auto',
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${theme.vars.palette.primary.main}, ${theme.vars.palette.primary.dark})`,
              boxShadow: `0 12px 24px -4px ${varAlpha(theme.vars.palette.primary.mainChannel, 0.4)}`,
            })}
          >
            <Iconify icon="solar:chat-round-dots-bold" width={36} sx={{ color: 'white' }} />
          </Box>

          {/* Title */}
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 1,
              background: (theme) =>
                `linear-gradient(135deg, ${theme.vars.palette.text.primary} 0%, ${theme.vars.palette.primary.main} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {t('auth.login.title')}
          </Typography>

          {/* Subtitle */}
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('auth.login.subtitle')}
          </Typography>
        </Box>

        {/* Error Alert */}
        {!!errorMessage && (
          <Box component={m.div} variants={varFade('inLeft')}>
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: 2,
                '& .MuiAlert-icon': { alignItems: 'center' },
              }}
              onClose={() => setErrorMessage(null)}
            >
              {errorMessage}
            </Alert>
          </Box>
        )}

        {/* No userId warning */}
        {!userId && (
          <Box component={m.div} variants={varFade('inLeft')}>
            <Alert
              severity="warning"
              sx={{
                mb: 3,
                borderRadius: 2,
                '& .MuiAlert-icon': { alignItems: 'center' },
              }}
            >
              {t('auth.wsLogin.errors.userIdMissingInUrl')}
            </Alert>
          </Box>
        )}

        {/* Success State */}
        {successMessage ? (
          <Box
            component={m.div}
            variants={varFade('inUp', { distance: 24 })}
            sx={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              py: 3,
            }}
          >
            <Box
              sx={(theme) => ({
                width: 64,
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                backgroundColor: varAlpha(theme.vars.palette.success.mainChannel, 0.12),
              })}
            >
              <Iconify icon="solar:check-circle-bold" width={40} sx={{ color: 'success.main' }} />
            </Box>

            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t('auth.wsLogin.success.title')}
            </Typography>

            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 320 }}>
              {t('auth.wsLogin.success.message')}
            </Typography>

            {senderId && whatsAppUrl && (
              <>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {t('auth.wsLogin.success.redirecting')}
                </Typography>

                <Button
                  variant="contained"
                  size="large"
                  onClick={() => { window.location.href = whatsAppUrl; }}
                  startIcon={<Iconify icon="solar:chat-round-dots-bold" width={22} />}
                  endIcon={
                    <Box
                      sx={{
                        position: 'relative',
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        ml: 0.5,
                        flexShrink: 0,
                      }}
                    >
                      <CircularProgress
                        variant="determinate"
                        value={countdown * 20}
                        size={32}
                        thickness={3.5}
                        sx={{
                          position: 'absolute',
                          color: 'rgba(255,255,255,0.55)',
                          transform: 'rotate(-90deg) !important',
                        }}
                      />
                      <Typography
                        component="span"
                        sx={{ fontWeight: 700, fontSize: '0.82rem', color: 'white', lineHeight: 1 }}
                      >
                        {countdown}
                      </Typography>
                    </Box>
                  }
                  sx={{
                    mt: 1,
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600,
                    textTransform: 'none',
                    backgroundColor: '#25D366',
                    boxShadow: '0 8px 16px 0 rgba(37,211,102,0.32)',
                    '&:hover': {
                      backgroundColor: '#1ebe5d',
                      boxShadow: '0 12px 24px 0 rgba(37,211,102,0.4)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  {t('auth.wsLogin.success.goToWhatsapp')}
                </Button>
              </>
            )}
          </Box>
        ) : (
          <>
            {/* Form */}
            <Form methods={methods} onSubmit={onSubmit}>
              {renderForm()}
            </Form>

            {/* Security Badge */}
            <Box
              component={m.div}
              variants={varFade('inUp', { distance: 24 })}
              sx={{
                mt: 4,
                pt: 3,
                borderTop: (theme) =>
                  `1px dashed ${varAlpha(theme.vars.palette.grey['500Channel'], 0.2)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
              }}
            >
              <Iconify icon="solar:shield-check-bold" width={20} sx={{ color: 'success.main' }} />
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                {t('auth.securityBadge')}
              </Typography>
            </Box>
          </>
        )}
      </Box>
    </MotionContainer>
  );
}
