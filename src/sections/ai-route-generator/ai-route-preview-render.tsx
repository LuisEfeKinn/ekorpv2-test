'use client';

// ----------------------------------------------------------------------
// AI Route Preview Render Component
// ----------------------------------------------------------------------

import type { IAiRoute } from 'src/types/ai-route-generation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  route: IAiRoute;
};

// ----------------------------------------------------------------------

export function AiRoutePreviewRender({ route }: Props) {
  const { t } = useTranslate('ai');

  return (
    <Stack spacing={{ xs: 2, sm: 3 }}>
      {/* Route Header */}
      <Card sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Banner */}
        {route.bannerUrl && (
          <Box
            sx={{
              mb: { xs: 2, sm: 3 },
              borderRadius: 2,
              overflow: 'hidden',
              height: { xs: 160, sm: 200, md: 240 },
              bgcolor: 'grey.100',
            }}
          >
            <img
              src={route.bannerUrl}
              alt={route.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Box>
        )}

        <Typography
          variant="h3"
          gutterBottom
          sx={{ fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' }, lineHeight: 1.2, mb: 2 }}
        >
          {route.title}
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          paragraph
          sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
        >
          {route.description}
        </Typography>

        {/* Metadata chips */}
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2, gap: { xs: 0.75, sm: 1 } }}>
          <Chip
            icon={<Iconify icon="solar:book-bold" width={16} />}
            label={t('ai-route-generation.modulesCount', { count: route.modules?.length || 0 })}
            size="small"
            variant="outlined"
          />
          {route.positionName && (
            <Chip
              icon={<Iconify icon="solar:ssd-round-bold" width={16} />}
              label={route.positionName}
              size="small"
              variant="outlined"
              color="info"
            />
          )}
        </Stack>

        {/* Tags */}
        {route.tags?.length > 0 && (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: { xs: 0.5, sm: 0.75 } }}>
            {route.tags.map((tag, index) => (
              <Chip key={index} label={tag} size="small" variant="soft" color="primary" />
            ))}
          </Stack>
        )}
      </Card>

      {/* Modules */}
      {route.modules?.length > 0 && (
        <Card sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              fontSize: { xs: '1.125rem', sm: '1.5rem' },
              display: 'flex',
              alignItems: 'center',
              mb: { xs: 1.5, sm: 2 },
            }}
          >
            <Iconify icon="solar:book-bold" width={24} sx={{ mr: 1 }} />
            {t('ai-route-generation.modulesIncluded', { count: route.modules.length })}
          </Typography>
          <Stack spacing={2}>
            {route.modules.map((mod, modIdx) => (
              <Card key={modIdx} variant="outlined" sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Stack spacing={1.5}>
                  {/* Module header */}
                  <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        color: 'common.white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        flexShrink: 0,
                      }}
                    >
                      {modIdx + 1}
                    </Box>
                    {mod.competencyName && (
                      <Chip label={mod.competencyName} size="small" variant="outlined" color="info" />
                    )}
                    {mod.skillLevelName && (
                      <Chip label={mod.skillLevelName} size="small" variant="soft" color="warning" />
                    )}
                  </Stack>

                  {/* Learning objects */}
                  <Stack spacing={1.5}>
                    {mod.learningObjects.map((lo, loIdx) => (
                      <Card key={lo.learningObjectId || loIdx} variant="outlined" sx={{ overflow: 'hidden' }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }}>
                          {lo.image && (
                            <Box
                              component="img"
                              src={lo.image}
                              alt={lo.displayName}
                              sx={{
                                width: { xs: '100%', sm: 140 },
                                height: { xs: 160, sm: 'auto' },
                                objectFit: 'cover',
                                flexShrink: 0,
                              }}
                            />
                          )}
                          <Stack spacing={0.5} sx={{ p: { xs: 1.5, sm: 2 }, flex: 1, minWidth: 0 }}>
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                              <Chip label={loIdx + 1} size="small" color="default" sx={{ flexShrink: 0 }} />
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  fontSize: { xs: '0.9375rem', sm: '1rem' },
                                  lineHeight: 1.4,
                                }}
                              >
                                {lo.displayName}
                              </Typography>
                              {lo.isOptional && (
                                <Chip label={t('ai-route-generation.optional')} size="small" variant="soft" color="default" />
                              )}
                            </Stack>
                            {lo.shortDescription && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  mt: 0.5,
                                  fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                                  lineHeight: 1.5,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {lo.shortDescription}
                              </Typography>
                            )}
                          </Stack>
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                </Stack>
              </Card>
            ))}
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
