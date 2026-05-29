import type { IConfigureTest } from 'src/types/performance';
import type { IconifyName } from 'src/components/iconify/register-icons';

import { varAlpha } from 'minimal-shared/utils';
import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

const TYPE_COLOR: Record<string, 'primary' | 'warning' | 'info' | 'success'> = {
  COMPETENCY: 'primary',
  OBJECTIVES: 'warning',
  MIXED: 'success',
};

const TYPE_ICON: Record<string, IconifyName> = {
  COMPETENCY: 'solar:cup-star-bold-duotone',
  OBJECTIVES: 'solar:flag-bold-duotone',
  MIXED: 'solar:documents-bold-duotone',
};

// ----------------------------------------------------------------------

type Props = {
  tests: IConfigureTest[];
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
};

export function ConfigureTestsCardView({ tests, onEdit, onDuplicate, onDelete }: Props) {
  const theme = useTheme();
  const { t } = useTranslate('performance');

  if (tests.length === 0) {
    return (
      <Box
        sx={{
          py: 10,
          textAlign: 'center',
          borderRadius: 2,
          border: `2px dashed ${alpha(theme.palette.grey[500], 0.2)}`,
          bgcolor: alpha(theme.palette.grey[500], 0.04),
        }}
      >
        <Iconify icon="solar:file-text-bold" width={64} sx={{ color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          {t('configure-tests.cards.empty.title')}
        </Typography>
        <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
          {t('configure-tests.cards.empty.subtitle')}
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {tests.map((test) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={test.id}>
          <TestCard
            test={test}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        </Grid>
      ))}
    </Grid>
  );
}

// ----------------------------------------------------------------------

type TestCardProps = {
  test: IConfigureTest;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
};

function TestCard({ test, onEdit, onDuplicate, onDelete }: TestCardProps) {
  const theme = useTheme();
  const { t } = useTranslate('performance');
  const menuActions = usePopover();

  const typeColor = TYPE_COLOR[test.type] ?? 'info';
  const typeIcon = TYPE_ICON[test.type] ?? 'solar:documents-bold-duotone';
  const palette = theme.palette[typeColor];

  const translateType = (type: string) => t(`configure-evaluations.types.${type}`);

  const renderCover = (
    <Box
      sx={{
        position: 'relative',
        height: 140,
        overflow: 'hidden',
        backgroundImage: test.coverImage
          ? `url(${test.coverImage})`
          : `linear-gradient(135deg, ${varAlpha(theme.vars.palette[typeColor].darkChannel, 0.8)}, ${varAlpha(theme.vars.palette[typeColor].mainChannel, 0.6)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Decorative icon background */}
      {!test.coverImage && (
        <Iconify
          icon={typeIcon}
          sx={{
            position: 'absolute',
            right: -16,
            bottom: -16,
            width: 120,
            height: 120,
            opacity: 0.15,
            color: 'common.white',
            transform: 'rotate(-10deg)',
          }}
        />
      )}

      {/* Status chip — top left */}
      <Chip
        size="small"
        label={
          test.isActive
            ? t('configure-tests.cards.status.active')
            : t('configure-tests.cards.status.inactive')
        }
        sx={{
          position: 'absolute',
          top: 12,
          left: 12,
          fontWeight: 600,
          fontSize: '0.75rem',
          height: 24,
          bgcolor: test.isActive
            ? alpha(theme.palette.success.main, 0.9)
            : alpha(theme.palette.grey[600], 0.9),
          color: 'common.white',
          backdropFilter: 'blur(8px)',
          border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
        }}
      />

      {/* Kebab menu — top right */}
      <IconButton
        size="small"
        onClick={menuActions.onOpen}
        sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          bgcolor: alpha(theme.palette.common.black, 0.25),
          backdropFilter: 'blur(6px)',
          color: 'common.white',
          '&:hover': {
            bgcolor: alpha(theme.palette.common.black, 0.4),
            transform: 'scale(1.1)',
          },
          transition: 'all 0.2s ease-in-out',
        }}
      >
        <Iconify icon="eva:more-vertical-fill" width={18} />
      </IconButton>
    </Box>
  );

  const renderContent = (
    <Stack spacing={2} sx={{ p: 3, pb: 2, flexGrow: 1 }}>
      {/* Type chip */}
      <Chip
        label={translateType(test.type)}
        size="small"
        variant="soft"
        color={typeColor}
        sx={{ 
          alignSelf: 'flex-start',
          fontWeight: 600,
          fontSize: '0.75rem',
        }}
      />

      {/* Name */}
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          fontSize: '1.1rem',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: 1.3,
          minHeight: 42,
          color: 'text.primary',
        }}
      >
        {test.name}
      </Typography>

      {/* Description */}
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: 48,
          lineHeight: 1.5,
          fontSize: '0.875rem',
        }}
      >
        {test.description || t('configure-tests.cards.noDescription')}
      </Typography>
    </Stack>
  );

  const renderFooter = (
    <>
      <Divider sx={{ borderStyle: 'dashed', opacity: 0.6 }} />
      <Stack
        direction="row"
        alignItems="center"
        spacing={2.5}
        sx={{ px: 3, py: 2 }}
      >
        {/* Competences */}
        <Tooltip title={t('configure-tests.cards.tooltips.competences')} placement="top" arrow>
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            sx={{
              flexShrink: 0,
              cursor: 'default',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              bgcolor: alpha(palette.main, 0.08),
              border: `1px solid ${alpha(palette.main, 0.16)}`,
            }}
          >
            <Iconify icon="solar:cup-star-bold" width={15} sx={{ color: palette.main }} />
            <Typography variant="caption" fontWeight={700} sx={{ color: palette.dark }}>
              {test.totalCompetences}
            </Typography>
          </Stack>
        </Tooltip>

        {/* Objectives */}
        <Tooltip title={t('configure-tests.cards.tooltips.objectives')} placement="top" arrow>
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            sx={{
              flexShrink: 0,
              cursor: 'default',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              bgcolor: alpha(palette.main, 0.08),
              border: `1px solid ${alpha(palette.main, 0.16)}`,
            }}
          >
            <Iconify icon="solar:flag-bold" width={15} sx={{ color: palette.main }} />
            <Typography variant="caption" fontWeight={700} sx={{ color: palette.dark }}>
              {test.totalObjectives}
            </Typography>
          </Stack>
        </Tooltip>

        <Box sx={{ flexGrow: 1 }} />

        {/* Date */}
        <Tooltip title={t('configure-tests.cards.tooltips.updatedAt')} placement="top" arrow>
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ cursor: 'default' }}>
            <Iconify icon="solar:calendar-date-bold" width={16} sx={{ color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
              {fDate(test.updatedAt ?? test.createdAt)}
            </Typography>
          </Stack>
        </Tooltip>
      </Stack>
    </>
  );

  return (
    <>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          overflow: 'hidden',
          transition: theme.transitions.create(['box-shadow', 'transform'], {
            duration: theme.transitions.duration.standard,
          }),
          '&:hover': {
            boxShadow: theme.customShadows?.z24,
            transform: 'translateY(-6px)',
          },
          border: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
        }}
      >
        {renderCover}
        {renderContent}
        {renderFooter}
      </Card>

      <CustomPopover
        open={menuActions.open}
        anchorEl={menuActions.anchorEl}
        onClose={menuActions.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              menuActions.onClose();
              onEdit(test.id);
            }}
          >
            <Iconify icon="solar:pen-bold" />
            {t('configure-tests.actions.edit')}
          </MenuItem>

          <MenuItem
            onClick={() => {
              menuActions.onClose();
              onDuplicate(test.id);
            }}
          >
            <Iconify icon="solar:copy-bold" />
            {t('configure-tests.actions.duplicate')}
          </MenuItem>

          <Divider sx={{ borderStyle: 'dashed' }} />

          <MenuItem
            onClick={() => {
              menuActions.onClose();
              onDelete(test.id);
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            {t('configure-tests.actions.delete')}
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </>
  );
}
