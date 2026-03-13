'use client';

import type { IAiProviderSetting } from 'src/types/ai-provider-settings';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  setting: IAiProviderSetting;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

export function AiProviderSettingsCard({ setting, onView, onEdit, onDelete }: Props) {
  const router = useRouter();
  const { t } = useTranslate('ai');
  const popover = usePopover();

  return (
    <>
      <Card sx={{ p: 3 }}>
        <Stack spacing={2}>
          {/* Header con avatar y acciones */}
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                alt={setting.name}
                src={setting.logo || undefined}
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
                }}
              >
                {!setting.logo && setting.name.charAt(0).toUpperCase()}
              </Avatar>

              <Box>
                <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
                  {setting.name}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Label color={setting.isActive ? 'success' : 'default'}>
                    {setting.isActive ? t('settings.status.active') : t('settings.status.inactive')}
                  </Label>
                  <Label color={setting.isAvailable ? 'info' : 'warning'}>
                    {setting.isAvailable ? t('settings.status.available') : t('settings.status.unavailable')}
                  </Label>
                </Stack>
              </Box>
            </Stack>

            <IconButton onClick={popover.onOpen}>
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Stack>

          <Divider sx={{ borderStyle: 'dashed' }} />

          {/* Información del proveedor */}
          <Stack spacing={1}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify
                icon={"mdi:api" as any}
                width={20}
                sx={{ color: 'text.secondary' }}
              />
              <Typography variant="body2" color="text.secondary">
                {t('settings.card.requiresApiKey')}:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {setting.requiresApiKey ? t('settings.card.yes') : t('settings.card.no')}
              </Typography>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify
                icon={"mdi:stream" as any}
                width={20}
                sx={{ color: 'text.secondary' }}
              />
              <Typography variant="body2" color="text.secondary">
                {t('settings.card.supportsStreaming')}:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {setting.supportsStreaming ? t('settings.card.yes') : t('settings.card.no')}
              </Typography>
            </Stack>

            {setting.parameters && setting.parameters.length > 0 && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Iconify
                  icon={"mdi:code-braces" as any}
                  width={20}
                  sx={{ color: 'text.secondary' }}
                />
                <Typography variant="body2" color="text.secondary">
                  {t('settings.card.parameters')}:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {setting.parameters.length}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Stack>
      </Card>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              popover.onClose();
              router.push(paths.dashboard.ai.modelsSettings.root(setting.id));
            }}
          >
            <Iconify icon="solar:eye-bold" />
            {t('settings.actions.models')}
          </MenuItem>

          <MenuItem
            onClick={() => {
              popover.onClose();
              onEdit(setting.id);
            }}
          >
            <Iconify icon="solar:pen-bold" />
            {t('settings.actions.edit')}
          </MenuItem>

          <Divider sx={{ borderStyle: 'dashed' }} />

          <MenuItem
            onClick={() => {
              popover.onClose();
              onDelete(setting.id);
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            {t('settings.actions.delete')}
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </>
  );
}
