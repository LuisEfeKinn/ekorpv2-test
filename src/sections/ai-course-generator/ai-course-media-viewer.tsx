'use client';

// ----------------------------------------------------------------------
// AI Course Media Viewer Component
// Renders images, videos, documents using native HTML elements and embla-carousel
// ----------------------------------------------------------------------

import type { IAiCourseMedia } from 'src/types/ai-course-media';

import { useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogContent from '@mui/material/DialogContent';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  media: IAiCourseMedia[];
  showCarousel?: boolean;
};

// ----------------------------------------------------------------------

export function AiCourseMediaViewer({ media, showCarousel = true }: Props) {
  const [selectedMedia, setSelectedMedia] = useState<IAiCourseMedia | null>(null);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const handleOpenLightbox = (item: IAiCourseMedia) => {
    setSelectedMedia(item);
  };

  const handleCloseLightbox = () => {
    setSelectedMedia(null);
  };

  if (!media || media.length === 0) {
    return null;
  }

  // Single media item
  if (media.length === 1 || !showCarousel) {
    return (
      <>
        <MediaItem
          item={media[0]}
          onClick={() => handleOpenLightbox(media[0])}
        />
        <MediaLightbox
          media={selectedMedia}
          onClose={handleCloseLightbox}
        />
      </>
    );
  }

  // Carousel for multiple items
  return (
    <>
      <Box sx={{ position: 'relative' }}>
        <Box ref={emblaRef} sx={{ overflow: 'hidden', borderRadius: 2 }}>
          <Stack direction="row" sx={{ '& > *': { flex: '0 0 100%', minWidth: 0 } }}>
            {media.map((item) => (
              <MediaItem
                key={item.id}
                item={item}
                onClick={() => handleOpenLightbox(item)}
              />
            ))}
          </Stack>
        </Box>

        {/* Navigation buttons */}
        <IconButton
          onClick={scrollPrev}
          sx={{
            position: 'absolute',
            left: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            bgcolor: 'background.paper',
            boxShadow: 2,
            '&:hover': { bgcolor: 'background.default' },
          }}
        >
          <Iconify icon="solar:reply-bold" />
        </IconButton>

        <IconButton
          onClick={scrollNext}
          sx={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            bgcolor: 'background.paper',
            boxShadow: 2,
            '&:hover': { bgcolor: 'background.default' },
          }}
        >
          <Iconify icon="solar:forward-bold" />
        </IconButton>
      </Box>

      <MediaLightbox
        media={selectedMedia}
        onClose={handleCloseLightbox}
      />
    </>
  );
}

// ----------------------------------------------------------------------
// Media Item Component
// ----------------------------------------------------------------------

type MediaItemProps = {
  item: IAiCourseMedia;
  onClick?: () => void;
};

