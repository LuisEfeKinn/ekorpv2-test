'use client';

import * as z from 'zod';
import { m } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { varAlpha } from 'minimal-shared/utils';
import { useBoolean } from 'minimal-shared/hooks';
import { useRef, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { useColorScheme } from '@mui/material/styles';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaUtils } from 'src/components/hook-form';
import { Recaptcha, type RecaptchaRef } from 'src/components/recaptcha';
import { varFade, varScale, MotionContainer } from 'src/components/animate';

import { useAuthContext } from '../../hooks';
import { getErrorMessage } from '../../utils';
import { signInWithPassword } from '../../context/jwt';

// ----------------------------------------------------------------------

export type SignInSchemaType = z.infer<typeof SignInSchema>;

export const SignInSchema = z.object({
  email: schemaUtils.email(),
  password: z
    .string()
    .min(1, { error: 'Password is required!' })
    .min(6, { error: 'Password must be at least 6 characters!' }),
});

// ----------------------------------------------------------------------

export function JwtSignInView() {
  const { t } = useTranslate();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { colorScheme } = useColorScheme();

  const showPassword = useBoolean();

  const { checkUserSession } = useAuthContext();

  const recaptchaRef = useRef<RecaptchaRef>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const defaultValues: SignInSchemaType = {
    email: '',
    password: '',
  };

  const methods = useForm({
    resolver: zodResolver(SignInSchema),
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

      await signInWithPassword({ email: data.email, password: data.password });
      await checkUserSession?.();

      // Obtener ruta de redirección
      const returnTo = searchParams.get('returnTo');

      if (returnTo) {
        router.push(returnTo);
      } else {
        // Recargar para que el sistema determine la ruta según el nuevo usuario
        router.refresh();
      }
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
    // Limpiar mensaje de error si existe
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
        <Link
          component={RouterLink}
          href="#"
          variant="body2"
          sx={{
            alignSelf: 'flex-end',
            color: 'primary.main',
            fontWeight: 500,
            transition: 'all 0.2s',
            '&:hover': {
              color: 'primary.dark',
              textDecoration: 'none',
            },
          }}
        >
          {t('auth.login.forgotPassword')}
        </Link>

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
      <Box
        component={m.div}
        variants={varFade('inUp', { distance: 40 })}
      >
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
              <Iconify icon="solar:user-rounded-bold" width={36} sx={{ color: 'white' }} />
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
              {t('auth.login.subtitle')}{' '}
              <Link
                component={RouterLink}
                href={paths.auth.jwt.signUp}
                sx={{
                  color: 'primary.main',
                  fontWeight: 600,
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                {t('auth.login.getStarted')}
              </Link>
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

          {/* Form */}
          <Form methods={methods} onSubmit={onSubmit}>
            {renderForm()}
          </Form>

          {/* Divider */}
          <Box
            component={m.div}
            variants={varFade('inUp', { distance: 24 })}
            sx={{ my: 3 }}
          >
            <Divider
              sx={{
                '&::before, &::after': {
                  borderColor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.2),
                },
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: 'text.disabled',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  letterSpacing: 1,
                }}
              >
                {t('auth.biometricDivider')}
              </Typography>
            </Divider>
          </Box>

          {/* Biometric Options */}
          <Box
            component={m.div}
            variants={varFade('inUp', { distance: 24 })}
            sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}
          >
            <Button
              fullWidth
              component={RouterLink}
              href={paths.auth.jwt.receiptBiometricSignIn}
              variant="outlined"
              startIcon={<Iconify icon="solar:user-id-bold" width={20} />}
              sx={{
                py: 1.25,
                borderRadius: 2,
                borderWidth: 1.5,
                textTransform: 'none',
                fontWeight: 500,
                borderColor: (theme) => varAlpha(theme.vars.palette.primary.mainChannel, 0.5),
                color: 'primary.main',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderWidth: 1.5,
                  borderColor: 'primary.main',
                  backgroundColor: (theme) => varAlpha(theme.vars.palette.primary.mainChannel, 0.08),
                  transform: 'translateY(-2px)',
                },
              }}
            >
              {t('auth.login.faceIdSignIn')}
            </Button>

            <Button
              fullWidth
              component={RouterLink}
              href={paths.auth.jwt.receiptBiometricIdDocument}
              variant="outlined"
              startIcon={<Iconify icon="solar:restart-bold" width={20} />}
              sx={{
                py: 1.25,
                borderRadius: 2,
                borderWidth: 1.5,
                textTransform: 'none',
                fontWeight: 500,
                borderColor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.32),
                color: 'text.secondary',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderWidth: 1.5,
                  borderColor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.48),
                  backgroundColor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
                  transform: 'translateY(-2px)',
                },
              }}
            >
              {t('auth.login.faceIdReset')}
            </Button>
          </Box>

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
            <Iconify
              icon="solar:shield-check-bold"
              width={20}
              sx={{ color: 'success.main' }}
            />
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {t('auth.securityBadge')}
            </Typography>
          </Box>
        </Box>
    </MotionContainer>
  );
}