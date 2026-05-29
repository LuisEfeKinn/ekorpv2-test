'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function ReceiptIdDocumentForm() {
  const router = useRouter();
  const { t } = useTranslate('common');

  const [documentId, setDocumentId] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Validar que solo sean números
  const handleDocumentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    
    // Permitir solo números
    if (value === '' || /^\d+$/.test(value)) {
      setDocumentId(value);
      setError(null);
    }
  };

  // Validar y proceder
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    // Validar longitud
    if (documentId.length < 7) {
      const errorMsg = t('resetBiometric.receiptIdDoc.errorMinLength');
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (documentId.length > 15) {
      const errorMsg = t('resetBiometric.receiptIdDoc.errorMaxLength');
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // Si pasa las validaciones, navegar a la siguiente vista
    toast.success(t('resetBiometric.receiptIdDoc.validDocument'));
    router.push(paths.auth.jwt.resetBiometricUser(documentId));
  };

  return (
    <Card
      sx={{
        p: 5,
        maxWidth: 500,
        mx: 'auto',
        boxShadow: (theme) => theme.customShadows.z24,
      }}
    >
      {/* Icono decorativo */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mb: 3,
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: (theme) => theme.palette.primary.lighter,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Iconify 
            icon="solar:file-bold-duotone" 
            width={48}
            sx={{ color: 'primary.main' }}
          />
        </Box>
      </Box>

      {/* Título y descripción */}
      <Typography variant="h4" sx={{ mb: 1, textAlign: 'center' }}>
        {t('resetBiometric.receiptIdDoc.title')}
      </Typography>
      
      <Typography 
        variant="body2" 
        sx={{ 
          mb: 4, 
          textAlign: 'center',
          color: 'text.secondary',
        }}
      >
        {t('resetBiometric.receiptIdDoc.description')}
      </Typography>

      {/* Formulario */}
      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <TextField
            fullWidth
            required
            label={t('resetBiometric.receiptIdDoc.documentIdLabel')}
            placeholder={t('resetBiometric.receiptIdDoc.documentIdPlaceholder')}
            value={documentId}
            onChange={handleDocumentChange}
            error={!!error}
            helperText={
              error || 
              t('resetBiometric.receiptIdDoc.documentIdHelper', { min: 7, max: 15 })
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="solar:user-id-bold" width={24} />
                </InputAdornment>
              ),
            }}
            inputProps={{
              maxLength: 15,
              inputMode: 'numeric',
              pattern: '[0-9]*',
            }}
          />

          {/* Información adicional */}
          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: 'background.neutral',
              border: (theme) => `1px dashed ${theme.palette.divider}`,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <Iconify 
                icon="solar:info-circle-bold" 
                width={20}
                sx={{ color: 'info.main', mt: 0.3 }}
              />
              <Typography variant="caption" color="text.secondary">
                {t('resetBiometric.receiptIdDoc.infoText')}
              </Typography>
            </Stack>
          </Box>

          {/* Botones */}
          <Stack direction="row" spacing={2}>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={() => router.back()}
            >
              {t('resetBiometric.receiptIdDoc.back')}
            </Button>

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={documentId.length < 7 || documentId.length > 15}
            >
              {t('resetBiometric.receiptIdDoc.continue')}
            </Button>
          </Stack>
        </Stack>
      </form>

      {/* Ayuda adicional */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="caption" color="text.disabled">
          {t('resetBiometric.receiptIdDoc.footerText')}
        </Typography>
      </Box>
    </Card>
  );
}
