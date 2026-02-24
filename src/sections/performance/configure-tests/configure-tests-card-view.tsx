import type { IConfigureTest } from 'src/types/performance';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardContent from '@mui/material/CardContent';
import { alpha, useTheme } from '@mui/material/styles';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  tests: IConfigureTest[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

export function ConfigureTestsCardView({ tests, onEdit, onDelete }: Props) {
  const theme = useTheme();
  const { t } = useTranslate('performance');

  const translateType = (type: string) => t(`configure-evaluations.types.${type}`);

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
        <Iconify
          icon="solar:file-text-bold"
          width={64}
          sx={{ color: 'text.disabled', mb: 2 }}
        />
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
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={test.id}>
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              transition: 'all 0.3s',
              '&:hover': {
                boxShadow: theme.customShadows?.z20,
                transform: 'translateY(-4px)',
              },
            }}
          >
            {/* Cover Image */}
            <Box
              sx={{
                position: 'relative',
                pt: '56.25%', // 16:9 aspect ratio
                overflow: 'hidden',
                background: test.coverImage
                  ? `url(${test.coverImage}) center/cover`
                  : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.primary.dark, 0.4)} 100%)`,
              }}
            >
              {!test.coverImage && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Iconify
                    icon="solar:file-text-bold"
                    width={64}
                    sx={{ color: alpha(theme.palette.common.white, 0.5) }}
                  />
                </Box>
              )}

              {/* Status Badge */}
              <Chip
                label={
                  test.isActive
                    ? t('configure-tests.cards.status.active')
                    : t('configure-tests.cards.status.inactive')
                }
                color={test.isActive ? 'success' : 'default'}
                size="small"
                sx={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  fontWeight: 600,
                }}
              />

              {/* Action Buttons */}
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => onEdit(test.id)}
                  sx={{
                    bgcolor: alpha(theme.palette.common.white, 0.9),
                    '&:hover': {
                      bgcolor: theme.palette.common.white,
                    },
                  }}
                >
                  <Iconify icon="solar:pen-bold" width={18} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => onDelete(test.id)}
                  sx={{
                    bgcolor: alpha(theme.palette.common.white, 0.9),
                    color: 'error.main',
                    '&:hover': {
                      bgcolor: theme.palette.common.white,
                    },
                  }}
                >
                  <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                </IconButton>
              </Stack>
            </Box>

            {/* Content */}
            <CardContent sx={{ flexGrow: 1, p: 3 }}>
              <Stack spacing={2}>
                {/* Title */}
                <Typography variant="h6" noWrap>
                  {test.name}
                </Typography>

                {/* Description */}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    minHeight: 40,
                  }}
                >
                  {test.description || t('configure-tests.cards.noDescription')}
                </Typography>

                {/* Type Badge */}
                <Box>
                  <Chip label={translateType(test.type)} variant="soft" color="primary" size="small" />
                </Box>

                {/* Stats */}
                <Stack direction="row" spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: alpha(theme.palette.warning.main, 0.16),
                        color: 'warning.main',
                      }}
                    >
                      <Iconify icon="solar:cup-star-bold" width={18} />
                    </Avatar>
                    <Box>
                      <Typography variant="caption" color="text.disabled" display="block">
                        {t('configure-tests.cards.competences')}
                      </Typography>
                      <Typography variant="subtitle2">{test.totalCompetences}</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: alpha(theme.palette.success.main, 0.16),
                        color: 'success.main',
                      }}
                    >
                      <Iconify icon="solar:flag-bold" width={18} />
                    </Avatar>
                    <Box>
                      <Typography variant="caption" color="text.disabled" display="block">
                        {t('configure-tests.cards.objectives')}
                      </Typography>
                      <Typography variant="subtitle2">{test.totalObjectives}</Typography>
                    </Box>
                  </Box>
                </Stack>

                {/* Date */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pt: 1 }}>
                  <Iconify icon="solar:calendar-date-bold" width={16} sx={{ color: 'text.disabled' }} />
                  <Typography variant="caption" color="text.disabled">
                    {fDate(test.createdAt)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