function MediaItem({ item, onClick }: MediaItemProps) {
  const { t } = useTranslate('ai-course');

  const renderMedia = () => {
    switch (item.type) {
      case 'image':
        return (
          <Card
            onClick={onClick}
            sx={{
              cursor: onClick ? 'pointer' : 'default',
              transition: 'all 0.3s ease',
              '&:hover': onClick ? {
                boxShadow: 4,
                transform: 'translateY(-2px)',
              } : {},
            }}
          >
            <Stack direction="row" spacing={2} sx={{ p: 2 }}>
              {/* Thumbnail Preview */}
              <Box
                sx={{
                  position: 'relative',
                  width: 120,
                  height: 90,
                  borderRadius: 1.5,
                  overflow: 'hidden',
                  flexShrink: 0,
                  bgcolor: 'grey.100',
                }}
              >
                <Box
                  component="img"
                  src={item.url}
                  alt={item.altText || item.name}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                {onClick && (
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
                      bgcolor: 'rgba(0, 0, 0, 0)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.4)',
                      },
                    }}
                  >
                    <Iconify 
                      icon="solar:eye-bold" 
                      width={24} 
                      sx={{ 
                        color: 'white',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                        '.MuiCard-root:hover &': {
                          opacity: 1,
                        },
                      }} 
                    />
                  </Box>
                )}
              </Box>

              <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Iconify icon="solar:gallery-circle-outline" width={18} sx={{ color: 'primary.main' }} />
                  <Typography variant="subtitle2" noWrap>
                    {item.caption || item.name || 'Imagen'}
                  </Typography>
                </Stack>
                {item.caption && (
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {item.caption}
                  </Typography>
                )}
                {onClick && (
                  <Typography variant="caption" color="primary" sx={{ mt: 'auto !important' }}>
                    {t('media.clickToExpand') || 'Click para expandir'}
                  </Typography>
                )}
              </Stack>
            </Stack>
          </Card>
        );

      case 'video':
        return (
          <Card
            sx={{
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: 2,
              },
            }}
          >
            <Stack direction="row" spacing={2} sx={{ p: 2 }}>
              {/* Video Thumbnail/Preview */}
              <Box
                sx={{
                  position: 'relative',
                  width: 160,
                  height: 90,
                  borderRadius: 1.5,
                  overflow: 'hidden',
                  flexShrink: 0,
                  bgcolor: 'grey.900',
                  cursor: 'pointer',
                }}
                onClick={onClick}
              >
                {item.bannerUrl ? (
                  <>
                    <Box
                      component="img"
                      src={item.bannerUrl}
                      alt={item.name}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: 'rgba(0, 0, 0, 0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.8)',
                          transform: 'translate(-50%, -50%) scale(1.1)',
                        },
                      }}
                    >
                      <Iconify icon="solar:play-circle-bold" width={20} sx={{ color: 'white', ml: 0.5 }} />
                    </Box>
                  </>
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'grey.800',
                    }}
                  >
                    <Iconify icon="solar:videocamera-record-bold" width={32} sx={{ color: 'grey.500' }} />
                  </Box>
                )}
              </Box>

              {/* Content */}
              <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Iconify icon="solar:videocamera-record-bold" width={18} sx={{ color: 'error.main' }} />
                  <Typography variant="subtitle2" noWrap>
                    {item.caption || item.name || 'Video'}
                  </Typography>
                </Stack>
                {item.caption && (
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {item.caption}
                  </Typography>
                )}
                {item.duration && (
                  <Chip
                    label={formatDuration(item.duration)}
                    size="small"
                    icon={<Iconify icon="solar:clock-circle-bold" width={14} />}
                    sx={{ width: 'fit-content', mt: 'auto !important' }}
                  />
                )}
                <Typography variant="caption" color="primary" sx={{ mt: 'auto !important' }}>
                  {t('media.clickToPlay')}
                </Typography>
              </Stack>
            </Stack>
          </Card>
        );

      case 'audio':
        return (
          <Card variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <IconButton sx={{ bgcolor: 'primary.light', color: 'primary.dark' }}>
                <Iconify icon="solar:notes-bold-duotone" width={24} />
              </IconButton>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2">{item.name}</Typography>
                {item.duration && (
                  <Typography variant="caption" color="text.secondary">
                    {formatDuration(item.duration)}
                  </Typography>
                )}
              </Box>
            </Stack>
            <Box sx={{ mt: 2 }}>
              <audio controls style={{ width: '100%' }}>
                <source src={item.url} type={item.mimeType} />
                {t('media.audioNotSupported')}
              </audio>
            </Box>
          </Card>
        );

      case 'document':
        return (
          <Card variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <IconButton sx={{ bgcolor: 'error.light', color: 'error.dark' }}>
                <Iconify icon="solar:file-bold-duotone" width={24} />
              </IconButton>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2">{item.name}</Typography>
                {item.size && (
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(item.size)}
                  </Typography>
                )}
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Iconify icon="solar:download-bold" />}
                href={item.url}
                target="_blank"
                download
              >
                {t('media.download')}
              </Button>
            </Stack>
          </Card>
        );

      default:
        return (
          <Card variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Iconify icon="solar:file-bold-duotone" width={32} color="text.secondary" />
              <Typography variant="body2">{item.name}</Typography>
            </Stack>
          </Card>
        );
    }
  };

  return renderMedia();
}

// ----------------------------------------------------------------------
// Media Lightbox Component
// ----------------------------------------------------------------------

type MediaLightboxProps = {
  media: IAiCourseMedia | null;
  onClose: () => void;
};

function MediaLightbox({ media, onClose }: MediaLightboxProps) {
  if (!media) return null;

  return (
    <Dialog
      open={!!media}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          bgcolor: 'transparent',
          boxShadow: 'none',
          maxWidth: '95vw',
          maxHeight: '95vh',
        },
      }}
    >
      <DialogContent sx={{ p: 0, position: 'relative', bgcolor: 'transparent' }}>
        {/* Close Button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: -50,
            right: 0,
            zIndex: 10,
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.2)',
            },
          }}
        >
          <Iconify icon="solar:close-circle-bold" width={24} />
        </IconButton>

        {/* Image */}
        {media.type === 'image' && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 200,
            }}
          >
            <Box
              component="img"
              src={media.url}
              alt={media.altText || media.name}
              sx={{
                maxWidth: '100%',
                maxHeight: '90vh',
                objectFit: 'contain',
                borderRadius: 2,
                boxShadow: 24,
              }}
            />
          </Box>
        )}

        {/* Video */}
        {media.type === 'video' && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              component="video"
              src={media.url}
              poster={media.thumbnailUrl}
              autoPlay
              controls
              sx={{
                maxWidth: '100%',
                maxHeight: '90vh',
                borderRadius: 2,
                boxShadow: 24,
                bgcolor: 'grey.900',
              }}
            />
          </Box>
        )}

        {/* Caption */}
        {media.caption && (
          <Box
            sx={{
              position: 'absolute',
              bottom: -50,
              left: 0,
              right: 0,
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" sx={{ color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
              {media.caption}
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------------
// Helper functions
// ----------------------------------------------------------------------

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
