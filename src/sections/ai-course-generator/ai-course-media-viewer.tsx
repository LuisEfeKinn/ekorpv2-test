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
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={{ xs: 0, sm: 2 }} 
              sx={{ height: '100%' }}
            >
              {/* Thumbnail Preview */}
              <Box
                sx={{
                  position: 'relative',
                  width: { xs: '100%', sm: 200 },
                  height: { xs: 200, sm: 120 },
                  flexShrink: 0,
                  bgcolor: 'grey.100',
                  overflow: 'hidden',
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
                    <Box
                      sx={{
                        width: { xs: 56, sm: 48 },
                        height: { xs: 56, sm: 48 },
                        borderRadius: '50%',
                        bgcolor: 'rgba(255, 255, 255, 0.95)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                        '.MuiCard-root:hover &': {
                          opacity: 1,
                          transform: 'scale(1.05)',
                        },
                      }}
                    >
                      <Iconify 
                        icon="solar:eye-bold" 
                        width={24}
                        sx={{ 
                          color: 'primary.main',
                          width: { xs: 28, sm: 24 },
                          height: { xs: 28, sm: 24 },
                        }} 
                      />
                    </Box>
                  </Box>
                )}
              </Box>

              <Stack spacing={1} sx={{ flex: 1, p: { xs: 2, sm: 2 }, minWidth: 0 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Iconify 
                    icon="solar:gallery-circle-outline" 
                    width={18} 
                    sx={{ color: 'primary.main', flexShrink: 0 }} 
                  />
                  <Typography 
                    variant="subtitle2" 
                    noWrap
                    sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}
                  >
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
                      fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                      lineHeight: 1.5,
                    }}
                  >
                    {item.caption}
                  </Typography>
                )}
                {onClick && (
                  <Typography 
                    variant="caption" 
                    color="primary" 
                    sx={{ 
                      mt: 'auto !important',
                      fontWeight: 600,
                      fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                    }}
                  >
                    {t('media.clickToExpand') || 'Haz clic para expandir'}
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
              cursor: 'pointer',
              '&:hover': {
                boxShadow: 4,
                transform: 'translateY(-2px)',
              },
            }}
            onClick={onClick}
          >
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={{ xs: 0, sm: 2 }} 
              sx={{ height: '100%' }}
            >
              {/* Video Thumbnail/Preview */}
              <Box
                sx={{
                  position: 'relative',
                  width: { xs: '100%', sm: 200 },
                  height: { xs: 200, sm: 120 },
                  flexShrink: 0,
                  bgcolor: 'grey.900',
                  overflow: 'hidden',
                }}
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
                    {/* Play button overlay */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: { xs: 56, sm: 48 },
                        height: { xs: 56, sm: 48 },
                        borderRadius: '50%',
                        bgcolor: 'rgba(255, 255, 255, 0.95)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 1)',
                          transform: 'translate(-50%, -50%) scale(1.1)',
                          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)',
                        },
                      }}
                    >
                      <Iconify 
                        icon="solar:play-circle-bold" 
                        width={24}
                        sx={{ 
                          color: 'error.main', 
                          ml: 0.5,
                          width: { xs: 28, sm: 24 },
                          height: { xs: 28, sm: 24 },
                        }} 
                      />
                    </Box>
                  </>
                ) : (
                  <>
                    {/* Video element for auto-generated thumbnail */}
                    <Box
                      component="video"
                      src={item.url}
                      preload="metadata"
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    {/* Dark overlay */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: 'rgba(0, 0, 0, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Box
                        sx={{
                          width: { xs: 56, sm: 48 },
                          height: { xs: 56, sm: 48 },
                          borderRadius: '50%',
                          bgcolor: 'rgba(255, 255, 255, 0.95)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 1)',
                            transform: 'scale(1.1)',
                            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)',
                          },
                        }}
                      >
                        <Iconify 
                          icon="solar:play-circle-bold" 
                          width={24}
                          sx={{ 
                            color: 'error.main', 
                            ml: 0.5,
                            width: { xs: 28, sm: 24 },
                            height: { xs: 28, sm: 24 },
                          }} 
                        />
                      </Box>
                    </Box>
                  </>
                )}
              </Box>

              {/* Content */}
              <Stack spacing={1} sx={{ flex: 1, p: { xs: 2, sm: 2 }, minWidth: 0 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Iconify 
                    icon="solar:videocamera-record-bold" 
                    width={18} 
                    sx={{ color: 'error.main', flexShrink: 0 }} 
                  />
                  <Typography 
                    variant="subtitle2" 
                    noWrap
                    sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}
                  >
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
                      fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                      lineHeight: 1.5,
                    }}
                  >
                    {item.caption}
                  </Typography>
                )}
                <Stack 
                  direction="row" 
                  spacing={1} 
                  alignItems="center"
                  sx={{ mt: 'auto !important' }}
                >
                  {item.duration && (
                    <Chip
                      label={formatDuration(item.duration)}
                      size="small"
                      icon={<Iconify icon="solar:clock-circle-bold" width={14} />}
                      sx={{ 
                        width: 'fit-content',
                        '& .MuiChip-label': {
                          fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                        },
                      }}
                    />
                  )}
                  <Typography 
                    variant="caption" 
                    color="primary" 
                    sx={{ 
                      fontWeight: 600,
                      fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                    }}
                  >
                    {t('media.clickToPlay') || 'Haz clic para reproducir'}
                  </Typography>
                </Stack>
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
  const [zoom, setZoom] = useState(1);

  if (!media) return null;

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 2.5));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  return (
    <Dialog
      open={!!media}
      onClose={onClose}
      maxWidth={false}
      fullScreen
      PaperProps={{
        sx: {
          bgcolor: 'rgba(0, 0, 0, 0.95)',
          backdropFilter: 'blur(10px)',
        },
      }}
    >
      <DialogContent 
        sx={{ 
          p: 0, 
          position: 'relative', 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: 8,
            height: 8,
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 1,
          },
        }}
      >
        {/* Close Button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: 10,
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.2)',
            },
          }}
        >
          <Iconify icon="solar:close-circle-bold" width={28} />
        </IconButton>

        {/* Zoom Controls - Only for images */}
        {media.type === 'image' && (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              position: 'fixed',
              bottom: 80,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
              p: 1,
            }}
          >
            <IconButton
              size="small"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              sx={{
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
                '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.3)' },
              }}
            >
              <Iconify icon="carbon:zoom-out" width={20} />
            </IconButton>
            
            <Chip
              label={`${Math.round(zoom * 100)}%`}
              size="small"
              sx={{
                color: 'white',
                bgcolor: 'transparent',
                border: 'none',
                fontWeight: 600,
                minWidth: 60,
              }}
            />
            
            <IconButton
              size="small"
              onClick={handleResetZoom}
              disabled={zoom === 1}
              sx={{
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
                '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.3)' },
              }}
            >
              <Iconify icon="solar:restart-bold" width={20} />
            </IconButton>
            
            <IconButton
              size="small"
              onClick={handleZoomIn}
              disabled={zoom >= 2.5}
              sx={{
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
                '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.3)' },
              }}
            >
              <Iconify icon="solar:magnifer-zoom-in-bold" width={20} />
            </IconButton>
          </Stack>
        )}

        {/* Media Container */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100%',
            width: '100%',
            p: 3,
          }}
        >
          {/* Image */}
          {media.type === 'image' && (
            <Box
              component="img"
              src={media.url}
              alt={media.altText || media.name}
              sx={{
                maxWidth: '90vw',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: 2,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                transform: `scale(${zoom})`,
                transition: 'transform 0.3s ease',
                cursor: zoom > 1 ? 'move' : 'default',
              }}
            />
          )}

          {/* Video */}
          {media.type === 'video' && (
            <Box
              component="video"
              src={media.url}
              poster={media.thumbnailUrl}
              autoPlay
              controls
              sx={{
                maxWidth: '90vw',
                maxHeight: '80vh',
                borderRadius: 2,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              }}
            />
          )}
        </Box>

        {/* Caption */}
        {media.caption && (
          <Box
            sx={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              textAlign: 'center',
              py: 2,
              px: 3,
              bgcolor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'white',
                maxWidth: 800,
                mx: 'auto',
              }}
            >
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
