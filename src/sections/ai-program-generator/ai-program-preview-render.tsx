'use client';

// ----------------------------------------------------------------------
// AI Program Preview Render Component
// ----------------------------------------------------------------------

import type { IAiProgram } from 'src/types/ai-program-generation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  program: IAiProgram;
};

// ----------------------------------------------------------------------

export function AiProgramPreviewRender({ program }: Props) {
  const { t } = useTranslate('ai');

  return (
    <Stack spacing={{ xs: 2, sm: 3 }}>
      {/* Program Header */}
      <Card sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Banner */}
        {program.bannerUrl && (
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
              src={program.bannerUrl}
              alt={program.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Box>
        )}

        {/* Cover Image + Title */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 3 }}>
          {program.imageUrl && (
            <Box
              sx={{
                width: { xs: '100%', sm: 200 },
                height: { xs: 200, sm: 200 },
                borderRadius: 2,
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              <img
                src={program.imageUrl}
                alt={program.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
          )}

          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h3"
              gutterBottom
              sx={{ fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' }, lineHeight: 1.2, mb: 2 }}
            >
              {program.name}
            </Typography>

            <Typography
              variant="body1"
              color="text.secondary"
              paragraph
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              {program.description}
            </Typography>
          </Box>
        </Stack>

        {/* Metadata chips */}
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2, gap: { xs: 0.75, sm: 1 } }}>
          {program.duration && (
            <Chip
              icon={<Iconify icon="solar:clock-circle-bold" width={16} />}
              label={program.duration}
              size="small"
              variant="outlined"
            />
          )}
          <Chip
            icon={<Iconify icon="solar:book-bold" width={16} />}
            label={t('ai-program-generation.coursesCount', { count: program.courses?.length || 0 })}
            size="small"
            variant="outlined"
          />
          <Chip
            label={program.isActive ? t('ai-program-generation.status.active') : t('ai-program-generation.status.inactive')}
            size="small"
            variant="soft"
            color={program.isActive ? 'success' : 'default'}
          />
        </Stack>

        {/* Tags */}
        {program.tags && (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: { xs: 0.5, sm: 0.75 } }}>
            {program.tags.split(',').filter(Boolean).map((tag, index) => (
              <Chip key={index} label={tag.trim()} size="small" variant="soft" color="primary" />
            ))}
          </Stack>
        )}
      </Card>

      {/* Details */}
      {(program.objective || program.skillsToAcquire || program.whatYouWillLearn) && (
        <Card sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack spacing={3}>
            {program.objective && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Iconify icon="solar:star-bold" width={22} sx={{ mr: 1 }} />
                  {t('ai-program-generation.preview.objective')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {program.objective}
                </Typography>
              </Box>
            )}

            {program.skillsToAcquire && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Iconify icon="solar:star-bold" width={22} sx={{ mr: 1 }} />
                  {t('ai-program-generation.preview.skillsToAcquire')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {program.skillsToAcquire}
                </Typography>
              </Box>
            )}

            {program.whatYouWillLearn && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Iconify icon="solar:star-bold" width={22} sx={{ mr: 1 }} />
                  {t('ai-program-generation.preview.whatYouWillLearn')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {program.whatYouWillLearn}
                </Typography>
              </Box>
            )}
          </Stack>
        </Card>
      )}

      {/* Video */}
      {program.videoUrl && (
        <Card sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Iconify icon="solar:videocamera-record-bold" width={22} sx={{ mr: 1 }} />
            {t('ai-program-generation.preview.video')}
          </Typography>
          <Box
            sx={{
              borderRadius: 2,
              overflow: 'hidden',
              position: 'relative',
              pt: '56.25%',
              bgcolor: 'grey.100',
            }}
          >
            <video
              src={program.videoUrl}
              controls
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </Box>
        </Card>
      )}

      {/* Courses */}
      {program.courses && program.courses.length > 0 && (
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
            {t('ai-program-generation.coursesIncluded', { count: program.courses.length })}
          </Typography>
          <Stack spacing={2}>
            {program.courses.map((course, idx) => (
              <Card key={idx} variant="outlined" sx={{ overflow: 'hidden' }}>
                <Stack direction={{ xs: 'column', sm: 'row' }}>
                  {course.image && (
                    <Box
                      component="img"
                      src={course.image}
                      alt={course.displayName}
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
                        {idx + 1}
                      </Box>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontSize: { xs: '0.9375rem', sm: '1rem' }, lineHeight: 1.4 }}
                      >
                        {course.displayName}
                      </Typography>
                    </Stack>
                    {course.shortDescription && (
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
                        {course.shortDescription}
                      </Typography>
                    )}
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
