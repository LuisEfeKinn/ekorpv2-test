'use client';

import type ReCAPTCHA from 'react-google-recaptcha';

import ReactReCAPTCHA from 'react-google-recaptcha';
import { useRef, forwardRef, useImperativeHandle } from 'react';

import Box from '@mui/material/Box';
import { useColorScheme } from '@mui/material/styles';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

export interface RecaptchaRef {
  reset: () => void;
  getValue: () => string | null;
  executeAsync: () => Promise<string | null>;
}

export interface RecaptchaProps {
  onChange?: (token: string | null) => void;
  onExpired?: () => void;
  onError?: () => void;
  size?: 'compact' | 'normal';
  theme?: 'light' | 'dark';
}

// ----------------------------------------------------------------------

export const Recaptcha = forwardRef<RecaptchaRef, RecaptchaProps>(
  ({ onChange, onExpired, onError, size = 'normal', theme: themeProp, ...other }, ref) => {
    const { colorScheme } = useColorScheme();
    const recaptchaRef = useRef<ReCAPTCHA>(null);

    const recaptchaTheme = themeProp || (colorScheme === 'dark' ? 'dark' : 'light');

    useImperativeHandle(ref, () => ({
      reset: () => {
        recaptchaRef.current?.reset();
      },
      getValue: () => recaptchaRef.current?.getValue() || null,
      executeAsync: async () => recaptchaRef.current?.executeAsync() || null,
    }));

    const handleChange = (token: string | null) => {
      onChange?.(token);
    };

    const handleExpired = () => {
      onExpired?.();
    };

    const handleError = () => {
      onError?.();
    };

    if (!CONFIG.recaptcha.siteKey) {
      console.warn('reCAPTCHA site key is not configured');
      return null;
    }

    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          '& > div': {
            borderRadius: 1,
            overflow: 'hidden',
          },
        }}
        {...other}
      >
        <ReactReCAPTCHA
          key={`recaptcha-${recaptchaTheme}`}
          ref={recaptchaRef}
          sitekey={CONFIG.recaptcha.siteKey}
          onChange={handleChange}
          onExpired={handleExpired}
          onError={handleError}
          size={size}
          theme={recaptchaTheme}
        />
      </Box>
    );
  }
);

Recaptcha.displayName = 'Recaptcha';